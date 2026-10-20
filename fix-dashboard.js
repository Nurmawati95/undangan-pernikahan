// Bangun ulang dashboard.html dari file desain asli (bersih, tanpa dobel)
const fs = require('fs');
const path = require('path');
const src = path.join(__dirname, 'design', 'dashboard_koleksi_acara_studio_editor_7_tab', 'code.html');
const dst = path.join(__dirname, 'dashboard.html');
let h = fs.readFileSync(src, 'utf8');

// 1. Foto lokal
const imgMap = [
  ['AEtjO1WSd-ufJV5ICGP5G-QGrLuHci2qE9--hUMX1nCFvzKJluq6m_oN84lJZB8j0Is1m8AqixK8WnY7aha9894fqxEHy-10GL2ss5a2L0gqifHlUXKstwcn0o9JOo6fCPKb4FcnPndwr7QUsMI29LJsyxxU7TK6mTtNO2fpzVnVUbpUwxm3VsVMgNaqxCZpnqBjCZvsuScwIPA6OQYXaV4EPrkCfQa7moqqyScGqLF6ZLJ-aNGNfHr7hz8Z7lwf', 'assets/couple.jpg'],
  ['AEtjO1VOYDEFAESNJ2nUcR_8w5M-_YmDBOBGAzQXFcfXBXqRGCBbeypT5b0s2JyZ4Og7YO4AKBXVjb2SP4SSJZ63GWMdkA7DfWydjV2UF-fztaAuKpw1Uqn7YrTG6CeI95FDMdz4n9Eadwd_-K1VdIJ1khww1nWsJgQIFZJKNTy2Nlko-qTwq9UwI0zknbGfu27_QkjcNzAOUdlOSnPM3M9FwiwWspsw0JVZ9I5nbm7PZoks6j842uy5scY9H5An', 'assets/groom.jpg'],
  ['AEtjO1VsV0yxXeL1X0-yKmc2YChzsDgu7VoZrQ8-ni6Q0yWEeG-ctBOPfzJxnA7U0iZwd29YisyQlhkKOkEcROzASetWhOm7W8CFqoKpYZ8U2RaN_hrJEFE9ivJ1B_9Pco6sGTYCUK7TI-kXl2xaI9kWSa2B7-FEFFwDJdF0D6M3d-iw8cnRWz_NcoiXbGqV0wtZGZ2X0pErcagxgWGE-8hXJcxiI9doClz_b5I0D7yd4uC8oWYp--YxNYyu5bo3', 'assets/bride.jpg'],
];
let n = 0;
for (const [id, local] of imgMap) {
  const re = new RegExp('https://lh3\\.googleusercontent\\.com/aida/' + id, 'g');
  const m = h.match(re);
  if (m) { n += m.length; h = h.replace(re, local); }
}
console.log('foto:', n);

// 2. File asli SUDAH utuh: ...</script></head><body ...><aside>...<header>...<main>...
//    Jadi cukup selipkan <title> sebelum </head> pertama.
h = h.replace('</head>',
  '\n<title>Dashboard Koleksi Acara & Studio Editor — Undigital</title>\n</head>');
console.log('title disisip');

// 3. Selipkan nav antar-halaman tepat setelah <body ...> pertama
h = h.replace(/(<body[^>]*>)/,
  '$1\n<nav id="dash-topnav" class="max-w-6xl mx-auto px-4 md:px-8 pt-6 flex flex-wrap items-center gap-2 text-sm">'
  + '<a href="/" class="px-4 py-2 rounded-full bg-white border shadow-sm">Undangan</a>'
  + '<a href="/galeri.html" class="px-4 py-2 rounded-full bg-white border shadow-sm">Galeri</a>'
  + '<a href="/dokumentasi.html" class="px-4 py-2 rounded-full bg-white border shadow-sm">Dokumentasi</a>'
  + '<span class="px-4 py-2 rounded-full bg-[#b40066] text-white font-semibold">Dashboard & Studio Editor</span>'
  + '<span id="dash-sb-status" class="ml-auto text-xs opacity-70">Supabase: menghubungkan…</span>'
  + '</nav>');
console.log('nav disisip');

// 4. Suntik script Supabase sebelum </body> terakhir
h = h.replace('</body>',
  '<script src="supabase-config.js"></script>\n'
  + '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>\n'
  + '<script src="dashboard-supabase.js"></script>\n'
  + '<script src="dashboard-part2.js"></script>\n</body>');
console.log('script disuntik');

fs.writeFileSync(dst, h);
console.log('head:', (h.match(/<\/head>/g) || []).length,
  'body-open:', (h.match(/<body/g) || []).length,
  'body-close:', (h.match(/<\/body>/g) || []).length,
  'main-open:', (h.match(/<main/g) || []).length,
  'main-close:', (h.match(/<\/main>/g) || []).length,
  'bytes:', h.length);



