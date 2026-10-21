// Build studio-editor.html dari dashboard.html (head) + part files (body)
// Jalankan: node build-studio-editor.js
// Build studio-editor.html dari design + branding UNDIGITAL + asset lokal
// Jalankan: node build-studio-editor.js
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DESIGN = path.join(ROOT, 'design', 'studio_editor_undangan_raka_nadya', 'code.html');
const NEW_PANELS = path.join(ROOT, 'src-studio');

const design = fs.readFileSync(DESIGN, 'utf8');
const dash = fs.readFileSync(path.join(ROOT, 'dashboard.html'), 'utf8');

// ---------- 1. HEAD dari dashboard (Tailwind config & font identik) ----------
const headStart = dash.indexOf('<head>');
const headEnd = dash.indexOf('</head>') + '</head>'.length;
let head = dash.slice(headStart, headEnd);
if (/<title>/i.test(head)) {
  head = head.replace(/<title>[\s\S]*?<\/title>/i, '<title>Studio Editor Undangan &middot; UNDIGITAL</title>');
} else {
  head = head.replace('</head>', '<title>Studio Editor Undangan &middot; UNDIGITAL</title></head>');
}

// ---------- 2. Ambil segmen dari design ----------
const mainStart = design.indexOf('<main');
const mainEnd = design.indexOf('</main>');
let main = design.slice(mainStart, mainEnd);
main = main.replace(/<script>[\s\S]*?<\/script>/g, '');

const MARK = {
  header: '<!-- Top Action & Context Header -->',
  ribbon: '<!-- Elegant Arching Multi-Tab Ribbon -->',
  s1: '<!-- SECTION 1: Master Parameters, Slug, Cover Image & Music -->',
  s2: '<!-- SECTION 2: Guest WhatsApp Link Generator (Instant Personalized URL) -->',
  s3: '<!-- SECTION 3: Elegant Modular Accordions for Other Steps -->',
  preview: '<!-- Right Live Mobile Canvas Preview Column (~35% width) -->',
  footer: '<!-- Bottom Global Studio Status Footer -->'
};

function cut(from, to) {
  const i = main.indexOf(from);
  if (i < 0) throw new Error('marker not found: ' + from);
  const j = to ? main.indexOf(to, i) : main.length;
  const seg = main.slice(i, j < 0 ? main.length : j);
  main = main.slice(0, i) + '<!--CUT-->' + main.slice(j < 0 ? main.length : j);
  return seg;
}

const segHeader = cut(MARK.header, MARK.ribbon);
const segRibbon = cut(MARK.ribbon, MARK.s1);
const segS1 = cut(MARK.s1, MARK.s2);
const segS2 = cut(MARK.s2, MARK.s3);
const segS3 = cut(MARK.s3, MARK.preview);
const segPreview = cut(MARK.preview, MARK.footer);
const segFooter = cut(MARK.footer, null);

// ---------- 3. Ekstrak 3 accordion dari S3 ----------
const accStart = segS3.indexOf('<!-- Accordion 1: Mempelai Profiles -->');
const acc2Start = segS3.indexOf('<!-- Accordion 2: Event Timeline & Maps -->');
const acc3Start = segS3.indexOf('<!-- Accordion 3: Modular Toggle Features (Switchboard) -->');
if (accStart < 0 || acc2Start < 0 || acc3Start < 0) throw new Error('accordion marker not found');

const acc1 = segS3.slice(accStart, acc2Start);
const acc2 = segS3.slice(acc2Start, acc3Start);
const acc3 = segS3.slice(acc3Start);

