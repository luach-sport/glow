/* Turning the app's settings into what the engine needs (engine.json on the phone): Glow's wallpapers per screen,
   the sentences (widget, lock screen) and the widget's look – sent after every change. The engine then works alone – timed alarms, every screen-on, the widget – even when the app is closed. */
(function () {
  'use strict';
  const GL = window.GL;

  const imgEntry = (GL.imgEntry = (i) => { const o = { id: i.id, p: i.parts || [] }; if (i.a) o.a = i.a; else o.f = i.f; return o; });

  function rotationConfig(key) {
    const r = GL.rot(key), S = GL.state;
    const targets = GL.targetsOf(key);
    const bake = S.quotes.on && S.quotes.lock === 'wallpaper' && targets.includes('lock') ? ['lock'] : [];
    return { key, on: targets.length > 0, targets, bake, img: { mode: r.img.mode, every: r.img.every }, images: GL.rotImages(r).map(imgEntry) };
  }

  function quotesConfig() {
    const Q = GL.state.quotes, S = GL.state;
    const lock = Q.lock === 'wallpaper' && !GL.targetsOf('both').includes('lock') && !(S.mode === 'separate' && S.walls.lock) ? 'notification' : Q.lock;
    return {
      on: Q.on, mode: Q.mode, seconds: Q.seconds, every: Q.every, order: Q.order, lock,
      list: Q.on ? GL.setQuotes().map((q) => ({ id: q.id, t: q.t, fav: !!(S.qMeta[q.id] || {}).fav })) : []
    };
  }

  GL.engineConfig = () => ({
    v: 3,
    rotations: GL.activeKeys().map(rotationConfig),
    quotes: quotesConfig(),
    widget: GL.state.widget,
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
