/* A fresh start: what Glow does before the user changes anything. */
(function () {
  'use strict';
  const GL = window.GL;

  // One set of "when and what to change". targets: which screens it sets; quoteWhere: where the sentence shows.
  GL.newRotation = (targets) => ({
    on: true,
    targets: targets || { home: true, lock: true },
    album: 'all',
    quoteSet: 'all',
    img: { mode: 'interval', every: 60 },
    quote: { on: true, mode: 'screen', every: 60 },
    quoteWhere: 'lock'
  });

  GL.defaults = () => ({
    v: 2,
    createdAt: Date.now(),
    onboarded: false,
    mode: 'same',
    rot: { both: GL.newRotation(), home: GL.newRotation({ home: true, lock: false }), lock: GL.newRotation({ home: false, lock: true }) },
    style: { pos: 'middle', size: 'm', color: '#FFFFFF', font: 'rubik', bold: true, band: 'dark', shadow: true },
    parts: { morning: 5, noon: 11, evening: 16, night: 20 },
    imgMeta: {},
    mine: [],
    myQuotes: [],
    qMeta: {},
    packs: [],
    store: { autoUpdate: true, lastCheck: 0, index: null, removed: [] },
    ui: { widgetTip: true },
    settings: { theme: 'system' },
    outbox: [],
    profile: { name: '', email: '' },
    updateSeen: 0
  });

  GL.MODES = [
    { v: 'interval', l: 'לפי זמן', icon: 'clock' },
    { v: 'screen', l: 'כל הדלקת מסך', icon: 'bolt' },
    { v: 'parts', l: 'לפי שעות היום', icon: 'sun' },
    { v: 'manual', l: 'רק בלחיצה', icon: 'hand' }
  ];
  GL.EVERY = [5, 15, 30, 60, 120, 180, 360, 720, 1440];
  GL.everyLabel = (m) => (m < 60 ? m + ' דקות' : m === 60 ? 'שעה' : m === 120 ? 'שעתיים' : m === 1440 ? 'יום' : (m / 60) + ' שעות');
  GL.PARTS = [{ v: 'morning', l: 'בוקר' }, { v: 'noon', l: 'צהריים' }, { v: 'evening', l: 'ערב' }, { v: 'night', l: 'לילה' }];
  GL.partName = (v) => (GL.PARTS.find((p) => p.v === v) || {}).l || '';
})();
