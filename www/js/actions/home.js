/* Home actions: change now, back to the previous one, heart, share, and the background permissions. */
(function () {
  'use strict';
  const GL = window.GL;
  const A = GL.A;
  const V = GL.views;

  let busy = false;
  A['change-now'] = async (el) => {
    if (busy) return;
    busy = true;
    const what = el.dataset.what, key = el.dataset.key || null;
    GL.haptic();
    if (GL.sheetIs('rotation')) GL.closeSheet();
    const r = await GL.engine('change', { key, image: what !== 'quote', quote: true });
    busy = false;
    if (r && r.ok === false) GL.toast(r.error ? 'לא הצלחתי להחליף רקע' : 'אין מה להחליף כרגע');
    else GL.toast(what === 'quote' ? 'משפט חדש' : 'רקע חדש. כוח חדש.');
    GL.rerenderAll();
  };
  A.undo = async () => {
    const keys = GL.activeKeys();
    let ok = false;
    for (const k of keys) { const r = await GL.engine('undo', { key: k }); ok = ok || (r && r.ok); }
    GL.toast(ok ? 'חזרנו לרקע הקודם' : 'אין רקע קודם להחזיר');
    GL.rerenderAll();
  };
  A['fav-current'] = () => {
    const c = V.current(GL.activeKeys()[0]);
    if (!c.quote) return;
    const q = GL.quoteById(c.quote);
    GL.setQMeta(c.quote, 'fav', !q.fav);
    GL.save(); GL.haptic();
    GL.toast(q.fav ? 'הוסר מהמועדפים' : 'נוסף למועדפים');
    GL.render(true);
  };
  A['share-current'] = async () => {
    const k = GL.activeKeys()[0], c = V.current(k), q = c.quote ? GL.quoteById(c.quote) : null;
    GL.toast('מכין תמונה…', 5000);
    const b64 = await GL.renderJpeg(c.img, q ? q.t : '');
    GL.$('#toast-root').innerHTML = '';
    await GL.shareImage(b64, 'glow-' + Date.now() + '.jpg', (q ? q.t + '\n\n' : '') + 'מתוך Glow: ' + GL.SITE_URL);
  };
  A['open-rotation'] = (el) => GL.openSheet('rotation', { key: el.dataset.key });
  A['history-restore'] = async (el) => {
    const h = (GL.live.history || [])[+el.dataset.n];
    if (!h) return;
    await GL.engine('setNow', { key: h.key, img: h.img, quote: h.quote || null });
    GL.closeSheet(); GL.toast('הרקע הוחזר'); GL.render(true);
  };
  A['open-battery'] = async () => { await GL.engine('openBattery'); };
  A['ask-notif'] = async () => { await GL.engine('askNotifications'); GL.render(true); };
  A['pin-widget'] = async () => {
    const r = await GL.engine('pinWidget');
    if (!r || !r.ok) GL.toast('לחיצה ארוכה על מסך הבית ← ווידג\'טים ← Glow', 5000);
    GL.state.ui.widgetTip = false; GL.save(); GL.render(true);
  };
  A['hide-widget-tip'] = () => { GL.state.ui.widgetTip = false; GL.save(); GL.render(true); };
})();
