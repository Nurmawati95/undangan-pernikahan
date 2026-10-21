-- ============================================================
-- Schema Supabase: Otorisasi Dashboard (Super Admin / Admin / Pelanggan)
-- Project: Undangan Pernikahan Raka & Nadya (Undigital)
-- Cara pakai: Supabase Dashboard > SQL Editor > New Query > Run
-- Idempoten: aman dijalankan berkali-kali.
-- ============================================================

-- 1. Daftar akun yang sudah diotorisasi (role dipatok di sini).
--    Dipakai saat signup Google / email pertama kali.
create table if not exists public.dashboard_allowlist (
  email text primary key,
  role text not null default 'pelanggan'
    check (role in ('admin', 'pelanggan', 'super_admin')),
  note text,
  created_at timestamptz not null default now()
);

-- 2. Profil + role tiap akun dashboard.
--    Ini SOURCE OF TRUTH role (bukan user_metadata, yang bisa diubah user).
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'pelanggan'
    check (role in ('admin', 'pelanggan', 'super_admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles (role);

-- 3. RLS: hanya user yang bisa baca profilnya sendiri (atau super admin).
alter table public.profiles enable row level security;
alter table public.dashboard_allowlist enable row level security;

-- 4. Helper: apakah user saat ini ber-role tertentu.
--    SECURITY DEFINER + search_path aman agar tidak bisa di-inject lewat caller.
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.role from public.profiles p where p.id = auth.uid()
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.role = 'super_admin' from public.profiles p where p.id = auth.uid()),
    false
  )
$$;

-- 5. Policy profiles
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_super_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid() or public.is_super_admin())
  with check (
    -- Role HANYA boleh diubah oleh super admin.
    -- User biasa boleh mengubah kolom lain, tapi role & is_active dikunci.
    (public.is_super_admin() or (role = (select p.role from public.profiles p where p.id = auth.uid())
                              and is_active = (select p.is_active from public.profiles p where p.id = auth.uid())))
  );

drop policy if exists "profiles_delete_super_admin" on public.profiles;
create policy "profiles_delete_super_admin"
  on public.profiles for delete
  to authenticated
  using (public.is_super_admin());

-- 6. Policy allowlist: user boleh cek dirinya sendiri; tulis hanya super admin.
drop policy if exists "allowlist_select_own" on public.dashboard_allowlist;
create policy "allowlist_select_own"
  on public.dashboard_allowlist for select
  to authenticated
  using (email = (auth.jwt() ->> 'email') or public.is_super_admin());

drop policy if exists "allowlist_write_super_admin" on public.dashboard_allowlist;
create policy "allowlist_write_super_admin"
  on public.dashboard_allowlist for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- 7. Auto-provision profil saat akun dibuat (email/password ATAU Google).
--    Role diambil dari dashboard_allowlist.
--    Email yang TIDAK ada di allowlist -> tidak dibuatkan profil -> tidak bisa masuk dashboard.
--
--    PRODUKSI: aturan bootstrap (akun pertama = super_admin saat allowlist kosong)
--    SUDAH DIHAPUS. Super Admin pertama harus dimasukkan ke dashboard_allowlist
--    (role 'super_admin') SEBELUM akun dibuat, mis. via SQL Editor:
--      insert into public.dashboard_allowlist (email, role) values ('admin@contoh.com', 'super_admin');
--    Lalu buat akun auth.users untuk email tersebut (Supabase Auth > Users > Invite,
--    atau via Admin API dengan service_role key). Akun yang dibuat tanpa izin
--    allowlist tidak mendapat profil dan otomatis ditolak dashboard.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_role text;
  v_name text;
begin
  v_email := lower(coalesce(new.email, ''));
  v_name := coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(v_email, '@', 1));

  select a.role into v_role
  from public.dashboard_allowlist a
  where lower(a.email) = v_email;

  -- Tidak ada di allowlist -> tidak dibuatkan profil -> tidak bisa masuk dashboard.
  if v_email <> '' and v_role is not null then
    insert into public.profiles (id, email, full_name, role)
    values (new.id, v_email, v_name, v_role)
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 8. Guard anti-eskalasi role (lapisan kedua, di luar RLS).
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.role is distinct from old.role) or (new.is_active is distinct from old.is_active) then
    if not public.is_super_admin() then
      raise exception 'Perubahan role atau status akun hanya bisa dilakukan oleh Super Admin';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_guard_role on public.profiles;
create trigger profiles_guard_role
  before update on public.profiles
  for each row execute function public.prevent_role_escalation();

-- 9. Verifikasi
select * from public.profiles order by created_at desc;
select * from public.dashboard_allowlist order by created_at desc;
