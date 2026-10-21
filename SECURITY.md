# Keamanan Dashboard Undigital

Dokumen ini merangkum langkah-langkah keamanan yang sudah diterapkan dan
langkah yang harus dilakukan sebelum produksi.

## Yang sudah diterapkan

- Login Supabase (email/password) via `auth-guard.js` + `dashboard-auth.js`.
- Fail-closed CSS: `body.dash-page:not(.dash-auth-ready) > * { visibility: hidden }`
  pada `dashboard.html` dan `studio-editor.html`, sehingga tidak ada kilatan
  konten sebelum akses terverifikasi.
- Profil & role dibaca dari tabel `public.profiles` (source of truth), bukan
  `user_metadata`. RLS + trigger `prevent_role_escalation` mencegah eskalasi.
- Allowlist `public.dashboard_allowlist`: email yang tidak terdaftar tidak
  mendapat profil dan otomatis ditolak dashboard.
- Role-based UI: menu/aksi disembunyikan sesuai role (lihat `ROLE_NAV`,
  `ROLE_ACTION` di `auth-guard.js`). Tombol "Simpan & Publikasikan" di
  `studio-editor.html` hanya untuk admin & super_admin.
- `studio-editor.html` kini dilindungi `dash-page` + `studio-auth.js`
  (sebelumnya tidak terlindungi).
- Kredensial (service_role) dihapus dari `.tmp-browser/*`; dibaca dari env
  `SB_SECRET`. Direktori `.tmp-browser/` di-gitignore.
- Open-redirect dicegah: `ALLOWED_NEXT` whitelist di `login.js`
  (`dashboard.html`, `studio-editor.html`).

## Checklist sebelum produksi

1. **Rotasi kunci Supabase** yang sempat terekspos di repo lama
   (anon key & service_role key). Setelah rotasi, perbarui:
   - `supabase-config.js` (anon key — aman untuk frontend).
   - Environment variable `SB_SECRET` (service_role) di server/CI.
2. **Tetapkan Super Admin produksi**:
   - Masukkan email ke `dashboard_allowlist` dengan role `super_admin`:
     ```sql
     insert into public.dashboard_allowlist (email, role, note)
     values ('admin@contoh.com', 'super_admin', 'Super Admin produksi');
     ```
   - Buat akun `auth.users` untuk email tersebut (Supabase Auth > Users >
     Invite, atau Admin API dengan service_role key).
   - Aturan bootstrap (akun pertama = super_admin saat allowlist kosong)
     sudah dihapus dari `schema-auth.sql`. Jangan mengembalikannya.
3. **Google OAuth** (opsional): isi kredensial Google di Supabase Auth >
   Providers > Google, lalu aktifkan redirect URL produksi.
4. **Deployment URL**: perbarui `SB_URL`/`SUPABASE_URL` dan CORS/redirect
   settings di Supabase sesuai domain produksi.
5. **Verifikasi `admin-api-*` user uji** sudah dihapus (cek di Supabase
   Dashboard > Authentication > Users). Script `.tmp-browser/admin-probe.js`
   membutuhkan `SB_SECRET` valid untuk menghapus otomatis.
6. Jalankan `schema-auth.sql` di SQL Editor produksi (idempoten).
7. Pastikan `.env` dan `.tmp-browser/` tidak ter-commit (lihat `.gitignore`).

## Pengujian

- `.tmp-browser/test-auth.js` — 43 skenario (login, role, allowlist,
  nonaktif, persistensi, logout, flash, studio-editor).
- `.tmp-browser/flash-probe.js` — 0 pelanggaran kilatan konten.
- `validate-studio.js` — validasi HTML studio-editor.

## Catatan

Pemeriksaan di sisi klien (`auth-guard.js`) hanya untuk UX/redireksi.
Penegakan yang sesungguhnya ada di RLS + trigger anti-eskalasi di database.
