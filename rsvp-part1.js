// Bagian 1: init Supabase + helper tampilan
var supabaseClient = (function initSupabase() {
  try {
    if (window.supabase && window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
      return window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
    }
  } catch (err) { console.warn('Supabase init gagal:', err); }
  return null;
})();

function escapeHtml(string) {
  var div = document.createElement('div');
  div.innerText = string == null ? '' : String(string);
  return div.innerHTML;
}

function timeAgo(isoString) {
  var then = new Date(isoString);
  var diffMs = new Date() - then;
  if (isNaN(diffMs) || diffMs < 0) return 'Baru saja';
  var menit = Math.floor(diffMs / 60000);
  if (menit < 1) return 'Baru saja';
  if (menit < 60) return menit + ' menit lalu';
  var jam = Math.floor(menit / 60);
  if (jam < 24) return jam + ' jam lalu';
  var hari = Math.floor(jam / 24);
  if (hari < 30) return hari + ' hari lalu';
  return then.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function wishCardHTML(row) {
  var badge = row.attendance === 'Hadir'
    ? '<span class="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Hadir (' + escapeHtml(row.guest_count || '1 Orang') + ')</span>'
    : '<span class="text-[9px] bg-stone-100 text-stone-600 font-bold px-2 py-0.5 rounded-full">Berhalangan</span>';
  return '<div class="bg-brand-ivory rounded-xl p-3.5 border border-stone-200 shadow-sm">' +
    '<div class="flex items-center justify-between mb-1">' +
    '<p class="text-xs font-bold text-brand-darkteal">' + escapeHtml(row.name) + '</p>' + badge + '</div>' +
    '<p class="text-[11px] text-stone-700 leading-relaxed">' + escapeHtml(row.message) + '</p>' +
    '<span class="block text-[9px] text-stone-400 mt-1.5 italic">' + timeAgo(row.created_at) + '</span></div>';
}
