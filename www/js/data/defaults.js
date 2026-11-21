/* A fresh start: what Glow does before the user changes anything.
   Three separate things: Glow's wallpapers (optional, per screen), the sentence (widget, lock screen), and the widget's look. */
(function () {
  'use strict';
  const GL = window.GL;

  // How Glow's pictures change on a screen (or on both together).
  GL.newRotation = () => ({ album: 'all', img: { mode: 'interval', every: 60 } });

  GL.defaults = () => ({
    v: 3,
    createdAt: Date.now(),
    onboarded: false,
    walls: { home: false, lock: false },
    mode: 'same',
    rot: { both: GL.newRotation(), home: GL.newRotation(), lock: GL.newRotation() },
    quotes: { on: true, set: 'all', order: 'random', mode: 'seconds', seconds: 10, every: 60, lock: 'notification' },
    widget: { look: 'glass', color: '', align: 'center', buttons: true },
    qOrder: [],
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
  GL.QMODES = [{ v: 'seconds', l: 'כל כמה שניות', icon: 'sparkle' }].concat(GL.MODES);
  GL.EVERY = [5, 15, 30, 60, 120, 180, 360, 720, 1440];
  GL.QEVERY = [1, 5, 15, 30, 60, 180, 360, 1440];
  GL.SECONDS = [3, 5, 10, 15, 30, 60];
  GL.everyLabel = (m) => (m === 1 ? 'דקה' : m < 60 ? m + ' דקות' : m === 60 ? 'שעה' : m === 120 ? 'שעתיים' : m === 1440 ? 'יום' : (m / 60) + ' שעות');
  GL.PARTS = [{ v: 'morning', l: 'בוקר' }, { v: 'noon', l: 'צהריים' }, { v: 'evening', l: 'ערב' }, { v: 'night', l: 'לילה' }];
  GL.partName = (v) => (GL.PARTS.find((p) => p.v === v) || {}).l || '';
})();
