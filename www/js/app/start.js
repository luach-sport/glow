/* Start-up: load the data, ask the engine what is on the screens, draw, and listen to the phone
   (back button, coming back to the app, internet). Background work: feedback, new versions, the store. */
(function () {
  'use strict';
  const GL = window.GL;
  const ui = GL.ui;

  async function autoUpdateCheck() {
    const info = await GL.update.check(false);
    if (info && info.build > (GL.state.updateSeen || 0) && !ui.sheet && GL.state.onboarded) GL.openSheet('update');
  }
  function background() { GL.flushOutbox(); autoUpdateCheck(); GL.store.auto(); }

  // Coming back to the app: what changed while it was closed (new wallpapers, hearts on the widget).
  async function refreshLive() {
    await GL.engine('status');
    if (await GL.takeWidgetFavs()) GL.save();
    if (!ui.sheet) GL.render(true);
  }

  function listenToPhone() {
    if (!GL.isNative()) return;
    GL.listen('App', 'backButton', GL.onBack);
    GL.listen('App', 'appStateChange', (st) => {
      if (st && st.isActive) { refreshLive(); background(); } else GL.flushSave();
    });
    GL.listen('App', 'pause', () => GL.flushSave());
  }

  async function init() {
    GL.bindEvents();
    await GL.initNetwork();
    await GL.initFiles();
    GL.state = GL.normalize(await GL.loadState());
    GL.applyTheme();
    GL.watchSystemTheme();
    await GL.engine('status');
    // Every saved change goes to the engine too.
    GL.onChange(() => GL.syncEngine(false));
    GL.afterEngine = () => { if (!ui.sheet) GL.render(true); else GL.rerenderAll(); };
    if (GL.state.onboarded) { await GL.syncEngine(false, true); if (await GL.takeWidgetFavs()) GL.save(); }
    GL.render();
    listenToPhone();
    if (!GL.state.onboarded) GL.openSheet('welcome');
    GL.onUpdate(() => {
      if (GL.sheetIs('update')) GL.renderSheet();
      else if (!ui.sheet && ui.tab === 'settings') GL.render(true);
    });
    GL.onStore(() => { if (ui.tab === 'store' && !ui.sheet) GL.render(true); });
    GL.onNetwork((on) => { if (GL.sheetIs('feedback')) GL.renderSheet(); if (on) background(); });
    // The clock on the lock-screen preview, and "next change in…".
    setInterval(() => { if (!ui.sheet && ui.tab === 'home' && document.visibilityState !== 'hidden') GL.render(true); }, 60000);
    background();
  }

  // Small test surface for automated checks and the site's screenshots.
  window.__glow = {
    get ui() { return ui; }, A: GL.A, EN: GL.EN,
    normalize: GL.normalize, render: GL.render, openSheet: GL.openSheet, closeSheet: GL.closeSheet, engine: GL.engine
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
