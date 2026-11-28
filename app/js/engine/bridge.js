/* Talking to the wallpaper engine on the phone (android-native/GlowPlugin.java).
   In a browser (the site's screenshots, tests) a small stand-in keeps the same answers in memory. */
(function () {
  'use strict';
  const GL = window.GL;
  const NAME = 'GlowWall';

  const sim = { config: null, st: {}, quote: { id: '', at: 0 }, history: [], widgets: 1 };
  const pickFrom = (list, cur) => { const l = list.filter((x) => x.id !== cur); const p = (l.length ? l : list)[Math.floor(Math.random() * (l.length || list.length))]; return p ? p.id : ''; };
  const rots = () => (sim.config && sim.config.rotations) || [];
  function simWall(key, fresh, force) {
    const r = rots().find((x) => x.key === key);
    if (!r) return false;
    const s = sim.st[key] || (sim.st[key] = {});
    if (force) s.img = force; else if (fresh || !s.img) s.img = pickFrom(r.images, s.img);
    s.imgAt = Date.now();
    sim.history.unshift({ ts: Date.now(), key, img: s.img, quote: '', why: 'manual' });
    return true;
  }
  function simQuote(force) {
    const list = (sim.config && sim.config.quotes.list) || [];
    if (!list.length) return false;
    const cur = sim.quote.id;
    let id = force;
    if (!id) id = sim.config.quotes.order === 'list' ? (list[(list.findIndex((q) => q.id === cur) + 1) % list.length] || list[0]).id : pickFrom(list, cur);
    sim.quote = { id, at: Date.now() };
    sim.history.unshift({ ts: Date.now(), key: 'quote', img: '', quote: id, why: 'manual' });
    return true;
  }
  const simStatus = () => {
    sim.history = sim.history.slice(0, 60);
    return { rotations: JSON.parse(JSON.stringify(sim.st)), quote: Object.assign({}, sim.quote), widgets: sim.widgets, history: sim.history.slice(), screenService: false, nextAt: Date.now() + 42 * 60e3, part: 'evening', sdk: 34, canLock: true, w: 1080, h: 2340, batteryFree: true, notifications: true };
  };

  async function call(method, args) {
    if (GL.isNative()) return GL.callRaw(NAME, method, args || {});
    args = args || {};
    switch (method) {
      case 'sync': {
        sim.config = args.config;
        if (!sim.config.quotes.list.some((q) => q.id === sim.quote.id)) simQuote();
        rots().forEach((r) => { if (args.apply || !sim.st[r.key]) simWall(r.key, !sim.st[r.key]); });
        return simStatus();
      }
      case 'change': {
        let ok = false;
        if (args.quote) ok = simQuote() || ok;
        if (args.image) rots().forEach((r) => { if (!args.key || args.key === r.key) ok = simWall(r.key, true) || ok; });
        return Object.assign(simStatus(), { ok });
      }
      case 'setNow': {
        let ok = false;
        if (args.quote) { if (args.quoteEntry && !sim.config.quotes.list.some((q) => q.id === args.quote)) sim.config.quotes.list.push(args.quoteEntry); ok = simQuote(args.quote); }
        if (args.img) rots().forEach((r) => { if (!args.key || args.key === r.key) { if (args.imgEntry && !r.images.some((x) => x.id === args.img)) r.images.push(args.imgEntry); ok = simWall(r.key, false, args.img) || ok; } });
        return Object.assign(simStatus(), { ok });
      }
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
