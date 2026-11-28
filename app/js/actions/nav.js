/* Moving around: tabs, sheets, back, links, and the controls every sheet uses. */
(function () {
  'use strict';
  const GL = window.GL;
  const A = GL.A;
  const ui = GL.ui;

  A.tab = (el) => { GL.closeSheet(); ui.stack = []; ui.tab = el.dataset.tab; GL.render(); if (ui.tab === 'store' && !GL.state.store.index) GL.store.refresh(false); };
  A.back = () => GL.onBack();
  A['open-sheet'] = (el) => GL.openSheet(el.dataset.sheet, { type: el.dataset.type });
  A['close-sheet'] = () => GL.closeSheet();
  A['open-site'] = () => { try { window.open(GL.SITE_URL, '_blank', 'noopener'); } catch (e) { /* ignore */ } };
  A['open-url'] = (el) => { try { window.open(el.dataset.url, '_blank', 'noopener'); } catch (e) { /* ignore */ } };

  // Android back button.
  GL.onBack = () => {
    if (ui.sheet) { if (!(GL.SHEETS[ui.sheet.name].noClose && GL.SHEETS[ui.sheet.name].noClose())) GL.closeSheet(); return; }
    if (ui.tab !== 'home') { ui.tab = 'home'; GL.render(); return; }
    GL.call('App', 'exitApp');
  };
})();
