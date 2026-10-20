// Dashboard Supabase: statistik RSVP live (bagian 1/2)
var dashSb = null;
try {
  if (window.supabase && window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
    dashSb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  }
} catch (e) { console.warn('dash supabase init gagal', e); }

function dashSetStatus(msg) {
  var el = document.getElementById('dash-sb-status');
  if (el) el.textContent = 'Supabase: ' + msg;
}

function dashCountToGuests(g) {
  var map = { '1 Orang': 1, '2 Orang': 2, '3 Orang': 3, '4 Orang': 4, '5+ Orang': 5 };
  return map[g] || 1;
}
