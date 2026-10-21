// Validasi keseimbangan tag div & cek struktur file src-studio
const fs = require('fs');
const path = require('path');

const PARTS = 'src-studio';
const files = fs.readdirSync(PARTS).filter(f => f.endsWith('.html')).sort();

let total = 0;
for (const f of files) {
  const s = fs.readFileSync(path.join(PARTS, f), 'utf8');
  const opens = (s.match(/<div\b/g) || []).length;
  const closes = (s.match(/<\/div>/g) || []).length;
  total += opens - closes;
  const flag = opens === closes ? 'OK  ' : 'DIFF';
  console.log(`${flag} ${f}: open=${opens} close=${closes} net=${opens - closes}`);
}
console.log('--- total net (harus 0 jika file Balancing):', total);

// Cek tag yang wajib ada
const all = files.map(f => fs.readFileSync(path.join(PARTS, f), 'utf8')).join('\n');
const required = ['panel-1', 'panel-2', 'panel-3', 'panel-4', 'panel-5', 'panel-6', 'panel-7'];
for (const r of required) {
  console.log((all.includes(`id="${r}"`) ? 'OK  ' : 'MISS') + ' ' + r);
}
console.log('studio-panel hidden count:', (all.match(/studio-panel hidden/g) || []).length);
console.log('studio-panel (non-hidden) count:', (all.match(/class="studio-panel flex/g) || []).length);
