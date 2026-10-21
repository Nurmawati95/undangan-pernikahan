/**
 * Validator Studio Editor — memeriksa:
 *  1. Keseimbangan tag HTML (stack-based)
 *  2. ID duplikat di studio-editor.html
 *  3. Cross-check selector $('#id') di studio-editor.js vs ID HTML
 *  4. Encoding UTF-8 valid
 *  5. Referensi aset lokal yang tidak ada
 */
const fs = require('fs');

const HTML_FILE = 'studio-editor.html';
const JS_FILE = 'studio-editor.js';

const html = fs.readFileSync(HTML_FILE, 'utf8');
const js = fs.readFileSync(JS_FILE, 'utf8');

let problems = 0;
const warn = (m) => { problems++; console.log('  [MASALAH] ' + m); };
const info = (m) => console.log('  ' + m);

console.log('=== 1. VALIDASI ENCODING ===');
if (html.charCodeAt(0) === 0xFEFF) warn('studio-editor.html memiliki BOM UTF-8');
else info('BOM: tidak ada (baik)');
let badChars = 0;
for (let i = 0; i < html.length; i++) if (html.charCodeAt(i) === 0xFFFD) badChars++;
if (badChars) warn('Terdapat ' + badChars + ' karakter pengganti (U+FFFD)');
else info('Tidak ada karakter U+FFFD (encoding UTF-8 aman)');
if (/Ã[\x80-\xBF]|â€/.test(html)) warn('Terdapat indikasi mojibake (double-encoding).');
else info('Tidak ada indikasi mojibake');

console.log('\n=== 2. KESEIMBANGAN TAG ===');
const VOID = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr','path','circle','rect','line','polyline','polygon','ellipse','use','stop']);
const stack = [];
const errors = [];
const tagRe = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>/g;
let m;
function countLinesTo(idx) {
  let n = 1;
  for (let i = 0; i < idx; i++) if (html.charCodeAt(i) === 10) n++;
  return n;
}
while ((m = tagRe.exec(html)) !== null) {
  const closing = m[1], name = m[2], selfClose = m[4];
  const tag = name.toLowerCase();
  const at = countLinesTo(m.index);
  if (tag === 'script' || tag === 'style') {
    const closeIdx = html.toLowerCase().indexOf('</' + tag, m.index);
    if (closeIdx !== -1) {
      const end = html.indexOf('>', closeIdx);
      tagRe.lastIndex = end + 1;
      continue;
    }
  }
  if (VOID.has(tag) || selfClose === '/') continue;
  if (!closing) {
    stack.push({ tag: tag, line: at });
  } else {
    if (!stack.length) { errors.push('Tag penutup </' + tag + '> tanpa pembuka (baris ~' + at + ')'); continue; }
    const top = stack[stack.length - 1];
    if (top.tag === tag) { stack.pop(); }
    else {
      let found = -1;
      for (let i = stack.length - 1; i >= 0; i--) if (stack[i].tag === tag) { found = i; break; }
      if (found === -1) errors.push('Tag penutup </' + tag + '> tidak punya pembuka (baris ~' + at + ')');
      else {
        const unclosed = stack.slice(found + 1).map(s => '<' + s.tag + '> (baris ' + s.line + ')');
        errors.push('Tag <' + top.tag + '> (baris ' + top.line + ') ditutup oleh </' + tag + '> — tidak tertutup: ' + unclosed.join(', '));
        stack.length = found;
        stack.pop();
      }
    }
  }
}
stack.forEach(s => errors.push('Tag <' + s.tag + '> dari baris ' + s.line + ' tidak ditutup'));
if (errors.length) { errors.slice(0, 25).forEach(e => warn(e)); if (errors.length > 25) warn('... dan ' + (errors.length - 25) + ' masalah lain'); }
else info('Semua tag HTML seimbang (stack-based).');

console.log('\n=== 3. ID DUPLIKAT ===');
const idRe = /\sid="([^"]+)"/g;
const idCount = new Map();
while ((m = idRe.exec(html)) !== null) idCount.set(m[1], (idCount.get(m[1]) || 0) + 1);
const dups = [...idCount.entries()].filter(([, c]) => c > 1);
if (dups.length) dups.forEach(e => warn('ID duplikat: #' + e[0] + ' (' + e[1] + 'x)'));
else info('Total ' + idCount.size + ' ID unik, tidak ada duplikat.');

console.log('\n=== 4. CROSS-CHECK SELECTOR JS <-> ID HTML ===');
const htmlIds = new Set(idCount.keys());
const jsIds = new Set();
const selRe = /\$\(\s*['"]#([A-Za-z0-9_-]+)['"]\s*\)/g;
while ((m = selRe.exec(js)) !== null) jsIds.add(m[1]);
const missing = [...jsIds].filter(id => !htmlIds.has(id));
if (missing.length) missing.forEach(id => warn('Selector $("#' + id + '") di JS tapi ID tidak ada di HTML'));
else info('Semua ' + jsIds.size + ' selector $("#id") di JS memiliki ID yang cocok di HTML.');

console.log('\n=== 5. TAB & PANEL ===');
const tabRe = /class="[^"]*studio-tab[^"]*"[^>]*data-tab="(\d+)"/g;
const tabs = new Set();
while ((m = tabRe.exec(html)) !== null) tabs.add(m[1]);
info('Tab ditemukan: ' + [...tabs].sort().join(', '));
const panelRe = /id="panel-(\d+)"/g;
const panels = new Set();
while ((m = panelRe.exec(html)) !== null) panels.add(m[1]);
info('Panel ditemukan: ' + [...panels].sort().join(', '));
for (let i = 1; i <= 7; i++) {
  if (!tabs.has(String(i))) warn('Tab ' + i + ' tidak ada');
  if (!panels.has(String(i))) warn('Panel ' + i + ' tidak ada');
}

console.log('\n=== 6. ASET LOKAL ===');
const assetRe = /(?:src|href)="((?:assets|src-studio)\/[^"]+)"/g;
const assets = new Set();
while ((m = assetRe.exec(html)) !== null) assets.add(m[1]);
[...assets].forEach(a => { if (!fs.existsSync(a.split('?')[0])) warn('Aset tidak ditemukan: ' + a); });
info('Total ' + assets.size + ' referensi aset lokal diperiksa.');

console.log('\n=== 7. SCRIPT INCLUSION ===');
if (/<script[^>]+src="studio-editor\.js"/.test(html)) info('studio-editor.js disertakan via <script src>.');
else warn('studio-editor.js TIDAK disertakan di HTML.');
if (/tailwind/i.test(html)) info('Tailwind terdeteksi di HTML.');

console.log('\n=== RINGKASAN ===');
console.log(problems === 0 ? 'SEMUA PEMERIKSAAN LULUS (' + problems + ' masalah).' : problems + ' MASALAH DITEMUKAN.');
process.exit(problems === 0 ? 0 : 1);

