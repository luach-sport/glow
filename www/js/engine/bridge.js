/* Talking to the wallpaper engine on the phone (android-native/GlowPlugin.java).
   In a browser (the site's screenshots, tests) a small stand-in picks pictures and sentences in memory. */
(function () {
  'use strict';
  const GL = window.GL;
  const NAME = 'GlowWall';

  const sim = { config: null, st: {}, history: [] };
  const pickFrom = (list, cur) => { const l = list.filter((x) => x.id !== cur); const p = (l.length ? l : list)[Math.floor(Math.random() * (l.length || list.length))]; return p ? p.id : ''; };
  function simApply(key, img, quote, forceImg, forceQuote) {
    const r = (sim.config.rotations || []).find((x) => x.key === key);
    if (!r) return false;
    const s = sim.st[key] || (sim.st[key] = {});
    if (forceImg) s.img = forceImg; else if (img || !s.img) { s.img = pickFrom(r.images, s.img); s.imgAt = Date.now(); }
    if (r.quote.on) { if (forceQuote) s.quote = forceQuote; else if (quote || !s.quote) { s.quote = pickFrom(r.quotes, s.quote); s.quoteAt = Date.now(); } }
    sim.history.unshift({ ts: Date.now(), key, img: s.img, quote: r.quote.on ? s.quote : '', why: 'manual' });
    sim.history = sim.history.slice(0, 60);
    return true;
  }
  const simStatus = () => ({ rotations: JSON.parse(JSON.stringify(sim.st)), history: sim.history.slice(), screenService: false, nextAt: Date.now() + 42 * 60e3, part: 'evening', sdk: 34, canLock: true, w: 1080, h: 2340, batteryFree: true, notifications: true });

  async function call(method, args) {
    if (GL.isNative()) return GL.callRaw(NAME, method, args || {});
    args = args || {};
    switch (method) {
      case 'sync': {
        sim.config = args.config;
        (sim.config.rotations || []).forEach((r) => { if (args.apply || !sim.st[r.key]) simApply(r.key, false, false); });
        return simStatus();
      }
      case 'change': (sim.config.rotations || []).forEach((r) => { if (!args.key || args.key === r.key) simApply(r.key, args.image !== false, args.quote !== false); }); return Object.assign(simStatus(), { ok: true });
      case 'setNow': (sim.config.rotations || []).forEach((r) => { if (!args.key || args.key === r.key) { if (args.imgEntry && !r.images.some((x) => x.id === args.img)) r.images.push(args.imgEntry); if (args.quoteEntry && !r.quotes.some((x) => x.id === args.quote)) r.quotes.push(args.quoteEntry); simApply(r.key, false, false, args.img, args.quote); } }); return Object.assign(simStatus(), { ok: true });
      case 'undo': return Object.assign(simStatus(), { ok: false });
      case 'takeFavs': return { favs: {} };
      case 'pinWidget': return { ok: false };
      default: return simStatus();
    }
  }
  GL.EN = { sim, call };

  // Every answer carries the engine's status; keep it in GL.live.
  GL.engine = async (method, args) => {
    try {
      const st = await call(method, args);
      if (st && st.rotations) Object.assign(GL.live, st);
      return st || {};
    } catch (e) {
      console.warn('[engine]', method, e && (e.message || e));
      return { ok: false, error: String(e && (e.message || e)) };
    }
  };

  // Hearts pressed on the home-screen widget since the app was last open.
  GL.takeWidgetFavs = async () => {
    const r = await GL.engine('takeFavs');
    const favs = (r && r.favs) || {};
    const ids = Object.keys(favs);
    if (!ids.length) return false;
    ids.forEach((id) => GL.setQMeta(id, 'fav', !!favs[id]));
    return true;
  };
})();
