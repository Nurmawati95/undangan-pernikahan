// Verifikasi dashboard akhir
const fs = require('fs');
const h = fs.readFileSync('dashboard.html', 'utf8');
console.log('topnav:', h.includes('id="dash-topnav"'));
console.log('sb-status:', h.includes('id="dash-sb-status"'));
console.log('d-supabase:', h.includes('dashboard-supabase.js'));
console.log('d-part2:', h.includes('dashboard-part2.js'));
console.log('title:', h.includes('<title>Dashboard'));
console.log('sisa aida:', (h.match(/lh3\.googleusercontent/g) || []).length);
console.log('assets-couple:', (h.match(/assets\/couple\.jpg/g) || []).length);
console.log('switchTab:', h.includes('function switchTab'));
console.log('7 tab:', [0,1,2,3,4,5,6].every(function(i){ return h.includes('id="panel-' + i + '"'); }));
var re = /https:\/\/lh3\.googleusercontent\.com[^"'\s]*/g;
var m;
while ((m = re.exec(h)) !== null) {
  console.log('sisa:', m[0].slice(0, 120));
  console.log('konteks:', JSON.stringify(h.slice(Math.max(0, m.index - 120), m.index + 60)));
}

