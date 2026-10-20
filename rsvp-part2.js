// Bagian 2: render feed + ringkasan + load dari Supabase
function guestCountToNumber(guestCount) {
  var map = { '1 Orang': 1, '2 Orang': 2, '3 Orang': 3, '4 Orang': 4, '5+ Orang': 5 };
  return map[guestCount] || 1;
}

function updateSummary(rows) {
  var hadir = 0, berhalangan = 0, estimasi = 0;
  rows.forEach(function (r) {
    if (r.attendance === 'Hadir') { hadir++; estimasi += guestCountToNumber(r.guest_count); }
    else { berhalangan++; }
  });
  var a = document.getElementById('summary-hadir');
  var b = document.getElementById('summary-berhalangan');
  var c = document.getElementById('summary-tamu');
  if (a) a.innerText = String(hadir);
  if (b) b.innerText = String(berhalangan);
  if (c) c.innerText = String(estimasi);
}

function renderWishes(rows) {
  var container = document.getElementById('wishes-container');
  var countEl = document.getElementById('wishes-count');
  if (!container) return;
  if (!rows || rows.length === 0) {
    container.innerHTML = '<p class="text-center py-6 text-xs text-stone-400">Belum ada ucapan. Jadilah yang pertama mengirim doa restu</p>';
    if (countEl) countEl.innerText = '0';
    updateSummary([]);
    return;
  }
  container.innerHTML = rows.map(wishCardHTML).join('');
  if (countEl) countEl.innerText = String(rows.length);
  updateSummary(rows);
}

function loadWishes() {
  var container = document.getElementById('wishes-container');
  if (!supabaseClient) {
    if (container) container.innerHTML = '<p class="text-center py-6 text-xs text-stone-400">Supabase belum terhubung. Jalankan schema.sql lalu refresh.</p>';
    return Promise.resolve();
  }
  return supabaseClient
    .from('rsvp_wishes')
    .select('id, name, attendance, guest_count, message, created_at')
    .eq('is_approved', true)
    .order('created_at', { ascending: false })
    .limit(100)
    .then(function (res) {
      if (res.error) throw res.error;
      renderWishes(res.data || []);
    })
    .catch(function (err) {
      console.warn('Gagal memuat ucapan:', err);
      if (container) container.innerHTML = '<p class="text-center py-6 text-xs text-stone-400">Gagal memuat ucapan. Cek koneksi / policy Supabase, lalu refresh.</p>';
    });
}
