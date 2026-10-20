-- ============================================================
-- Schema Supabase: Buku Tamu & Doa Restu + Konfirmasi Kehadiran
-- Project: Undangan Pernikahan Raka & Nadya (Undigital)
-- Cara pakai: buka Supabase Dashboard > SQL Editor > New Query
--             copy-paste seluruh file ini > Run
-- ============================================================

-- 1. Tabel utama: rsvp_wishes
create table if not exists public.rsvp_wishes (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 100),
  attendance text not null default 'Hadir'
    check (attendance in ('Hadir', 'Berhalangan')),
  guest_count text not null default '1 Orang'
    check (guest_count in ('1 Orang', '2 Orang', '3 Orang', '4 Orang', '5+ Orang')),
  message text not null check (char_length(message) between 1 and 1000),
  is_approved boolean not null default true,
  created_at timestamptz not null default now()
);

-- Index agar feed terbaru cepat
create index if not exists rsvp_wishes_created_at_idx
  on public.rsvp_wishes (created_at desc);

-- Index untuk rekap kehadiran
create index if not exists rsvp_wishes_attendance_idx
  on public.rsvp_wishes (attendance);

-- 2. Aktifkan Row Level Security
alter table public.rsvp_wishes enable row level security;

-- 3. Policy: semua orang (anon) boleh MEMBACA ucapan yang disetujui
drop policy if exists "rsvp_read_approved" on public.rsvp_wishes;
create policy "rsvp_read_approved"
  on public.rsvp_wishes for select
  to anon, authenticated
  using (is_approved = true);

-- 4. Policy: semua orang (anon) boleh MENGIRIM ucapan baru
--    (validasi panjang sudah dijaga CHECK constraint di atas)
drop policy if exists "rsvp_insert_public" on public.rsvp_wishes;
create policy "rsvp_insert_public"
  on public.rsvp_wishes for insert
  to anon, authenticated
  with check (
    char_length(name) between 1 and 100
    and char_length(message) between 1 and 1000
    and attendance in ('Hadir', 'Berhalangan')
  );

-- 5. (Opsional) View rekap konfirmasi kehadiran untuk dashboard
create or replace view public.rsvp_summary as
select
  count(*)::int as total_ucapan,
  count(*) filter (where attendance = 'Hadir')::int as total_hadir,
  count(*) filter (where attendance = 'Berhalangan')::int as total_berhalangan,
  coalesce(sum(
    case
      when attendance = 'Hadir' and guest_count = '1 Orang' then 1
      when attendance = 'Hadir' and guest_count = '2 Orang' then 2
      when attendance = 'Hadir' and guest_count = '3 Orang' then 3
      when attendance = 'Hadir' and guest_count = '4 Orang' then 4
      when attendance = 'Hadir' and guest_count = '5+ Orang' then 5
      else 0
    end
  ), 0)::int as estimasi_tamu_hadir
from public.rsvp_wishes
where is_approved = true;

-- 6. Data contoh (boleh dihapus setelah tes)
insert into public.rsvp_wishes (name, attendance, guest_count, message)
values
  ('Farhan & Anisa', 'Hadir', '2 Orang', 'Selamat menempuh hidup baru Raka & Nadya! Semoga menjadi keluarga yang sakinah, mawaddah, warrahmah. Dilimpahi keberkahan selalu. Aamiin!'),
  ('Dr. Rizky Ramadhan', 'Hadir', '1 Orang', 'Barakallahu lakuma wa baraka alaikuma wa jama''a bainakuma fii khair. Bahagia selalu saudaraku sampai akhir hayat!'),
  ('Melati Maharani', 'Berhalangan', '1 Orang', 'Selamat Nadya cantik & Mas Raka! Mohon maaf sekali belum bisa hadir langsung ke Makassar, doa terbaik dipanjatkan dari Jakarta!');

-- 6b. Aktifkan Realtime agar feed update otomatis di semua tamu
-- (idempoten: aman dijalankan ulang meski tabel sudah anggota publication)
do $$
begin
  alter publication supabase_realtime add table public.rsvp_wishes;
exception when duplicate_object then
  -- sudah anggota publication, abaikan
end $$;

-- 7. Verifikasi
select * from public.rsvp_summary;
select id, name, attendance, guest_count, left(message, 40) as message_preview, created_at
from public.rsvp_wishes
order by created_at desc
limit 10;
