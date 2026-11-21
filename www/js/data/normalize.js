/* Checking saved data (or a file someone imported): anything missing gets its default, anything broken is dropped. */
(function () {
  'use strict';
  const GL = window.GL;
  const { isObj, str } = GL;
  const one = (v, list, def) => (list.indexOf(v) >= 0 ? v : def);
  const MODES = ['interval', 'screen', 'parts', 'manual'];

  function rotation(r, def) {
    r = isObj(r) ? r : {};
    const img = isObj(r.img) ? r.img : {}, q = isObj(r.quote) ? r.quote : {}, t = isObj(r.targets) ? r.targets : def.targets;
    return {
      on: r.on !== false,
      targets: { home: t.home !== false && !!t.home, lock: !!t.lock },
      album: typeof r.album === 'string' ? r.album.slice(0, 60) : 'all',
      quoteSet: typeof r.quoteSet === 'string' ? r.quoteSet.slice(0, 60) : 'all',
      img: { mode: one(img.mode, MODES, def.img.mode), every: GL.EVERY.indexOf(+img.every) >= 0 ? +img.every : def.img.every },
      quote: { on: q.on !== false, mode: one(q.mode, MODES, def.quote.mode), every: GL.EVERY.indexOf(+q.every) >= 0 ? +q.every : def.quote.every },
      quoteWhere: one(r.quoteWhere, ['both', 'lock', 'home'], 'both')
    };
  }
  const meta = (m) => {
    const out = {};
    if (!isObj(m)) return out;
    Object.keys(m).slice(0, 5000).forEach((k) => {
      const x = m[k];
      if (!isObj(x)) return;
      const o = {};
      if (x.fav) o.fav = true;
      if (x.off) o.off = true;
      if (Array.isArray(x.parts)) o.parts = x.parts.filter((p) => ['morning', 'noon', 'evening', 'night'].includes(p));
      if (Object.keys(o).length) out[str(k, 80)] = o;
    });
    return out;
  };
  const parts = (p) => (Array.isArray(p) ? p.filter((x) => ['morning', 'noon', 'evening', 'night'].includes(x)) : []);

  GL.normalize = (raw) => {
    const d = GL.defaults();
    if (!isObj(raw)) return d;
    const s = Object.assign(d, {
      createdAt: +raw.createdAt || d.createdAt,
      onboarded: !!raw.onboarded,
      mode: one(raw.mode, ['same', 'separate'], 'same'),
      updateSeen: +raw.updateSeen || 0
    });
    const rot = isObj(raw.rot) ? raw.rot : {};
    s.rot = { both: rotation(rot.both, d.rot.both), home: rotation(rot.home, d.rot.home), lock: rotation(rot.lock, d.rot.lock) };
    s.rot.home.targets = { home: true, lock: false };
    s.rot.lock.targets = { home: false, lock: true };
    if (!s.rot.both.targets.home && !s.rot.both.targets.lock) s.rot.both.targets = { home: true, lock: true };
    // Version 2: the sentence moved off the home screen (app icons cover it) into the widget.
    if ((+raw.v || 1) < 2 && s.rot.both.quoteWhere === 'both') s.rot.both.quoteWhere = 'lock';
    s.v = 2;
    const st = isObj(raw.style) ? raw.style : {};
    s.style = {
      pos: one(st.pos, ['top', 'middle', 'bottom'], 'middle'),
      size: one(st.size, ['s', 'm', 'l', 'xl'], 'm'),
      color: /^#[0-9A-Fa-f]{6}$/.test(st.color || '') ? st.color : '#FFFFFF',
      font: one(st.font, ['rubik', 'sans', 'serif'], 'rubik'),
      bold: st.bold !== false,
      band: one(st.band, ['dark', 'light', 'none'], 'dark'),
      shadow: st.shadow !== false
    };
    const pt = isObj(raw.parts) ? raw.parts : {};
    const hr = (v, def) => (Number.isInteger(+v) && +v >= 0 && +v <= 23 ? +v : def);
    s.parts = { morning: hr(pt.morning, 5), noon: hr(pt.noon, 11), evening: hr(pt.evening, 16), night: hr(pt.night, 20) };
    s.imgMeta = meta(raw.imgMeta);
    s.qMeta = meta(raw.qMeta);
    s.mine = (Array.isArray(raw.mine) ? raw.mine : []).filter((m) => isObj(m) && m.id && m.file).map((m) => ({ id: str(m.id, 40), file: str(m.file, 200), thumb: str(m.thumb, 200), name: str(m.name, 80), added: +m.added || Date.now(), parts: parts(m.parts) }));
    s.myQuotes = (Array.isArray(raw.myQuotes) ? raw.myQuotes : []).filter((q) => isObj(q) && q.id && String(q.t || '').trim()).map((q) => ({ id: str(q.id, 40), t: str(q.t, 300), added: +q.added || Date.now() }));
    s.packs = (Array.isArray(raw.packs) ? raw.packs : []).filter((p) => isObj(p) && p.id && Array.isArray(p.items) && (p.kind === 'quotes' || p.kind === 'images')).map((p) => ({
      id: str(p.id, 40), name: str(p.name, 60), kind: p.kind, version: +p.version || 1, desc: str(p.desc, 200), installedAt: +p.installedAt || Date.now(),
      items: p.kind === 'quotes'
        ? p.items.filter((q) => isObj(q) && q.id && q.t).map((q) => ({ id: str(q.id, 60), t: str(q.t, 300) }))
        : p.items.filter((q) => isObj(q) && q.id && q.file).map((q) => ({ id: str(q.id, 60), name: str(q.name, 80), file: str(q.file, 200), thumb: str(q.thumb, 200), parts: parts(q.parts) }))
    }));
    const so = isObj(raw.store) ? raw.store : {};
    s.store = { autoUpdate: so.autoUpdate !== false, lastCheck: +so.lastCheck || 0, index: isObj(so.index) && Array.isArray(so.index.packs) ? so.index : null, removed: (Array.isArray(so.removed) ? so.removed : []).map((x) => str(x, 40)).slice(-100) };
    const u = isObj(raw.ui) ? raw.ui : {};
    s.ui = { widgetTip: u.widgetTip !== false };
    const se = isObj(raw.settings) ? raw.settings : {};
    s.settings = { theme: one(se.theme, ['light', 'dark', 'system'], 'system') };
    s.outbox = (Array.isArray(raw.outbox) ? raw.outbox : []).filter(isObj).slice(-30);
    const pr = isObj(raw.profile) ? raw.profile : {};
    s.profile = { name: str(pr.name, 80), email: str(pr.email, 120) };
    return s;
  };
})();
