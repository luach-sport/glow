/* Settings actions: theme, sharing the app, updates, and the first-start sheet. */
(function () {
  'use strict';
  const GL = window.GL;
  const A = GL.A;
  const ui = GL.ui;

  A['set-theme'] = (el) => { GL.state.settings.theme = el.dataset.v; GL.save(); GL.applyTheme(); GL.render(true); };
  A['share-app'] = () => GL.openSheet('shareApp');
  A['share-app-link'] = () => { GL.closeSheet(); GL.shareApp.link(); };
  A['share-app-apk'] = () => { GL.closeSheet(); GL.shareApp.apk(); };
  A['share-app-copy'] = async () => { GL.closeSheet(); if (await GL.writeClipboard(GL.SITE_URL)) GL.toast('הקישור לאתר הועתק'); };
  A['check-update'] = async () => {
    const i = await GL.update.check(true);
    if (i) GL.openSheet('update'); else GL.toast(GL.update.error || 'יש לך את הגרסה האחרונה');
    GL.render(true);
  };
  A['update-now'] = () => GL.update.apply();
  A['update-later'] = () => { if (GL.update.info) GL.state.updateSeen = GL.update.info.build; GL.save(); GL.closeSheet(); };

  A['wel-where'] = (el) => { ui.form.where = el.dataset.v; GL.renderSheet(); };
  A['wel-when'] = (el) => { ui.form.when = el.dataset.v; GL.renderSheet(); };
  A['finish-welcome'] = async () => {
    const f = ui.form, r = GL.rot('both');
    r.targets = { home: f.where !== 'lock', lock: f.where !== 'home' };
    r.quoteWhere = 'lock';
    if (f.when === 'screen') { r.img = { mode: 'screen', every: 60 }; r.quote = { on: true, mode: 'screen', every: 60 }; }
    else if (f.when === 'hour') { r.img = { mode: 'interval', every: 60 }; r.quote = { on: true, mode: 'screen', every: 60 }; }
    else if (f.when === 'parts') { r.img = { mode: 'parts', every: 60 }; r.quote = { on: true, mode: 'parts', every: 60 }; }
    else { r.img = { mode: 'interval', every: 1440 }; r.quote = { on: true, mode: 'interval', every: 1440 }; }
    GL.state.mode = 'same';
    GL.state.onboarded = true;
    await GL.save(true);
    ui.sheet = null; GL.renderSheet();
    GL.toast('מכין את הרקע הראשון…', 6000);
    await GL.syncEngine(true, true);
    if (f.when === 'screen' && GL.isNative() && GL.live.sdk >= 33) await GL.engine('askNotifications');
    GL.toast('רקע חדש. כוח חדש.');
    GL.render();
  };
})();
