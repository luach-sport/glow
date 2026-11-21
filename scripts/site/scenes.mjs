// The screenshots on Glow's site, taken by the Itzko site kit (kit/lib/shots.mjs in luach-sport/itzko).
// The app runs in a browser there, so the wallpaper engine is the stand-in in js/engine/bridge.js (GL.EN.sim).
// Fixed clock (20:15) and fixed pictures and sentences, so the shots look the same every time.
const evening = () => { const d = new Date(); d.setHours(20, 15, 0, 0); return d; };

const SEED = `(() => {
  const now = Date.now(), day = 864e5;
  return {
    v: 3, createdAt: now - 9 * day, onboarded: true, mode: 'same',
    walls: { home: true, lock: false },
    rot: { both: { album: 'all', img: { mode: 'interval', every: 60 } }, home: { album: 'cat:mountain', img: { mode: 'parts', every: 60 } }, lock: { album: 'fav', img: { mode: 'screen', every: 60 } } },
    quotes: { on: true, set: 'all', order: 'random', mode: 'seconds', seconds: 10, every: 60, lock: 'notification' },
    widget: { look: 'glass', color: '', align: 'center', buttons: true }, qOrder: [],
    style: { pos: 'middle', size: 'm', color: '#FFFFFF', font: 'rubik', bold: true, band: 'dark', shadow: true },
    parts: { morning: 5, noon: 11, evening: 16, night: 20 },
    imgMeta: { w26: { fav: true }, w32: { fav: true }, w09: { fav: true }, w47: { fav: true }, w15: { off: true } },
    qMeta: { m1: { fav: true }, c4: { fav: true }, m37: { fav: true } },
    myQuotes: [{ id: 'q1', t: 'היום אני עושה צעד אחד קדימה.', added: now - 2 * day }, { id: 'q2', t: 'אמא אומרת: כל דבר בזמנו.', added: now - day }],
    mine: [], packs: [],
    store: { autoUpdate: true, lastCheck: now - 3 * 3600e3, removed: [], index: { packs: [
      { id: 'boker', name: 'בוקר טוב', kind: 'quotes', version: 1, count: 30, desc: 'משפטים קצרים לפתוח איתם את היום בכוח ובשמחה.', sample: 'בוקר חדש, הזדמנות חדשה.', auto: true },
      { id: 'hatzlacha', name: 'הצלחה ועשייה', kind: 'quotes', version: 1, count: 30, desc: 'לימים של עבודה, לימודים ויעדים גדולים.', sample: 'הצלחה היא סכום של מאמצים קטנים.' },
      { id: 'zrichot', name: 'זריחות ושקיעות', kind: 'images', version: 1, count: 10, desc: '10 תמונות של שמיים בוערים – לבוקר ולערב.', size: '1.1 MB' },
      { id: 'tzvaim', name: 'צבעים רכים', kind: 'images', version: 1, count: 10, desc: '10 רקעים צבעוניים ונקיים – המשפט בולט עליהם במיוחד.', size: '0.6 MB' }
    ] } },
    ui: { widgetTip: false }, settings: { theme: 'light' }, outbox: [], profile: { name: '', email: '' }, updateSeen: 999999
  };
})()`;

export async function prepare(page, { info }) {
  await page.clock.setFixedTime(evening());
  await page.evaluate((seed) => { localStorage.setItem('glow.theme', 'light'); localStorage.setItem('glow.state.v1', JSON.stringify(eval(seed))); }, SEED);
  await page.reload();
  await page.waitForTimeout(1500);
  return { info };
}

