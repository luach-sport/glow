/* Turning the app's settings into what the engine needs (engine.json on the phone), and sending it after
   every change. The engine then works alone – timed alarms, every screen-on, the widget – even when the app is closed. */
(function () {
  'use strict';
  const GL = window.GL;

  const imgEntry = (GL.imgEntry = (i) => { const o = { id: i.id, p: i.parts || [] }; if (i.a) o.a = i.a; else o.f = i.f; return o; });

  function rotationConfig(key) {
    const r = GL.rot(key), S = GL.state;
    const targets = [];
    if (r.targets.home) targets.push('home');
    if (r.targets.lock && GL.live.canLock !== false) targets.push('lock');
    const where = key === 'both' ? r.quoteWhere : key;
    const quoteOn = targets.filter((t) => where === 'both' || where === t);
    return {
      key, on: r.on && targets.length > 0, targets, quoteOn,
      img: { mode: r.img.mode, every: r.img.every },
      quote: { on: r.quote.on, mode: r.quote.mode, every: r.quote.every },
      images: GL.rotImages(r).map(imgEntry),
      quotes: r.quote.on ? GL.rotQuotes(r).map((q) => ({ id: q.id, t: q.t, fav: !!(S.qMeta[q.id] || {}).fav })) : []
    };
  }

  GL.engineConfig = () => ({
    v: 1,
    rotations: GL.activeKeys().map(rotationConfig),
    style: GL.state.style,
    parts: GL.state.parts
  });

  let timer = null, pendingApply = false;
  // apply: set a fresh wallpaper right away with the new settings (e.g. after changing the design).
  GL.syncEngine = (apply, now) => {
    pendingApply = pendingApply || !!apply;
    clearTimeout(timer);
    const run = async () => {
      timer = null;
      if (!GL.state.onboarded) return;
      const a = pendingApply; pendingApply = false;
      await GL.engine('sync', { config: GL.engineConfig(), apply: a });
      if (GL.afterEngine) GL.afterEngine();
    };
    if (now) return run();
    timer = setTimeout(run, 700);
    return null;
  };
})();
