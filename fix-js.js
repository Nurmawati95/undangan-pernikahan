// Bersihkan baris duplikat galeri yang tersisip di studio-editor.js
const fs = require('fs');
const p = 'studio-editor.js';
let s = fs.readFileSync(p, 'utf8');
let lines = s.split(/\r?\n/);

const pat = /^\s*\{ src: 'assets\/(couple|groom|bride)\.jpg', label: '[^']*', feature: (true|false) \},?$/;
const hits = [];
lines.forEach((l, i) => { if (pat.test(l)) hits.push(i); });
console.log('kandidat baris galeri:', hits.map(i => i + 1).join(', '));

// Temukan grup pertama (di dalam state.gallery) = 6 baris berturut-turut
let firstGroupStart = -1;
for (let k = 0; k + 5 < hits.length; k++) {
  if (hits[k + 5] - hits[k] === 5) { firstGroupStart = k; break; }
}
if (firstGroupStart === -1) { console.log('grup valid tidak ditemukan'); process.exit(1); }
const keep = new Set(hits.slice(firstGroupStart, firstGroupStart + 6));
const drop = hits.filter(i => !keep.has(i));
console.log('hapus baris:', drop.map(i => i + 1).join(', '));
lines = lines.filter((l, i) => !drop.includes(i));
fs.writeFileSync(p, lines.join('\n'), 'utf8');
console.log('OK dibersihkan');
