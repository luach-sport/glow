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

  A['wel-walls'] = (el) => { ui.form.walls = el.dataset.v; GL.renderSheet(); };
  A['wel-lock'] = (el) => { ui.form.lock = el.dataset.v; GL.renderSheet(); };
  A['wel-when'] = (el) => { ui.form.when = el.dataset.v; GL.renderSheet(); };
  A['finish-welcome'] = async () => {
    const f = ui.form, Q = GL.state.quotes;
    GL.state.walls = { home: f.walls === 'both' || f.walls === 'home', lock: f.walls === 'both' || f.walls === 'lock' };
    GL.state.mode = 'same';
    Q.on = true;
    Q.lock = f.lock;
    if (f.when === 's10') { Q.mode = 'seconds'; Q.seconds = 10; }
    else if (f.when === 'm1') { Q.mode = 'interval'; Q.every = 1; }
    else if (f.when === 'h1') { Q.mode = 'interval'; Q.every = 60; }
    else Q.mode = 'screen';
    GL.state.onboarded = true;
    await GL.save(true);
    ui.sheet = null; GL.renderSheet();
    GL.toast('מכין…', 6000);
    await GL.syncEngine(true, true);
    if (GL.isNative() && GL.live.sdk >= 33 && (f.lock === 'notification' || Q.mode === 'screen')) await GL.engine('askNotifications');
    GL.render();
    GL.toast('עכשיו נוסיף את הווידג\'ט למסך הבית', 3500);
    setTimeout(() => GL.A['pin-widget'](), 1200);
  };
})();
