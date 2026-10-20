# Undangan Pernikahan Digital — Raka & Nadya

Website undangan pernikahan digital statis (single-file), diambil dari desain
`undangan_pernikahan_digital_raka_nadya_dengan_buka_undangan`.

Live file utama: **`index.html`** (892 baris, ~55 KB).

## Fitur

- Cover full-screen **Buka Undangan** (`openInvitation()` + `body.locked-scroll` + animasi `envelope-opening`)
- Countdown ke `2026-10-24T08:00:00+08:00` (WITA)
- Galeri, RSVP / guestbook (JS lokal), copy rekening + toast
- Styling Tailwind via CDN, font Google Fonts (Cormorant Garamond, Playfair Display, Plus Jakarta Sans, Alex Brush), ikon Font Awesome
- Foto pre-wedding via `lh3.googleusercontent.com`

> Butuh koneksi internet — Tailwind, font, ikon, dan foto dimuat dari CDN.

## Struktur

```
.
├── index.html                         # halaman utama (hasil copy dari design/.../code.html)
├── package.json                       # script dev/preview (tidak ada dependencies)
├── package-lock.json                  # kosong, aman dihapus / akan tergenerate saat npm install
└── design/
    ├── undangan_pernikahan_digital_raka_nadya_dengan_buka_undangan/
    │   ├── code.html                  # sumber asli index.html
    │   └── screen.png                 # preview
    ├── undangan_pernikahan_digital_raka_nadya/
    ├── studio_editor_undangan_raka_nadya/
    ├── dashboard_koleksi_acara_studio_editor_7_tab/
    └── royal_nusantara_matrimony/DESIGN.md
```

## Cara menjalankan (tanpa install)

Paling gampang:

1. Buka File Explorer ke `d:\GITHUB\undangan-pernikahan`
2. Double-klik `index.html` → terbuka di browser
3. Klik tombol **Buka Undangan**

Via VS Code + Live Server (disarankan untuk tampilan HP):

1. Buka folder ini di VS Code
2. Install extension `Live Server` (Ritwick Dey)
3. Klik kanan `index.html` → `Open with Live Server`

Via terminal:

```powershell
cd d:\GITHUB\undangan-pernikahan

# butuh Node.js (sudah ada v24.21.0 + npm 11.19.0)
npm run dev      # npx serve .
# atau
npm run preview  # npx serve . -l 3000
# atau tanpa npm
npx serve .
python -m http.server 8000
```

Lalu buka `http://localhost:3000` (atau port yang ditampilkan).

## Deploy

Ini situs statis — tidak ada build step. Upload `index.html` saja cukup.

- **Netlify / Vercel / Cloudflare Pages / GitHub Pages:** arahkan publish directory ke root (`.`), tidak ada build command.
- **GitHub Pages:** push repo, Settings → Pages → Deploy from branch → `main` / root.

## Catatan

- Tidak perlu `npm install` — tidak ada `dependencies`. `npm run dev` memakai `npx serve` on-demand saat pertama dijalankan.
- `package-lock.json` saat ini kosong (`{"packages":{}}`). Aman dihapus, atau biarkan — akan tergenerate otomatis jika nanti ada dependencies.
- RSVP / ucapan saat ini hanya tampil di browser (tidak tersimpan ke server / database). Kalau butuh simpan permanen (Supabase / Google Sheets / dsb), perlu tambahan backend.
