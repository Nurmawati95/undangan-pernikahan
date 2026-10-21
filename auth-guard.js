// ============================================================
// auth-guard.js — Resolusi sesi + profil + kontrol role (Undigital)
// Dipakai oleh: login.html, dashboard.html
//
// CATATAN KEAMANAN:
// - Role dibaca dari tabel `public.profiles` (source of truth),
//   BUKAN dari user_metadata (bisa diubah user sendiri).
// - Pemeriksaan di file ini hanya untuk UX/redireksi di sisi klien.
//   Penegakan yang sesungguhnya ada di RLS + trigger anti-eskalasi.
// ============================================================
(function (global) {
  'use strict';

  var SB_URL = String(global.SUPABASE_URL || '').trim();
  var SB_KEY = String(global.SUPABASE_ANON_KEY || '').trim();

  var client = null;

  // Kapabilitas per role.
  // ROLE_TABS   -> tab dashboard (index 0..6) yang boleh diakses.
  // ROLE_NAV    -> item navigasi sidebar (data-path) yang boleh diakses.
  // ROLE_ACTION -> aksi mutlak (tombol "Buat Acara Baru", panel pengguna, dll).
  // '*' berarti semua.
  var ROLE_TABS = {
    super_admin: [0, 1, 2, 3, 4, 5, 6],
    admin: [0, 1, 2, 3, 4, 5, 6],
    pelanggan: [0, 1, 2, 3, 4, 5, 6]
  };

  var ROLE_NAV = {
    super_admin: ['*'],
    admin: ['*'],
    pelanggan: [
      'ringkasan',
      'editor-undangan',
      'studio-editor-7tab',
      'katalog-tema',
      'buku-tamu-rsvp',
      'amplop-digital'
    ]
  };

  var ROLE_ACTION = {
    super_admin: ['*'],
    admin: ['create-event', 'manage-event'],
    pelanggan: []
  };

  // Aksi yang HANYA boleh dilakukan Super Admin.
  var SUPER_ADMIN_ONLY_ACTIONS = ['manage-users'];

  var ROLE_LABEL = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    pelanggan: 'Pelanggan'
  };

  function matches(list, value) {
    if (!list) return false;
    if (list.indexOf('*') !== -1) return true;
    return list.indexOf(value) !== -1;
  }

  function canNav(role, path) {
    return matches((ROLE_NAV || {})[role], path);
  }

  function canAction(role, action) {
    if (SUPER_ADMIN_ONLY_ACTIONS.indexOf(action) !== -1) {
      return role === 'super_admin';
    }
    return matches((ROLE_ACTION || {})[role], action);
  }

  function getClient() {
    if (client) return client;
    if (!SB_URL || !SB_KEY) {
      throw new Error('Konfigurasi Supabase belum termuat (supabase-config.js).');
    }
    if (!global.supabase || typeof global.supabase.createClient !== 'function') {
      throw new Error('Library @supabase/supabase-js gagal dimuat dari CDN.');
    }
    client = global.supabase.createClient(SB_URL, SB_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    return client;
  }

  function labelFor(role) {
    return ROLE_LABEL[role] || 'Tidak Diketahui';
  }

  function tabsFor(role) {
    return (ROLE_TABS[role] || []).slice();
  }

  function isSuperAdmin(role) {
    return role === 'super_admin';
  }

  // Ambil profil milik user yang sedang login (dibatasi RLS).
  function fetchProfile(sb, userId) {
    return sb
      .from('profiles')
      .select('id, email, full_name, role, is_active')
      .eq('id', userId)
      .maybeSingle();
  }

  /**
   * Resolusi penuh: session -> profil -> role.
   * Resolve ke:
   *   { ok: true,  session, profile, role }
   *   { ok: false, reason: 'no-session' | 'no-profile' | 'inactive' | 'error', error? }
   */
  function resolve() {
    var sb;
    try {
      sb = getClient();
    } catch (e) {
      return Promise.resolve({ ok: false, reason: 'error', error: e });
    }

    return sb.auth.getSession().then(function (sres) {
      if (sres.error) return { ok: false, reason: 'error', error: sres.error };
      var session = sres.data && sres.data.session;
      if (!session || !session.user) return { ok: false, reason: 'no-session' };

      return fetchProfile(sb, session.user.id).then(function (pres) {
        if (pres.error) return { ok: false, reason: 'error', error: pres.error };
        var profile = pres.data;
        // Akun terdaftar tapi belum masuk allowlist => tidak punya profil.
        if (!profile) return { ok: false, reason: 'no-profile', session: session };
        if (profile.is_active === false) return { ok: false, reason: 'inactive', session: session, profile: profile };
        return {
          ok: true,
          session: session,
          profile: profile,
          role: profile.role,
          label: labelFor(profile.role)
        };
      });
    }).catch(function (e) {
      return { ok: false, reason: 'error', error: e };
    });
  }

  /**
   * Penjaga halaman dashboard.
   * - Tanpa sesi  -> ke halaman login
   * - Tanpa profil / nonaktif -> ke halaman login dengan pesan penolakan
   * - Berhasil     -> lanjut, kembalikan profil
   */
  function requireAccess(opts) {
    opts = opts || {};
    var loginUrl = opts.loginUrl || 'login.html';
    var nextUrl = opts.nextUrl || 'dashboard.html';

    return resolve().then(function (res) {
      if (res.ok) return res;

      var q;
      if (res.reason === 'no-session') {
        q = '?next=' + encodeURIComponent(nextUrl);
      } else if (res.reason === 'no-profile') {
        q = '?err=not-authorized';
      } else if (res.reason === 'inactive') {
        q = '?err=inactive';
      } else {
        q = '?err=technical';
      }

      try {
        global.location.replace(loginUrl + q);
      } catch (e) {
        global.location.href = loginUrl + q;
      }
      // Signal ke pemanggil bahwa akses ditolak (isi halaman tetap disembunyikan).
      return { ok: false, reason: res.reason, error: res.error, redirected: true };
    });
  }

  function signOut() {
    var sb;
    try {
      sb = getClient();
    } catch (e) {
      return Promise.resolve();
    }
    return sb.auth.signOut();
  }

  global.AuthGuard = {
    getClient: getClient,
    resolve: resolve,
    requireAccess: requireAccess,
    signOut: signOut,
    labelFor: labelFor,
    tabsFor: tabsFor,
    isSuperAdmin: isSuperAdmin,
    canNav: canNav,
    canAction: canAction,
    ROLE_NAV: ROLE_NAV,
    ROLE_ACTION: ROLE_ACTION,
    SUPER_ADMIN_ONLY_ACTIONS: SUPER_ADMIN_ONLY_ACTIONS
  };
})(window);