// ---------- 4. Asset lokal & branding UNDIGITAL ----------
const IMG_MAP = [
  ['https://lh3.googleusercontent.com/aida-public/AB6AXuDK32m5DIwASbndyElhanaVBDh2IzJThxPt1VvMc8YrLiHFzFEFTLK07tE5H1nhGwOYBAXB7I2Y6ptsQFW8A7g0sP3Pz2ac_nXSmpGlJqmENTHcyczOp2oNm4GP7D04HZMgmtBAImO2tVughTK2Lb37eQF5xT5ti1EoQbMa9UuW00KDa6XUg5MdZdlMrtW382PgBcQwcuAD5AO_Qu3HH97trSAXFwBWjdwZvrx8Af_Y0ARNHxo4eXVGFg', 'assets/groom.jpg'],
  ['https://lh3.googleusercontent.com/aida-public/AB6AXuDW5_ZIDxO3JKVkECZsezLkXCPGUNm0AjNlZeNzmD-LgxFHKLfOGikq0-4IDICfxFq36ueCIr555ephmF8HH10qzO2WO-B_Uu_MkoHCMAoCZiLbH3s9t_hIghldchCrjOhfcloedeUMw68UFHLW9ovxvWSdlFnmAnmEamrTmpYZn98RSsLIejw_lndYmIvBdZcygq7s3b74z3oiexahHHzx3isAr_Q10AbostHsxKgfDMvMGeB2ojUDQw', 'assets/bride.jpg'],
  ['https://lh3.googleusercontent.com/aida-public/AB6AXuAfn16H1saPM5FzMpxQxBU_yY3u0rudosNQDL-7srwA2JgzXqWuAw0XjOZBxiSwpKIr6dsNS_uUtqrJVH2Za46CZiGrRat_-JrTSJFuP9AK7lr8uNh42hl9mhOHQE14QbUUvIbMl0rW-st3f8VoqWGKsYVAkQNHd71hOeLFS383Zb5T9tdNIPNNrSDCPR0FabDElqkhpT3yv_hOlDmt-UxUyYx1S9pv31G6RqEJPOameuZrT8T8CKv9ug', 'assets/couple.jpg'],
  ['https://lh3.googleusercontent.com/aida-public/AB6AXuBbBaKVFvJWaBC1DNa7W8NRk5GnLDP22YomLvmZEUS2_Eb9taC10rmlCFadlMvA515YhUjs2AxJnngWMKJjdUC658x2pQEACBl7vtK57YZPSZeaUsteBcL4VTMXkmwzkG-nezlaQZgv5SIXLSUEYnmIWrIrzPY2Ois1n9u9ykQShJofQgkBr9JVr4NoF7gRgPy3z3oWq_0l6A3moHOJYZM5uz3CZ36JlvtkHNe_3htJIBkl8HLjOCqIpw', 'assets/couple.jpg']
];

function localize(s) {
  let out = s;
  IMG_MAP.forEach(([remote, local]) => { out = out.split(remote).join(local); });
  // sisa URL gambar eksternal yang tersisa -> fallback lokal
  out = out.replace(/https:\/\/lh3\.googleusercontent\.com\/[^"']+/g, 'assets/couple.jpg');
  return out;
}

const BRAND = [
  [/Studio Mahligai/g, 'Studio UNDIGITAL'],
  [/Mahligai Nusantara Cloud/g, 'UNDIGITAL Nusantara Cloud'],
  [/Mahligai/g, 'UNDIGITAL'],
  [/Nusantara Studio/g, 'Nusantara Studio']
];

function brand(s) {
  let out = s;
  BRAND.forEach(([re, to]) => { out = out.replace(re, to); });
  return out;
}

// ---------- 5. Part baru (file di src-studio) ----------
const newFiles = fs.existsSync(NEW_PANELS)
  ? fs.readdirSync(NEW_PANELS).filter(f => f.endsWith('.html')).sort()
  : [];
const newParts = newFiles.map(f => fs.readFileSync(path.join(NEW_PANELS, f), 'utf8'));

module.exports = {
  fs, path, ROOT, head, segHeader, segRibbon, segS1, segS2, segS3,
  acc1, acc2, acc3, segPreview, segFooter, localize, brand, newParts, newFiles
};
