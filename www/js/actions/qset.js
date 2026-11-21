/* The sentences (on/off, lock screen, when, which, order), the widget's look and the sentence design on a wallpaper. */
(function () {
  'use strict';
  const GL = window.GL;
  const A = GL.A;
  const Q = () => GL.state.quotes;
  const done = () => { GL.save(); GL.syncEngine(false); if (GL.ui.sheet) GL.renderSheet(); GL.render(true); };
  const askNotif = async () => { if (GL.isNative() && GL.live.sdk >= 33 && !GL.live.notifications) await GL.engine('askNotifications'); };

  A['toggle-quotes'] = () => { Q().on = !Q().on; done(); GL.toast(Q().on ? 'המשפטים דולקים ✨' : 'המשפטים כבויים'); if (Q().on && GL.views.lockMode() === 'notification') askNotif(); };
  A['q-lock'] = (el) => { Q().lock = el.dataset.v; done(); if (el.dataset.v === 'notification') askNotif(); };
  A['q-mode'] = (el) => { Q().mode = el.dataset.v; done(); if (el.dataset.v === 'screen') askNotif(); };
  A['q-seconds'] = (el) => { Q().seconds = +el.dataset.v; done(); };
  A['q-every'] = (el) => { Q().every = +el.dataset.v; done(); };
  A['q-set'] = (el) => { Q().set = el.dataset.v; done(); };
  A['q-order'] = (el) => { Q().order = el.dataset.v; done(); };
  A['arrange-quotes'] = () => { GL.closeSheet(); GL.ui.tab = 'quotes'; GL.ui.arrange = true; GL.ui.qFilter = 'all'; GL.ui.q = ''; GL.render(); };

  A['w-look'] = (el) => { GL.state.widget.look = el.dataset.v; done(); };
  A['w-color'] = (el) => { GL.state.widget.color = el.dataset.v; done(); };
  A['w-align'] = (el) => { GL.state.widget.align = el.dataset.v; done(); };
  A['w-buttons'] = () => { GL.state.widget.buttons = !GL.state.widget.buttons; done(); };

  A['style-set'] = (el) => { GL.state.style[el.dataset.k] = el.dataset.v; GL.save(); GL.renderSheet(); };
  A['style-toggle'] = (el) => { const s = GL.state.style; s[el.dataset.k] = !s[el.dataset.k]; GL.save(); GL.renderSheet(); };
  A['style-apply'] = async () => { GL.closeSheet(); await GL.syncEngine(true, true); GL.toast('העיצוב החדש על הרקע'); GL.render(true); };

  GL.setPart = (part, hour) => { GL.state.parts[part] = hour; GL.save(); GL.syncEngine(false); };
})();
