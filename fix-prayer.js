// Perbaiki teks doa di src-studio/81-tab7.html (UTF-8 safe)
const fs = require('fs');
const p = 'src-studio/81-tab7.html';
let s = fs.readFileSync(p, 'utf8');
const bad = /<textarea[^>]*id="prayerInput"[^>]*>[\s\S]*?<\/textarea>/;
if (!bad.test(s)) { console.log('pattern tidak ditemukan'); process.exit(1); }
s = s.replace(bad, '<textarea class="w-full bg-surface-container-lowest p-space-sm rounded-lg text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-secondary/40" id="prayerInput" rows="3">Semoga kalian selalu berbbahagia dalam cinta, rukun, dan dilimpahi keberkahan.</textarea>');
fs.writeFileSync(p, s, 'utf8');
console.log('OK prayerInput diperbaiki');
