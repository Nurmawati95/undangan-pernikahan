// Build studio-editor.html dari dashboard.html (head) + src-studio/*.html (body)
// Dijalankan: node build-studio-editor.js
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PARTS_DIR = path.join(ROOT, 'src-studio');
const OUT = path.join(ROOT, 'studio-editor.html');

const dash = fs.readFileSync(path.join(ROOT, 'dashboard.html'), 'utf8');

// ---------- HEAD: identik dengan dashboard (Tailwind config & font) ----------
const headStart = dash.indexOf('<head>');
const headEnd = dash.indexOf('</head>') + '</head>'.length;
let head = dash.slice(headStart, headEnd);
head = head.replace(/<title>[\s\S]*?<\/title>/i, '<title>Studio Editor Undangan &middot; UNDIGITAL</title>');
// Favicon lokal agar tidak ada request 404 ke /favicon.ico
if (!/rel=["']icon["']/i.test(head)) {
  head = head.replace('</head>', '  <link href="assets/logo-undigital.png" rel="icon" type="image/png"/>\n</head>');
}

// ---------- BODY: gabungan parts terurut ----------
const files = fs.readdirSync(PARTS_DIR).filter(f => f.endsWith('.html')).sort();
let body = files.map(f => fs.readFileSync(path.join(PARTS_DIR, f), 'utf8')).join('\n');

// ---------- Normalisasi: brand + asset lokal ----------
body = body
  .replace(/Studio Mahligai/g, 'Studio UNDIGITAL')
  .replace(/Mahligai Nusantara Cloud/g, 'UNDIGITAL Nusantara Cloud')
  .replace(/Mahligai/g, 'UNDIGITAL')
  .replace(/https:\/\/lh3\.googleusercontent\.com\/[^"')]+/g, 'assets/couple.jpg');

const out = [
  '<!DOCTYPE html>',
  '<html lang="id">',
  head,
  '<body class="bg-surface font-body-md text-on-surface">',
  body,
  '</body>',
  '</html>',
  ''
].join('\n');

fs.writeFileSync(OUT, out, 'utf8');
console.log('OK studio-editor.html (' + out.length + ' bytes) dari ' + files.length + ' part: ' + files.join(', '));
