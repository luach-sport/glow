/* Changing "when and what" of a rotation, the sentence design and the hours of the day.
   Every change is saved and sent to the engine (data/state.js → engine/sync.js). */
(function () {
  'use strict';
  const GL = window.GL;
  const A = GL.A;
  const R = (el) => GL.rot(el.dataset.key || (GL.ui.sheet && GL.ui.sheet.data.key) || 'both');
  const done = (apply) => { GL.save(); GL.syncEngine(apply); GL.renderSheet(); GL.render(true); };

  A['rot-target'] = (el) => {
    const r = GL.rot('both'), v = el.dataset.v;
    const next = Object.assign({}, r.targets, { [v]: !r.targets[v] });
    if (!next.home && !next.lock) { GL.toast('צריך לפחות מסך אחד'); return; }
    r.targets = next; done(true);
  };
  A['rot-mode'] = async (el) => {
    const r = R(el), what = el.dataset.what;
    r[what].mode = el.dataset.v;
    done(false);
    if (el.dataset.v === 'screen' && GL.isNative() && GL.live.sdk >= 33 && !GL.live.notifications) await GL.engine('askNotifications');
  };
  A['rot-every'] = (el) => { R(el)[el.dataset.what].every = +el.dataset.v; done(false); };
  A['rot-album'] = (el) => { R(el).album = el.dataset.v; done(true); };
  A['rot-set'] = (el) => { R(el).quoteSet = el.dataset.v; done(true); };
  A['rot-quote-on'] = (el) => { const r = R(el); r.quote.on = !r.quote.on; done(true); };
  A['rot-where'] = (el) => { GL.rot('both').quoteWhere = el.dataset.v; done(true); };

  A['style-set'] = (el) => { GL.state.style[el.dataset.k] = el.dataset.v; GL.save(); GL.renderSheet(); };
  A['style-toggle'] = (el) => { const s = GL.state.style; s[el.dataset.k] = !s[el.dataset.k]; GL.save(); GL.renderSheet(); };
  A['style-apply'] = async () => { GL.closeSheet(); await GL.syncEngine(true, true); GL.toast('העיצוב החדש על הרקע'); GL.render(true); };

  GL.setPart = (part, hour) => { GL.state.parts[part] = hour; GL.save(); GL.syncEngine(false); };

  A['set-mode'] = (el) => {
    GL.state.mode = el.dataset.v;
    GL.save(); GL.syncEngine(true); GL.render(true);
    GL.toast(GL.state.mode === 'separate' ? 'עכשיו לכל מסך הגדרות משלו' : 'רקע אחד לשני המסכים');
  };
})();
