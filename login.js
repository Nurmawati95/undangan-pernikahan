// ============================================================
// login.js — Logika halaman login / registrasi Undigital
// ============================================================
(function () {
  'use strict';

  var sb = null;

  var el = {
    status: document.getElementById('login-status'),
    alert: document.getElementById('login-alert'),
    signin: document.getElementById('form-signin'),
    signup: document.getElementById('form-signup'),
    loading: document.getElementById('form-loading'),
    signinEmail: document.getElementById('signin-email'),
    signinPassword: document.getElementById('signin-password'),
    signupName: document.getElementById('signup-name'),
    signupEmail: document.getElementById('signup-email'),
    signupPassword: document.getElementById('signup-password'),
    signupConfirm: document.getElementById('signup-confirm'),
    btnSignin: document.getElementById('btn-signin'),
    btnSignup: document.getElementById('btn-signup'),
    btnGoogle: document.getElementById('btn-google'),
    btnShowSignup: document.getElementById('btn-show-signup'),
    btnShowSignin: document.getElementById('btn-show-signin')
  };

  // Halaman tujuan setelah login berhasil (whitelist agar aman dari open redirect).
  var ALLOWED_NEXT = ['dashboard.html', 'studio-editor.html'];

  function nextTarget() {
    try {
      var params = new URLSearchParams(window.location.search);
      var next = params.get('next');
      if (next && ALLOWED_NEXT.indexOf(next) !== -1) return next;
    } catch (e) { /* ignore */ }
    return 'dashboard.html';
  }

  function showAlert(kind, message) {
    if (!el.alert) return;
    var styles = {
      error: 'bg-error-container text-on-error-container border-error/40',
      warn: 'bg-[#fff3d6] text-[#574500] border-[#e9c349]/60',
      info: 'bg-[#e0f7fa] text-on-secondary-container border-secondary/40',
      success: 'bg-[#e6f4ea] text-[#0d652d] border-[#34a853]/40'
    };
    el.alert.className = 'mb-5 rounded-xl px-4 py-3 text-sm border ' + (styles[kind] || styles.info);
    el.alert.textContent = message;
    el.alert.classList.remove('hidden');
  }

  function clearAlert() {
    if (!el.alert) return;
    el.alert.classList.add('hidden');
    el.alert.textContent = '';
  }

  function setBusy(btn, busy, busyLabel) {
    if (!btn) return;
    var label = btn.querySelector('.btn-label');
    if (busy) {
      btn.dataset.originalLabel = label ? label.textContent : '';
      btn.disabled = true;
      if (label) label.textContent = busyLabel || 'Memproses...';
    } else {
      btn.disabled = false;
      if (label && btn.dataset.originalLabel) label.textContent = btn.dataset.originalLabel;
    }
  }

  function setMode(mode) {
    if (el.signin) el.signin.classList.toggle('hidden', mode !== 'signin');
    if (el.signup) el.signup.classList.toggle('hidden', mode !== 'signup');
  }

  function showLoading(on) {
    if (el.loading) el.loading.classList.toggle('hidden', !on);
    if (el.signin) el.signin.classList.toggle('hidden', on);
    if (el.signup) el.signup.classList.toggle('hidden', on);
  }

  // Terjemahkan pesan error Supabase ke bahasa manusia.
  function humanError(err) {
    if (!err) return 'Terjadi kesalahan. Silakan coba lagi.';
    var msg = String(err.message || err.error_description || err);
    var lower = msg.toLowerCase();
    if (lower.indexOf('invalid login credentials') !== -1) {
      return 'Email atau kata sandi salah. Silakan periksa kembali.';
    }
    if (lower.indexOf('email not confirmed') !== -1) {
      return 'Email belum dikonfirmasi. Silakan buka tautan konfirmasi yang kami kirim.';
    }
    if (lower.indexOf('user already registered') !== -1 || lower.indexOf('already been registered') !== -1) {
      return 'Email ini sudah terdaftar. Silakan masuk.';
    }
    if (lower.indexOf('password should be') !== -1 || lower.indexOf('at least') !== -1) {
      return 'Kata sandi terlalu lemah. Minimal 8 karakter.';
    }
    if (lower.indexOf('rate limit') !== -1 || lower.indexOf('too many') !== -1) {
      return 'Terlalu banyak percobaan. Silakan coba beberapa saat lagi.';
    }
    if (lower.indexOf('failed to fetch') !== -1 || lower.indexOf('network') !== -1) {
      return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
    }
    if (lower.indexOf('provider is not enabled') !== -1 || lower.indexOf('google') !== -1) {
      return 'Login dengan Google belum dikonfigurasi. Silakan gunakan email dan kata sandi.';
    }
    if (lower.indexOf('signup is disabled') !== -1) {
      return 'Pendaftaran mandiri sedang dinonaktifkan. Silakan hubungi Super Admin.';
    }
    return msg;
  }

  // ------------------------------------------------------------------
  // Cek sesi yang sudah ada -> langsung ke dashboard bila punya akses.
  // ------------------------------------------------------------------
  function bootstrap() {
    sb = window.AuthGuard.getClient();
    if (el.status) el.status.textContent = 'Supabase: terhubung';

    window.AuthGuard.resolve().then(function (res) {
      if (res.ok) {
        window.location.replace(nextTarget());
        return;
      }
      showLoading(false);
      setMode('signin');

      // Pesan penolakan yang diteruskan dari guard dashboard.
      try {
        var params = new URLSearchParams(window.location.search);
        var err = params.get('err');
        if (err === 'not-authorized') {
          showAlert('warn', 'Akun Anda belum terdaftar/ditambahkan oleh Super Admin, sehingga akses dashboard ditolak.');
        } else if (err === 'inactive') {
          showAlert('error', 'Akun Anda dinonaktifkan. Hubungi Super Admin.');
        } else if (err === 'technical') {
          showAlert('error', 'Terjadi kendala teknis saat memverifikasi sesi. Silakan coba lagi.');
        }
      } catch (e) { /* ignore */ }
    });
  }

  // ------------------------------------------------------------------
  // Masuk dengan email + kata sandi
  // ------------------------------------------------------------------
  function doSignIn(ev) {
    if (ev) ev.preventDefault();
    clearAlert();

    var email = (el.signinEmail.value || '').trim();
    var password = el.signinPassword.value || '';

    if (!email || !password) {
      showAlert('error', 'Email dan kata sandi wajib diisi.');
      return;
    }

    setBusy(el.btnSignin, true, 'Memeriksa...');

    sb.auth.signInWithPassword({ email: email, password: password })
      .then(function (res) {
        if (res.error) {
          setBusy(el.btnSignin, false);
          showAlert('error', humanError(res.error));
          el.signinPassword.value = '';
          return;
        }
        // Verifikasi profil & role sebelum mengizinkan masuk.
        return window.AuthGuard.resolve().then(function (state) {
          if (state.ok) {
            window.location.replace(nextTarget());
            return;
          }
          setBusy(el.btnSignin, false);
          if (state.reason === 'no-profile') {
            sb.auth.signOut();
            showAlert('warn', 'Email ini belum terdaftar pada daftar akses. Silakan hubungi Super Admin.');
          } else if (state.reason === 'inactive') {
            sb.auth.signOut();
            showAlert('error', 'Akun Anda dinonaktifkan. Hubungi Super Admin.');
          } else {
            showAlert('error', humanError(state.error));
          }
        });
      })
      .catch(function (e) {
        setBusy(el.btnSignin, false);
        showAlert('error', humanError(e));
      });
  }

  // ------------------------------------------------------------------
  // Daftar akun baru (email + kata sandi)
  // ------------------------------------------------------------------
  function doSignUp(ev) {
    if (ev) ev.preventDefault();
    clearAlert();

    var name = (el.signupName.value || '').trim();
    var email = (el.signupEmail.value || '').trim();
    var password = el.signupPassword.value || '';
    var confirm = el.signupConfirm.value || '';

    if (!email || !password || !confirm) {
      showAlert('error', 'Lengkapi semua kolom yang wajib diisi.');
      return;
    }
    if (password.length < 8) {
      showAlert('error', 'Kata sandi minimal 8 karakter.');
      return;
    }
    if (password !== confirm) {
      showAlert('error', 'Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setBusy(el.btnSignup, true, 'Membuat akun...');

    sb.auth.signUp({
      email: email,
      password: password,
      options: { data: { full_name: name } }
    })
      .then(function (res) {
        setBusy(el.btnSignup, false);
        if (res.error) {
          showAlert('error', humanError(res.error));
          return;
        }
        // Bila konfirmasi email aktif, sesi belum terbentuk -> arahkan ke info.
        if (!res.data || !res.data.session) {
          showAlert('info', 'Pendaftaran berhasil. Silakan cek email Anda untuk memverifikasi akun sebelum masuk.');
          setMode('signin');
          el.signinEmail.value = email;
          return;
        }
        // Sesi terbentuk (konfirmasi email nonaktif) -> langsung cek akses.
        return window.AuthGuard.resolve().then(function (state) {
          if (state.ok) {
            window.location.replace(nextTarget());
            return;
          }
          if (state.reason === 'no-profile') {
            sb.auth.signOut();
            showAlert('warn', 'Akun dibuat, tetapi email Anda belum terdaftar pada daftar akses. Silakan hubungi Super Admin.');
            setMode('signin');
          } else {
            showAlert('error', humanError(state.error));
          }
        });
      })
      .catch(function (e) {
        setBusy(el.btnSignup, false);
        showAlert('error', humanError(e));
      });
  }

  // ------------------------------------------------------------------
  // Masuk dengan Google
  // ------------------------------------------------------------------
  function doGoogle() {
    clearAlert();
    setBusy(el.btnGoogle, true, 'Menghubungkan...');

    var opts = {
      provider: 'google',
      options: { redirectTo: window.location.origin + '/login.html' }
    };

    sb.auth.signInWithOAuth(opts)
      .then(function (res) {
        if (res.error) {
          setBusy(el.btnGoogle, false);
          showAlert('error', humanError(res.error));
          return;
        }
        // Browser diarahkan ke Google. Jangan lepas loading state.
        if (res.data && res.data.url) {
          window.location.href = res.data.url;
        }
      })
      .catch(function (e) {
        setBusy(el.btnGoogle, false);
        showAlert('error', humanError(e));
      });
  }

  function init() {
    showLoading(true);

    el.btnSignin.addEventListener('click', doSignIn);
    el.btnSignup.addEventListener('click', doSignUp);
    el.btnGoogle.addEventListener('click', doGoogle);
    el.btnShowSignup.addEventListener('click', function () {
      clearAlert();
      setMode('signup');
    });
    el.btnShowSignin.addEventListener('click', function () {
      clearAlert();
      setMode('signin');
    });

    el.signinEmail.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') doSignIn(e);
    });
    el.signinPassword.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') doSignIn(e);
    });
    el.signupEmail.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') doSignUp(e);
    });
    el.signupPassword.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') doSignUp(e);
    });
    el.signupConfirm.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') doSignUp(e);
    });

    try {
      bootstrap();
    } catch (e) {
      showLoading(false);
      setMode('signin');
      if (el.status) el.status.textContent = 'Supabase: gagal terhubung';
      showAlert('error', 'Konfigurasi Supabase belum lengkap. Periksa file supabase-config.js.');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
