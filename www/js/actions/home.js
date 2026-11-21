/* Home actions: change now, back to the previous one, heart, share, and the background permissions. */
(function () {
  'use strict';
  const GL = window.GL;
  const A = GL.A;
  const V = GL.views;

  let busy = false;
  A['change-now'] = async (el) => {
    if (busy) return;
    const what = el.dataset.what, key = el.dataset.key || null;
    if (what === 'image' && !GL.wallsOn()) { GL.toast('הרקעים של Glow כבויים. אפשר להדליק אותם במסך הבית'); return; }
    busy = true;
    GL.haptic();
    const r = await GL.engine('change', { key, image: what === 'image', quote: what === 'quote' });
    busy = false;
    if (r && r.ok === false) GL.toast('לא הצלחתי להחליף כרגע');
    else GL.toast(what === 'quote' ? 'משפט חדש ✨' : 'רקע חדש. כוח חדש.');
    GL.rerenderAll();
  };
  A.undo = async () => {
    let ok = false;
    for (const k of GL.activeKeys()) { const r = await GL.engine('undo', { key: k }); ok = ok || (r && r.ok); }
    GL.toast(ok ? 'חזרנו לרקע הקודם' : 'אין רקע קודם להחזיר');
    GL.rerenderAll();
  };
  A['fav-current'] = () => {
    const q = GL.views.curQuote();
    if (!q) return;
    GL.setQMeta(q.id, 'fav', !q.fav);
    GL.save(); GL.haptic();
    GL.toast(q.fav ? 'הוסר מהמועדפים' : 'נוסף למועדפים ♥');
    GL.render(true);
  };
  A['share-current'] = async () => {
    const q = GL.views.curQuote(), img = GL.views.wallOn('lock') || GL.views.wallOn('home') || (GL.rotImages(GL.rot('both'))[0] || {}).id;
    GL.toast('מכין תמונה…', 5000);
    const b64 = await GL.renderJpeg(img, q ? q.t : '');
    GL.$('#toast-root').innerHTML = '';
    await GL.shareImage(b64, 'glow-' + Date.now() + '.jpg', (q ? q.t + '\n\n' : '') + 'מתוך Glow: ' + GL.SITE_URL);
  };
  A['history-restore'] = async (el) => {
    const h = (GL.live.history || [])[+el.dataset.n];
    if (!h) return;
    if (h.img) await GL.engine('setNow', { key: h.key, img: h.img });
    if (h.quote) await GL.engine('setNow', { quote: h.quote });
    GL.closeSheet(); GL.toast(h.img ? 'הרקע הוחזר' : 'המשפט הוחזר'); GL.render(true);
  };
  A['open-battery'] = async () => { await GL.engine('openBattery'); };
  A['ask-notif'] = async () => { await GL.engine('askNotifications'); GL.render(true); };
  A['pin-widget'] = async () => {
    const r = await GL.engine('pinWidget');
    if (!r || !r.ok) GL.toast('לחיצה ארוכה על מסך הבית ← ווידג\'טים ← Glow', 5000);
    else GL.toast('מאשרים בחלון של הטלפון, והווידג\'ט במסך הבית ✨', 4000);
    GL.state.ui.widgetTip = false; GL.save();
    setTimeout(async () => { await GL.engine('status'); GL.rerenderAll(); }, 6000);
  };
  A['hide-widget-tip'] = () => { GL.state.ui.widgetTip = false; GL.save(); GL.render(true); };
})();
