// Data acara publik (default) untuk integrasi Dashboard <-> Tampilan Publik
// Sumber awal; bisa ditimpa oleh hasil edit Studio Editor via localStorage (key: undigital-event-<slug>).
window.UN_DIGITAL_EVENTS = {
  'raka-nadya': {
    slug: 'raka-nadya',
    title: "Walimatul 'Ursy Raka Daniswara & Nadya Maharani",
    couple: 'Raka & Nadya',
    groom: 'Raden Raka Daniswara, S.T., M.Sc.',
    bride: 'Nadya Maharani Syarif, S.I.Kom.',
    date: '2026-10-24',
    dateText: 'Sabtu, 24 Oktober 2026',
    time: '08:00 - 15:00 WIB',
    venue: 'The Glasshouse Ballroom & Terrace',
    location: 'Jakarta',
    heroImage: 'assets/couple.jpg',
    countdown: '2026-10-24T08:00:00+07:00'
  },
  'dimas-sarah': {
    slug: 'dimas-sarah',
    title: 'Pernikahan Dimas & Sarah',
    couple: 'Dimas & Sarah',
    groom: 'Dimas',
    bride: 'Sarah',
    date: '2026-11-15',
    dateText: 'Minggu, 15 November 2026',
    time: '10:00 - 14:00 WIB',
    venue: 'Royal Ambarrukmo',
    location: 'Yogyakarta',
    heroImage: 'assets/bride.jpg',
    countdown: '2026-11-15T10:00:00+07:00'
  },
  'faris-anisa': {
    slug: 'faris-anisa',
    title: 'Pernikahan Faris & Anisa',
    couple: 'Faris & Anisa',
    groom: 'Faris',
    bride: 'Anisa',
    date: '2026-12-12',
    dateText: 'Sabtu, 12 Desember 2026',
    time: '09:00 - 13:00 WIB',
    venue: 'Grand Ballroom Medan',
    location: 'Medan',
    heroImage: 'assets/groom.jpg',
    countdown: '2026-12-12T09:00:00+07:00'
  }
};

window.getPublicEventData = function (slug) {
  var base = (window.UN_DIGITAL_EVENTS && window.UN_DIGITAL_EVENTS[slug]) ? window.UN_DIGITAL_EVENTS[slug] : null;
  try {
    var raw = localStorage.getItem('undigital-event-' + slug);
    if (raw) {
      var over = JSON.parse(raw);
      if (base) { for (var k in over) base[k] = over[k]; }
      else base = over;
    }
  } catch (e) { /* ignore */ }
  return base;
};