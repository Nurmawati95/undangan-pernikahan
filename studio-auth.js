// ============================================================
// studio-auth.js — Penjaga akses & personalisasi Studio Editor
// ============================================================
(function () {
  'use strict';

  var guard = window.AuthGuard;
  if (!guard) { console.error('AuthGuard belum termuat (studio-auth.js)'); return; }

  var body = document.body;
  function setReady(on) {
    if (!body) return;
    if (on) body.classList.add('dash-auth-ready');
    else body.classList.remove('dash-auth-ready');
  }

  setReady(false);

  function gatePublish(role) {
    var btn = document.getElementById('publishBtn');
    if (!btn) return;
    if (guard.canAction(role, 'manage-event')) {
      btn.classList.remove('hidden');
      btn.disabled = false;
      btn.removeAttribute('aria-disabled');
    } else {
      btn.classList.add('hidden');
      btn.setAttribute('aria-disabled', 'true');
      btn.disabled = true;
    }
  }

  function bindLogout() {
    var btn = document.getElementById('studio-logout');
    if (!btn) return;
    btn.addEventListener('click', function () {
      btn.disabled = true;
      guard.signOut().finally(function () { window.location.replace('login.html'); });
    });
  }

  guard.requireAccess({ loginUrl: 'login.html', nextUrl: 'studio-editor.html' }).then(function (res) {
    if (!res.ok) { setReady(false); return; }
    var role = res.role;
    var nameEl = document.getElementById('studio-user-name');
    if (nameEl && res.profile) {
      nameEl.textContent = (res.profile.full_name || res.profile.email || 'Pengguna').trim();
    }
    gatePublish(role);
    bindLogout();
    setReady(true);
  }).catch(function (e) {
    console.warn('studio-auth gagal:', e);
    setReady(false);
  });
})();
