// Bagian 3: kirim form + realtime + boot
function handleFormSubmit(e) {
  e.preventDefault();
  var name = document.getElementById('guest-name').value.trim().slice(0, 100);
  var message = document.getElementById('guest-message').value.trim().slice(0, 1000);
  var checked = document.querySelector('input[name="attendance"]:checked');
  var attendance = checked ? checked.value : 'Hadir';
  var sel = document.getElementById('guest-count');
  var guestCount = sel ? sel.value : '1 Orang';

  if (!name || !message) { showToast('Mohon isi nama & ucapan dulu ya'); return; }
  if (!supabaseClient) { showToast('Supabase belum terhubung — cek supabase-config.js'); return; }

  var btn = e.target.querySelector('button[type="submit"]');
  if (btn) { btn.disabled = true; btn.classList.add('opacity-60'); }

  supabaseClient
    .from('rsvp_wishes')
    .insert([{ name: name, attendance: attendance, guest_count: guestCount, message: message }])
    .select('id, name, attendance, guest_count, message, created_at')
    .single()
    .then(function (res) {
      if (res.error) throw res.error;
      var container = document.getElementById('wishes-container');
      if (container && res.data) {
        var emptyMsg = container.querySelector('p.text-center');
        if (emptyMsg) container.innerHTML = '';
        container.insertAdjacentHTML('afterbegin', wishCardHTML(res.data));
        var c2 = document.getElementById('wishes-count');
        if (c2) c2.innerText = String(container.children.length);
        loadWishes();
      }
      document.getElementById('rsvp-form').reset();
      showToast('Terima kasih atas doa & konfirmasi Anda!');
    })
    .catch(function (err) {
      console.warn('Gagal mengirim ucapan:', err);
      showToast('Gagal mengirim. Pastikan schema.sql sudah dijalankan & RLS allow insert.');
    })
    .then(function () {
      if (btn) { btn.disabled = false; btn.classList.remove('opacity-60'); }
    });
}

window.addEventListener('DOMContentLoaded', function () {
  loadWishes();
  if (supabaseClient) {
    try {
      supabaseClient
        .channel('rsvp_wishes_feed')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rsvp_wishes' }, function () { loadWishes(); })
        .subscribe();
    } catch (err) { console.warn('Realtime tidak aktif:', err); }
  }
});