// Before each scene: the same wallpaper and sentence on the screens, and a short history.
export const reset = () => {
  const G = window.GL, now = Date.now();
  G.closeSheet();
  G.state.mode = 'same'; G.state.walls = { home: true, lock: false };
  G.ui.arrange = false;
  G.EN.sim.st = { both: { img: 'w26', imgAt: now - 18 * 60e3 }, lock: { img: 'w32', imgAt: now }, home: { img: 'w09', imgAt: now } };
  G.EN.sim.quote = { id: 'm1', at: now - 5e3 };
  G.EN.sim.widgets = 1;
  G.EN.sim.history = [
    { ts: now - 5e3, key: 'quote', img: '', quote: 'm1', why: 'widget' },
    { ts: now - 18 * 60e3, key: 'both', img: 'w26', quote: '', why: 'time' },
    { ts: now - 31 * 60e3, key: 'quote', img: '', quote: 'c12', why: 'screen' },
    { ts: now - 78 * 60e3, key: 'both', img: 'w43', quote: '', why: 'time' },
    { ts: now - 3 * 3600e3, key: 'quote', img: '', quote: 'm37', why: 'manual' }
  ];
  Object.assign(G.live, { rotations: JSON.parse(JSON.stringify(G.EN.sim.st)), quote: Object.assign({}, G.EN.sim.quote), widgets: 1, history: G.EN.sim.history.slice(), nextAt: now + 45 * 60e3 });
  G.ui.tab = 'home'; G.ui.imgFilter = 'all'; G.ui.qFilter = 'all'; G.ui.q = '';
  G.render();
  window.scrollTo(0, 0);
};

const scene = (name, body, extra) => Object.assign({ name, set: new Function('arg', 'const G = window.GL, ui = G.ui; ' + body) }, extra || {});

export const SCENES = [
  scene('home', 'G.render();', { wait: 900 }),
  scene('home-cards', 'G.render();', { wait: 900, scroll: '.fcard.pink' }),
  scene('both', "G.state.walls = { home: true, lock: true }; G.state.quotes.lock = 'wallpaper'; G.render();", { wait: 900, scroll: '.now' }),
  scene('own', "G.state.walls = { home: false, lock: false }; G.render();", { wait: 900, scroll: '.now' }),
  scene('qset', "G.openSheet('qset');", { wait: 900 }),
  scene('qset-end', "G.openSheet('qset'); setTimeout(() => { const s = document.querySelector('.sheet'); s.scrollTop = s.scrollHeight; }, 300);", { wait: 900 }),
  scene('widget', "G.openSheet('widget');", { wait: 1000 }),
  scene('walls', "G.state.walls = { home: true, lock: true }; G.render(); G.openSheet('walls');", { wait: 900 }),
  scene('style', "G.openSheet('style');", { wait: 1000 }),
  scene('history', "G.openSheet('history');", { wait: 800 }),
  scene('images', "ui.tab = 'images'; G.render();", { wait: 900 }),
  scene('image', "ui.tab = 'images'; G.render(); G.openSheet('image', { id: 'w32' });", { wait: 1000 }),
  scene('quotes', "ui.tab = 'quotes'; G.render();"),
  scene('arrange', "ui.tab = 'quotes'; ui.arrange = true; G.render();"),
  scene('quote', "ui.tab = 'quotes'; G.render(); G.openSheet('quote', { id: 'c4' });", { wait: 1000 }),
  scene('quote-new', "ui.tab = 'quotes'; G.render(); G.openSheet('quote', { isNew: true }); ui.form.t = 'כל יום אני לומד משהו חדש.'; G.renderSheet();", { wait: 700 }),
  scene('store', "ui.tab = 'store'; G.render();"),
  scene('settings', "ui.tab = 'settings'; G.render();"),
  scene('welcome', "G.state.onboarded = false; G.openSheet('welcome'); G.state.onboarded = true;", { wait: 900 }),
  scene('share-app', "ui.tab = 'settings'; G.render(); G.openSheet('shareApp');", { wait: 700 }),
  scene('update', "ui.tab = 'settings'; G.render(); G.update.info = { version: '1.3', build: 9, notes: ['חבילת משפטים חדשה: שבת שלום', 'עוד מראות לווידג\\'ט', 'שיפורים קטנים במהירות'], inApp: true }; G.openSheet('update');", { wait: 700 }),
  scene('feedback', "ui.tab = 'settings'; G.render(); G.state.profile = { name: 'דני כהן', email: 'dani@example.com' }; G.openSheet('feedback');", { fill: ['#fbm', 'הייתי רוצה חבילת משפטים לשבת'], wait: 600 })
];
