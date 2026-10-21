// ============================================================
// dashboard-auth.js — Penjaga akses & personalisasi dashboard
//
// Alur:
//   1. reqAccess() memeriksa sesi + profil (public.profiles).
//      - Tidak login / tidak punya profil / nonaktif -> redirect ke login.html
//   2. applyProfile() mengisi nama, role, badge akses dari profil.
//   3. applyRoleUI() menyembunyikan menu/aksi yang tidak diizinkan role.
//
// CATATAN: role dibaca dari tabel `public.profiles` (source of truth),
// bukan dari user_metadata. Penegakan sesungguhnya ada di RLS + trigger.
// ============================================================
(function () {
  'use strict';

  var guard = window.AuthGuard;
  var readyCallbacks = [];
  var profile = null;
  var role = null;

  function $(id) { return document.getElementById(id); }

  function setText(id, text) {
    var el = $(id);
    if (el) el.textContent = text;
  }

  // Nama tampilan: pakai full_name, fallback ke email, fallback "Pengguna".
  function displayName(p) {
    if (!p) return 'Pengguna';
    var name = (p.full_name || '').trim();
    if (name) return name;
    var mail = (p.email || '').trim();
    if (mail) return mail.split('@')[0];
    return 'Pengguna';
  }

  // Inisial untuk avatar.
  function initials(name) {
    var parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return 'U';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function applyProfile(p) {
    profile = p;
    role = p.role;

    var name = displayName(p);
    var label = guard.labelFor(p.role);

    setText('dash-user-name', name);
    setText('dash-user-role', label);
    setText('dash-header-user', name + ' · ' + label);
    setText('dash-access-badge', 'Akses: ' + label);

    // Avatar: inisial bila nama tersedia, ikon default bila tidak.
    var avatar = $('dash-avatar');
    if (avatar) {
      avatar.innerHTML = '';
      var span = document.createElement('span');
      span.className = 'material-symbols-outlined text-on-primary text-[16px]';
      span.textContent = p.full_name && String(p.full_name).trim() ? initials(name) : 'person';
      avatar.appendChild(span);
    }
  }

  // Sembunyikan navigasi sidebar yang tidak diizinkan role.
  function applyRoleUI(currentRole) {
    var navs = document.querySelectorAll('[data-path]');
    navs.forEach(function (a) {
      var path = a.getAttribute('data-path');
      if (!path) return;
      if (guard.canNav(currentRole, path)) {
        a.classList.remove('hidden');
        a.removeAttribute('aria-disabled');
      } else {
        a.classList.add('hidden');
        a.setAttribute('aria-disabled', 'true');
      }
    });

    // Aksi privileged disembunyikan bila tidak diizinkan.
    var createBtn = $('dash-create-event');
    if (createBtn) {
      if (guard.canAction(currentRole, 'create-event')) {
        createBtn.classList.remove('hidden');
      } else {
        createBtn.classList.add('hidden');
      }
    }

    // Tombol "Ganti Password" hanya untuk Super Admin.
    var cpBtn = $('dash-change-password');
    if (cpBtn) {
      if (currentRole === 'super_admin') {
        cpBtn.classList.remove('hidden');
      } else {
        cpBtn.classList.add('hidden');
      }
    }
  }

  // Tombol keluar
  function bindLogout() {
    var btn = $('dash-logout');
    if (!btn) return;
    btn.addEventListener('click', function () {
      btn.disabled = true;
      guard.signOut().finally(function () {
        window.location.replace('login.html');
      });
    });
  }

  // Fail-closed: halaman disembunyikan lewat CSS (body:not(.dash-auth-ready))
  // sampai akses terverifikasi, agar tidak ada kilatan konten tanpa izin.
  function setReady(on) {
    var body = document.body;
    if (!body) return;
    if (on) body.classList.add('dash-auth-ready');
    else body.classList.remove('dash-auth-ready');
  }

  // Guard utama untuk halaman dashboard.
  function reqAccess() {
    setReady(false);
    return guard.requireAccess({
      loginUrl: 'login.html',
      nextUrl: 'dashboard.html'
    }).then(function (res) {
      if (!res.ok) {
        // Akses ditolak -> guard sudah mengarahkan ke login.
        // Konten tetap disembunyikan (fail-closed).
        setReady(false);
        return res;
      }
      applyProfile(res.profile);
      applyRoleUI(res.role);
      bindLogout();
      setReady(true);
      readyCallbacks.forEach(function (cb) { try { cb(); } catch (e) { console.warn('onReady cb error:', e); } });
      readyCallbacks = [];
      return res;
    });
  }

  // Daftarkan callback yang dijalankan setelah akses terverifikasi (auth-ready).
  function onReady(cb) {
    if (typeof cb !== 'function') return;
    if (document.body && document.body.classList.contains('dash-auth-ready')) {
      try { cb(); } catch (e) { console.warn('onReady cb error:', e); }
    } else {
      readyCallbacks.push(cb);
    }
  }

  // Dipanggil oleh dashboard-part2.js / halaman lain setelah profil siap.
  function getProfile() { return profile; }
  function getRole() { return role; }

  window.DashboardAuth = {
    reqAccess: reqAccess,
    applyProfile: applyProfile,
    applyRoleUI: applyRoleUI,
    getProfile: getProfile,
    getRole: getRole,
    onReady: onReady
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', reqAccess);
  } else {
    reqAccess();
  }
})();
