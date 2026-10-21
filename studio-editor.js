/* =============================================================
   UNDIGITAL — Studio Editor Undangan
   Interaksi: tab, live preview, galeri, tamu WA, musik, publikasi
   ============================================================= */
(function () {
  'use strict';

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  /* ---------- Toast ---------- */
  function toast(message, tone) {
    const host = $('#toastHost');
    if (!host) return;
    const el = document.createElement('div');
    const tones = {
      success: ['check_circle', 'bg-[#0f6b63]', 'text-white'],
      error: ['error', 'bg-[#ba1a1a]', 'text-white'],
      info: ['info', 'bg-[#201a17]', 'text-white']
    };
    const cfg = tones[tone] || tones.info;
    el.className = 'pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg font-body-sm text-body-sm font-semibold ' + cfg[1] + ' ' + cfg[2];
    el.innerHTML = '<span class="material-symbols-outlined text-[18px]">' + cfg[0] + '</span><span></span>';
    el.lastElementChild.textContent = message;
    host.appendChild(el);
    el.style.opacity = '0';
    el.style.transform = 'translateY(8px)';
    el.style.transition = 'opacity .25s ease, transform .25s ease';
    requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; });
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(8px)';
      setTimeout(() => el.remove(), 260);
    }, 2600);
  }
  window.studioToast = toast;

  /* ---------- Copy to clipboard ---------- */
  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) { /* fallback */ }
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch (e) {
      return false;
    }
  }
  window.studioCopy = copyText;

  /* ---------- State ---------- */
  const state = {
    slug: 'raka-nadya',
    guestName: 'Bapak Budi Santoso & Keluarga',
    eventDate: '2026-10-24',
    cover: 'assets/couple.jpg',
    agenda: [
      { time: '08:00', title: 'Kedatangan & Registrasi Tamu' },
      { time: '09:00', title: 'Akad Nikah' },
      { time: '10:30', title: 'Sesi Foto Bersama Keluarga' },
      { time: '11:30', title: 'Resepsi & Makan Bersama' }
    ],
    stories: [
      { date: '2019', title: 'Pertemuan Pertama', desc: 'Bertemu di sebuah kedai kecil di Braga. Sebuah awal yang sederhana.' },
      { date: '2021', title: 'Perjalanan Lintas Kota', desc: 'Menyusuri jauh, belajar arti rumah yang merindukan.' },
      { date: '2026', title: 'Hari Bahagia', desc: 'Kini kami siap memulai perjalanan baru.' }
    ],
    modules: [
      { id: 'm-cover', label: 'Sampul & Pembuka', icon: 'auto_stories', on: true },
      { id: 'm-tamu', label: 'Kartu Tamu', icon: 'badge', on: true },
      { id: 'm-agenda', label: 'Agenda Acara', icon: 'timeline', on: true },
      { id: 'm-peta', label: 'Peta Lokasi', icon: 'map', on: true },
      { id: 'm-galeri', label: 'Galeri Foto', icon: 'photo_library', on: true },
      { id: 'm-kisah', label: 'Kisah Cinta', icon: 'favorite', on: true },
      { id: 'm-hadiah', label: 'Amplop Digital', icon: 'redeem', on: true },
      { id: 'm-doa', label: 'Doa &amp; Ucapan', icon: 'volunteer_activism', on: true },
      { id: 'm-rsvp', label: 'Konfirmasi RSVP', icon: 'how_to_reg', on: true }
    ],
    gallery: [
      { src: 'assets/couple.jpg', label: 'Sampul Utama', feature: true },
      { src: 'assets/groom.jpg', label: 'Groom', feature: false },
      { src: 'assets/bride.jpg', label: 'Bride', feature: false },
      { src: 'assets/couple.jpg', label: 'Prewedding 01', feature: false },
      { src: 'assets/couple.jpg', label: 'Prewedding 02', feature: false },
      { src: 'assets/couple.jpg', label: 'Prewedding 03', feature: false }
    ]
  };
  window.studioState = state;

  /* Status: apakah pesan WA sudah diedit manual oleh pengguna */
  let waUserEdited = false;

  /* =============================================================
     1. TAB SWITCHING
     ============================================================= */
  const ACTIVE_TAB_CLASS = 'bg-primary-container text-on-primary-container font-semibold';
  const IDLE_TAB_CLASS = 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface font-body-sm text-body-sm';
  const ACTIVE_BADGE = 'bg-primary text-on-primary';
  const IDLE_BADGE = 'bg-surface-container text-on-surface-variant';

  /* classList.add/remove hanya menerima satu token per panggilan,
     sehingga daftar kelas harus dipecah menjadi array token. */
  function applyClasses(el, className) {
    if (!el) return;
    el.classList.remove(...(ACTIVE_TAB_CLASS + ' ' + IDLE_TAB_CLASS + ' ' + ACTIVE_BADGE + ' ' + IDLE_BADGE).split(' '));
    el.classList.add(...className.split(' ').filter(Boolean));
  }

  function switchTab(index) {
    const tabs = $$('.studio-tab');
    const panels = $$('.studio-panel');
    tabs.forEach((btn) => {
      const isActive = btn.dataset.tab === String(index);
      applyClasses(btn, isActive ? ACTIVE_TAB_CLASS : IDLE_TAB_CLASS);
      const badge = btn.querySelector('span:first-child');
      if (badge) applyClasses(badge, isActive ? ACTIVE_BADGE : IDLE_BADGE);
    });
    panels.forEach((panel) => {
      panel.classList.toggle('hidden', panel.id !== 'panel-' + index);
    });
    if (window.innerWidth < 1280) {
      const ribbon = $('#studio-ribbon');
      if (ribbon && ribbon.scrollWidth > ribbon.clientWidth) {
        const btn = tabs.find((t) => t.dataset.tab === String(index));
        if (btn) ribbon.scrollTo({ left: btn.offsetLeft - 12, behavior: 'smooth' });
      }
    }
  }
  window.studioSwitchTab = switchTab;

  $$('.studio-tab').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  /* =============================================================
     2. FORMATTING HELPERS
     ============================================================= */
  const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  function formatEventDate(iso) {
    if (!iso) return '-';
    const parts = String(iso).split('-');
    if (parts.length !== 3) return iso;
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    if (isNaN(d.getTime())) return iso;
    return DAYS[d.getDay()] + ', ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
  }

  function slugify(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'undangan';
  }

  function baseUrl() {
    const slug = state.slug || 'undangan';
    if (location.protocol === 'file:') return 'https://matrimony.id/undangan/' + slug;
    return location.origin + location.pathname.replace(/[^/]*$/, '') + 'undangan/' + slug;
  }

  function guestUrl() {
    return baseUrl() + '?kpd=' + encodeURIComponent(state.guestName || '');
  }


  /* =============================================================
     3. LIVE PREVIEW BINDING
     ============================================================= */
  function refreshPreview() {
    const coupleInput = $('#coupleNamesInput');
    const pendinginInput = $('#pendinginInput');
    const names = (coupleInput && coupleInput.value) || (pendinginInput && pendinginInput.value) || 'Raka & Nadya';
    const pn = $('#previewCoupleNames');
    if (pn) pn.textContent = names;

    const dateInput = $('#eventDateInput');
    if (dateInput) {
      state.eventDate = dateInput.value;
      const pd = $('#previewEventDate');
      if (pd) pd.textContent = formatEventDate(dateInput.value);
    }
    const venue = $('#venueNameInput');
    if (venue) {
      const pv = $('#previewVenue');
      if (pv) pv.textContent = venue.value;
    }
    const guest = $('#guestNameField');
    if (guest) {
      state.guestName = guest.value;
      const pg = $('#previewGuestDisplay');
      if (pg) pg.textContent = guest.value || 'Tamu Undangan';
    }
    if (state.cover) {
      const cover = $('#previewCoverImg');
      if (cover) cover.src = state.cover;
      const ct = $('#coverThumb');
      if (ct) ct.src = state.cover;
    }
    updateGuestPreview();
    refreshWaTemplate();
  }

  function updateGuestPreview() {
    const url = guestUrl();
    const box = $('#guestUrlPreview');
    if (box) box.textContent = url;
    return url;
  }

  /* Live binding untuk input utama */
  ['#eventNameInput', '#coupleNamesInput', '#pendinginInput', '#eventDateInput', '#venueNameInput', '#guestNameField', '#mapUrlInput'].forEach((sel) => {
    const el = $(sel);
    if (!el) return;
    el.addEventListener('input', () => {
      if (sel === '#mapUrlInput') {
        const open = $('#openMapBtn');
        if (open) open.href = el.value || '#';
        const copyMap = $('#copyMapBtn');
        if (copyMap) copyMap.dataset.url = el.value || '';
      }
      refreshPreview();
    });
  });

  /* =============================================================
     4. COUNTDOWN HARI MENUJU AKAD
     ============================================================= */
  function tickCountdown() {
    const d = $('#cdDays'), h = $('#cdHours'), m = $('#cdMinutes');
    if (!d || !h || !m) return;
    const iso = state.eventDate;
    if (!iso) return;
    const parts = String(iso).split('-');
    if (parts.length !== 3) return;
    const target = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 9, 0, 0);
    const diff = target.getTime() - Date.now();
    if (diff <= 0) {
      d.textContent = '00'; h.textContent = '00'; m.textContent = '00';
      return;
    }
    const totalSec = Math.floor(diff / 1000);
    d.textContent = String(Math.floor(totalSec / 86400)).padStart(2, '0');
    h.textContent = String(Math.floor((totalSec % 86400) / 3600)).padStart(2, '0');
    m.textContent = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
  }
  tickCountdown();
  setInterval(tickCountdown, 30000);

  /* =============================================================
     5. SLUG & Tautan Publik
     ============================================================= */
  const slugInput = $('#slugInput');
  if (slugInput) {
    slugInput.addEventListener('input', () => {
      const clean = slugify(slugInput.value);
      slugInput.value = clean;
      state.slug = clean;
      updateGuestPreview();
    });
  }
  const checkSlugBtn = $('#checkSlugBtn');
  if (checkSlugBtn) {
    checkSlugBtn.addEventListener('click', () => {
      const status = $('#slugStatus');
      const slug = state.slug || 'undangan';
      const reserved = ['admin', 'login', 'undangan', 'api', 'dashboard', 'index', 'assets'];
      if (reserved.includes(slug)) {
        if (status) status.innerHTML = '<span class="material-symbols-outlined text-[15px]">error</span><span>Terpakai</span>';
        toast('Slug "' + slug + '" sudah digunakan. Coba slug lain.', 'error');
        return;
      }
      if (status) status.innerHTML = '<span class="material-symbols-outlined text-[15px]">check_circle</span><span>Tersedia</span>';
      toast('Slug "' + slug + '" tersedia untuk dipublikasikan.', 'success');
    });
  }

  /* =============================================================
     6. UNGGAH SAMPUL
     ============================================================= */
  const coverUpload = $('#coverUpload');
  if (coverUpload) {
    coverUpload.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) {
        toast('Ukuran berkas melebihi 10MB.', 'error');
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        state.cover = String(ev.target.result);
        const fname = $('#coverFileName');
        if (fname) fname.textContent = file.name;
        refreshPreview();
        toast('Foto sampul berhasil diperbarui.', 'success');
      };
      reader.readAsDataURL(file);
    });
  }
  const coverResetBtn = $('#coverResetBtn');
  if (coverResetBtn) {
    coverResetBtn.addEventListener('click', () => {
      state.cover = 'assets/couple.jpg';
      const fname = $('#coverFileName');
      if (fname) fname.textContent = 'assets/couple.jpg';
      if (coverUpload) coverUpload.value = '';
      refreshPreview();
      toast('Foto sampul dikembalikan ke bawaan.', 'info');
    });
  }

  /* =============================================================
     7. AGENDA ACARA (Tab 3)
     ============================================================= */
  function renderAgenda() {
    const list = $('#agendaList');
    if (!list) return;
    list.innerHTML = '';
    state.agenda.forEach((item, idx) => {
      const row = document.createElement('div');
      row.className = 'flex items-center gap-2 p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/30';
      const time = document.createElement('input');
      time.value = item.time;
      time.setAttribute('aria-label', 'Waktu agenda');
      time.className = 'w-24 bg-surface-container-lowest px-2.5 py-1.5 rounded-lg text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-secondary/40';
      time.addEventListener('input', () => { item.time = time.value; });
      const title = document.createElement('input');
      title.value = item.title;
      title.setAttribute('aria-label', 'Judul agenda');
      title.className = 'flex-1 bg-surface-container-lowest px-2.5 py-1.5 rounded-lg text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-secondary/40';
      title.addEventListener('input', () => { item.title = title.value; });
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'w-8 h-8 rounded-lg bg-surface-container-high hover:bg-error-container hover:text-on-error-container flex items-center justify-center text-on-surface-variant flex-shrink-0';
      del.innerHTML = '<span class="material-symbols-outlined text-[16px]">delete</span>';
      del.addEventListener('click', () => {
        state.agenda.splice(idx, 1);
        renderAgenda();
        toast('Agenda dihapus.', 'info');
      });
      row.appendChild(time);
      row.appendChild(title);
      row.appendChild(del);
      list.appendChild(row);
    });
  }
  renderAgenda();

  const addAgendaBtn = $('#addAgendaBtn');
  if (addAgendaBtn) {
    addAgendaBtn.addEventListener('click', () => {
      state.agenda.push({ time: '00:00', title: 'Agenda Baru' });
      renderAgenda();
      toast('Agenda baru ditambahkan.', 'success');
    });
  }


  const nameCount = $('#eventNameCount');
  const nameInput = $('#eventNameInput');
  if (nameInput && nameCount) {
    const upd = () => { nameCount.textContent = String(nameInput.value.length); };
    nameInput.addEventListener('input', upd);
    upd();
  }


  /* =============================================================
     8. GALERI FOTO (Tab 4)
     ============================================================= */
  function renderGallery() {
    const grid = $('#galleryGrid');
    if (!grid) return;
    grid.innerHTML = '';
    state.gallery.forEach((item, idx) => {
      const cell = document.createElement('div');
      cell.className = 'group relative aspect-square rounded-xl overflow-hidden bg-surface-container-low border ' +
        (item.feature ? 'border-primary ring-2 ring-primary/30' : 'border-outline-variant/30');
      const img = document.createElement('img');
      img.src = item.src;
      img.alt = item.label;
      img.className = 'w-full h-full object-cover transition-transform duration-500 group-hover:scale-110';
      const label = document.createElement('span');
      label.className = 'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white text-[10px] font-semibold px-2 py-2 truncate';
      label.textContent = item.label;
      const badge = document.createElement('span');
      badge.className = 'absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer ' +
        (item.feature ? 'bg-primary text-on-primary' : 'bg-black/45 text-white opacity-0 group-hover:opacity-100');
      badge.innerHTML = '<span class="material-symbols-outlined text-[14px]">' + (item.feature ? 'star' : 'star_outline') + '</span>';
      badge.title = 'Tandai foto unggulan';
      badge.addEventListener('click', () => {
        state.gallery.forEach((g) => { g.feature = false; });
        item.feature = true;
        renderGallery();
        toast('"' + item.label + '" ditandai sebagai foto unggulan.', 'success');
      });
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-black/45 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity';
      del.innerHTML = '<span class="material-symbols-outlined text-[14px]">close</span>';
      del.title = 'Hapus foto';
      del.addEventListener('click', () => {
        state.gallery.splice(idx, 1);
        renderGallery();
        toast('Foto dihapus dari galeri.', 'info');
      });
      cell.appendChild(img);
      cell.appendChild(label);
      cell.appendChild(badge);
      cell.appendChild(del);
      grid.appendChild(cell);
    });
    const count = $('#galleryCount');
    if (count) count.textContent = String(state.gallery.length);
  }
  renderGallery();

  const galleryUpload = $('#galleryUpload');
  if (galleryUpload) {
    galleryUpload.addEventListener('change', (e) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;
      let pending = files.length;
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          state.gallery.push({ src: String(ev.target.result), label: file.name, feature: false });
          pending -= 1;
          if (pending === 0) {
            renderGallery();
            toast(files.length + ' foto berhasil ditambahkan ke galeri.', 'success');
          }
        };
        reader.readAsDataURL(file);
      });
      e.target.value = '';
    });
  }

  /* =============================================================
     9. KISAH CINTA (Tab 5)
     ============================================================= */
  function renderStories() {
    const list = $('#storyList');
    if (!list) return;
    list.innerHTML = '';
    state.stories.forEach((story, idx) => {
      const wrap = document.createElement('div');
      wrap.className = 'flex gap-3 p-3 rounded-xl bg-surface-container-low border border-outline-variant/30';
      const marker = document.createElement('div');
      marker.className = 'flex flex-col items-center flex-shrink-0';
      marker.innerHTML = '<div class="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold text-[12px]">' + (idx + 1) + '</div><div class="w-px flex-1 bg-outline-variant/60 mt-1"></div>';
      const body = document.createElement('div');
      body.className = 'flex-1 flex flex-col gap-1.5';
      const top = document.createElement('div');
      top.className = 'flex items-center gap-2';
      const year = document.createElement('input');
      year.value = story.date;
      year.setAttribute('aria-label', 'Tahun chapter');
      year.className = 'w-20 bg-surface-container-lowest px-2 py-1 rounded-md text-secondary font-body-sm text-body-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/40';
      year.addEventListener('input', () => { story.date = year.value; });
      const title = document.createElement('input');
      title.value = story.title;
      title.setAttribute('aria-label', 'Judul chapter');
      title.className = 'flex-1 bg-surface-container-lowest px-2.5 py-1.5 rounded-md text-on-surface font-body-md text-body-md font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40';
      title.addEventListener('input', () => { story.title = title.value; });
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'w-7 h-7 rounded-md bg-surface-container-high hover:bg-error-container hover:text-on-error-container flex items-center justify-center flex-shrink-0';
      del.innerHTML = '<span class="material-symbols-outlined text-[15px]">delete</span>';
      del.addEventListener('click', () => {
        state.stories.splice(idx, 1);
        renderStories();
        toast('Chapter dihapus.', 'info');
      });
      top.appendChild(year);
      top.appendChild(title);
      top.appendChild(del);
      const desc = document.createElement('textarea');
      desc.value = story.desc;
      desc.rows = 2;
      desc.setAttribute('aria-label', 'Cerita chapter');
      desc.className = 'w-full bg-surface-container-lowest px-2.5 py-1.5 rounded-md text-on-surface-variant font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary/40';
      desc.addEventListener('input', () => { story.desc = desc.value; });
      body.appendChild(top);
      body.appendChild(desc);
      wrap.appendChild(marker);
      wrap.appendChild(body);
      list.appendChild(wrap);
    });
  }
  renderStories();

  const addStoryBtn = $('#addStoryBtn');
  if (addStoryBtn) {
    addStoryBtn.addEventListener('click', () => {
      state.stories.push({ date: '2026', title: 'Chapter Baru', desc: 'Tuliskan cerita kalian di sini.' });
      renderStories();
      toast('Chapter baru ditambahkan.', 'success');
    });
  }

  window.studioState = state;


  /* =============================================================
     10. MODULE TOGGLES (Tab 7)
     ============================================================= */
  function renderModules() {
    const host = $('#moduleToggles');
    if (!host) return;
    host.innerHTML = '';
    state.modules.forEach((mod) => {
      const label = document.createElement('label');
      label.className = 'flex items-center justify-between gap-2 p-3 rounded-lg bg-surface-container-low cursor-pointer';
      const left = document.createElement('div');
      left.className = 'flex items-center gap-2 min-w-0';
      const ic = document.createElement('span');
      ic.className = 'material-symbols-outlined text-[18px] text-secondary';
      ic.textContent = mod.icon;
      const span = document.createElement('span');
      span.className = 'font-body-sm text-[12px] font-semibold text-on-surface truncate';
      span.textContent = mod.label;
      left.appendChild(ic);
      left.appendChild(span);
      const box = document.createElement('input');
      box.type = 'checkbox';
      box.className = 'w-4 h-4 accent-primary rounded flex-shrink-0';
      box.checked = !!mod.on;
      box.addEventListener('change', () => {
        mod.on = box.checked;
        toast(mod.label + (mod.on ? ' diaktifkan.' : ' dinonaktifkan.'), 'info');
      });
      label.appendChild(left);
      label.appendChild(box);
      host.appendChild(label);
    });
  }
  renderModules();


  /* =============================================================
     11. WHATSAPP & TAUTAN TAMU (Tab 2)
     ============================================================= */
  const DEFAULT_WA_TEMPLATE = 'Assalamualaikum {{nama}}, kami mengundang Anda ke akad nikah Raka & Nadya.\n\nDetail acara:\nTanggal: {{tanggal}}\nWaktu: {{waktu}}\nTempat: {{tempat}}\n\nSilakan buka undangan digital kami melalui tautan berikut:\n{{tautan}}\n\nSampai jumpa di hari bahagiamu!';

  const waField = $('#waMessageField');
  function fillWaTemplate() {
    if (!waField) return;
    waField.value = DEFAULT_WA_TEMPLATE
      .replace(/\{\{nama\}\}/g, state.guestName || 'Tamu Undangan')
      .replace(/\{\{tanggal\}\}/g, formatEventDate(state.eventDate))
      .replace(/\{\{waktu\}\}/g, (($('#akadTimeInput') || {}).value) || '09:00 WIB')
      .replace(/\{\{tempat\}\}/g, (($('#venueNameInput') || {}).value) || 'Lokasi Acara')
      .replace(/\{\{tautan\}\}/g, guestUrl());
    const cnt = $('#waCharCount');
    if (cnt) cnt.textContent = String(waField.value.length);
  }
  function refreshWaTemplate() {
    if (waUserEdited) return;
    fillWaTemplate();
  }
  fillWaTemplate();

  const resetWaBtn = $('#resetWaTemplateBtn');
  if (resetWaBtn) {
    resetWaBtn.addEventListener('click', () => {
      waUserEdited = false;
      fillWaTemplate();
      toast('Template pesan dikembalikan ke bawaan.', 'info');
    });
  }
  if (waField) {
    waField.addEventListener('input', function () {
      waUserEdited = true;
      const cnt = $('#waCharCount');
      if (cnt) cnt.textContent = String(waField.value.length);
    });
  }

  function buildWaLink() {
    const msg = (waField && waField.value) ? waField.value : DEFAULT_WA_TEMPLATE;
    const phone = ((($('#panitiaPhoneInput') || {}).value) || '').replace(/[^0-9]/g, '');
    const target = phone || '6281234567890';
    return 'https://wa.me/' + target + '?text=' + encodeURIComponent(msg);
  }

  const copyGuestUrlBtn = $('#copyGuestUrlBtn');
  if (copyGuestUrlBtn) {
    copyGuestUrlBtn.addEventListener('click', async () => {
      const ok = await copyText(guestUrl());
      toast(ok ? 'Tautan tamu disalin ke papan klip.' : 'Gagal menyalin tautan.', ok ? 'success' : 'error');
    });
  }

  const sendWaBtn = $('#sendWaDirectBtn');
  if (sendWaBtn) {
    sendWaBtn.addEventListener('click', () => {
      window.open(buildWaLink(), '_blank', 'noopener');
      toast('Membuka WhatsApp dengan pesan siap kirim.', 'info');
    });
  }

  const copyPublicLinkBtn = $('#copyPublicLinkBtn');
  if (copyPublicLinkBtn) {
    copyPublicLinkBtn.addEventListener('click', async () => {
      const ok = await copyText(baseUrl());
      toast(ok ? 'Tautan publik disalin ke papan klip.' : 'Gagal menyalin tautan.', ok ? 'success' : 'error');
    });
  }

  const copyMapBtn = $('#copyMapBtn');
  if (copyMapBtn) {
    copyMapBtn.addEventListener('click', function () {
      const url = copyMapBtn.dataset.url || (($('#mapUrlInput') || {}).value) || '';
      copyText(url).then(function (ok) {
        toast(ok ? 'Tautan peta disalin.' : 'Gagal menyalin tautan peta.', ok ? 'success' : 'error');
      });
    });
  }

  /* =============================================================
     12. MUSIK LATAR (Tab 1)
     ============================================================= */
  const volumeSlider = $('#volumeSlider');
  const volumeLabel = $('#volumeLabel');
  if (volumeSlider && volumeLabel) {
    volumeSlider.addEventListener('input', () => {
      volumeLabel.textContent = volumeSlider.value + '%';
    });
  }
  const musicSelect = $('#musicSelect');
  if (musicSelect) {
    musicSelect.addEventListener('change', () => {
      if (musicSelect.value === 'custom') {
        toast('Pemilih berkas musik siap — gunakan tombol Unggah Lagu pada daftar.', 'info');
      } else {
        toast('Lagu latar diganti: ' + musicSelect.options[musicSelect.selectedIndex].text.split(' (')[0], 'success');
      }
    });
  }

  /* =============================================================
     13. PRATINJAU LAYAR PENUH
     ============================================================= */
  const fullModal = $('#fullPreviewModal');
  function openFullPreview() {
    if (!fullModal) return;
    const names = (($('#coupleNamesInput') || {}).value) || 'Raka & Nadya';
    const date = formatEventDate(state.eventDate);
    const venue = (($('#venueNameInput') || {}).value) || '-';
    const guest = state.guestName || 'Tamu Undangan';
    const prayer = (($('#prayerInput') || {}).value) || '';
    const set = (id, val) => { const el = $(id); if (el) el.textContent = val; };
    set('#fullPreviewNames', names);
    set('#fullPreviewDate', date);
    set('#fullPreviewVenue', venue);
    set('#fullPreviewGuest', guest);
    set('#fullPreviewPrayer', prayer);
    const wa = $('#fullPreviewWaBtn');
    if (wa) wa.href = buildWaLink();
    fullModal.classList.remove('hidden');
    fullModal.classList.add('flex');
  }
  function closeFullPreview() {
    if (!fullModal) return;
    fullModal.classList.add('hidden');
    fullModal.classList.remove('flex');
  }
  const previewFullBtn = $('#previewFullBtn');
  if (previewFullBtn) previewFullBtn.addEventListener('click', openFullPreview);
  const closeFullBtn = $('#closeFullPreviewBtn');
  if (closeFullBtn) closeFullBtn.addEventListener('click', closeFullPreview);
  if (fullModal) {
    fullModal.addEventListener('click', (e) => { if (e.target === fullModal) closeFullPreview(); });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeFullPreview();
  });

  const previewOpenBtn = $('#previewOpenBtn');
  if (previewOpenBtn) previewOpenBtn.addEventListener('click', openFullPreview);

  /* Preview cover / isi switcher */
  const viewCoverBtn = $('#viewCoverBtn');
  const viewMainBtn = $('#viewMainBtn');
  function setPreviewView(mode) {
    const wrap = $('#previewCoverWrap');
    if (!wrap) return;
    const isCover = mode === 'cover';
    wrap.style.height = isCover ? '100%' : '58%';
    if (viewCoverBtn) {
      viewCoverBtn.className = 'px-3 py-1 rounded-md text-[11px] font-bold uppercase transition-all ' +
        (isCover ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:text-on-surface');
    }
    if (viewMainBtn) {
      viewMainBtn.className = 'px-3 py-1 rounded-md text-[11px] font-bold uppercase transition-all ' +
        (isCover ? 'text-on-surface-variant hover:text-on-surface' : 'bg-primary-container text-on-primary-container');
    }
  }
  if (viewCoverBtn) viewCoverBtn.addEventListener('click', () => setPreviewView('cover'));
  if (viewMainBtn) viewMainBtn.addEventListener('click', () => setPreviewView('main'));

  /* =============================================================
     14. PUBLIKASI
     ============================================================= */
  const publishBtn = $('#publishBtn');
  if (publishBtn) {
    publishBtn.addEventListener('click', () => {
      const original = publishBtn.innerHTML;
      publishBtn.disabled = true;
      publishBtn.innerHTML = '<span class="material-symbols-outlined text-[18px] animate-spin">progress_activity</span><span>Mempublikasikan…</span>';
      setTimeout(() => {
        publishBtn.disabled = false;
        publishBtn.innerHTML = original;
        toast('Undangan berhasil dipublikasikan. Tautan: ' + baseUrl(), 'success');
        try {
          localStorage.setItem('undigital-studio-publish', JSON.stringify({ slug: state.slug, at: Date.now() }));
        } catch (e) { /* storage opsional */ }
      }, 900);
    });
  }

  /* =============================================================
     15. INIT
     ============================================================= */
  refreshPreview();
  updateGuestPreview();
  switchTab(1);
})();
