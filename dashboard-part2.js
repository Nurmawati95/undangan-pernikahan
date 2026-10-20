// Dashboard Supabase: isi stat + link tamu + realtime (bagian 2/2)
function dashFillStats(rows) {
  var hadir = rows.filter(function (r) { return r.attendance === 'Hadir'; });
  var estimasi = hadir.reduce(function (s, r) { return s + dashCountToGuests(r.guest_count); }, 0);
  var total = rows.length;
  var rate = total ? Math.round((hadir.length / total) * 100) : 0;
  var map = [
    ['Total Tamu RSVP', String(total)],
    ['Total Acara', '1'],
    ['Acara Published', '1'],
    ['Draft Acara', '0']
  ];
  map.forEach(function (pair) {
    var label = pair[0], val = pair[1];
    var spans = Array.prototype.slice.call(document.querySelectorAll('span'));
    spans.forEach(function (sp) {
      if (sp.textContent.trim() === label) {
        var card = sp.closest('div');
        if (card && card.parentElement) {
          var nums = card.parentElement.querySelectorAll('span');
          nums.forEach(function (n) {
            if (/^[\d.,]+$/.test(n.textContent.trim()) && n.textContent.trim().length < 8) {
              if (label === 'Total Tamu RSVP') n.textContent = val;
            }
          });
        }
      }
    });
  });
  var sub = document.querySelectorAll('span');
  sub.forEach(function (sp) {
    if (sp.textContent.indexOf('Tingkat Konfirmasi') >= 0) sp.textContent = rate + '% Tingkat Konfirmasi';
    if (sp.textContent.indexOf('Konfirmasi Tamu') >= 0) {
      var box = sp.parentElement;
      if (box) {
        var strong = box.querySelectorAll('span')[1];
        if (strong) strong.textContent = hadir.length + ' / ' + total + ' Tamu';
      }
    }
  });
  dashSetStatus('live — ' + total + ' ucapan, ' + hadir.length + ' hadir, est. ' + estimasi + ' tamu');
}

function dashLoad() {
  if (!dashSb) { dashSetStatus('belum terhubung (jalankan schema.sql)'); return; }
  dashSb.from('rsvp_wishes').select('attendance, guest_count')
    .eq('is_approved', true).limit(500)
    .then(function (res) {
      if (res.error) throw res.error;
      dashFillStats(res.data || []);
    })
    .catch(function (e) { console.warn(e); dashSetStatus('gagal memuat'); });
}

function dashFixGuestLinks() {
  var base = window.location.origin;
  var out = document.getElementById('guest-link-output');
  if (out) out.textContent = base + '/?to=Bapak+Budi+Santoso+%26+Keluarga';
}

window.addEventListener('DOMContentLoaded', function () {
  dashFixGuestLinks();
  dashLoad();
  if (dashSb) {
    try {
      dashSb.channel('dash_rsvp').on('postgres_changes',
        { event: '*', schema: 'public', table: 'rsvp_wishes' },
        function () { dashLoad(); }).subscribe();
    } catch (e) { console.warn(e); }
  }
  if (typeof generateGuestLink === 'function') {
    var origGen = generateGuestLink;
    generateGuestLink = function () {
      var nameEl = document.getElementById('guest-name-input');
      var name = nameEl ? nameEl.value.trim() : 'Tamu Undangan';
      var encoded = encodeURIComponent(name).replace(/%20/g, '+');
      var full = window.location.origin + '/?to=' + encoded;
      var o = document.getElementById('guest-link-output');
      if (o) o.innerText = full;
    };
  }
});
