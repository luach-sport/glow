/* Picture actions: filter, add from the phone, put now, favourite, in/out of the rotation, times of day, delete, share. */
(function () {
  'use strict';
  const GL = window.GL;
  const A = GL.A;
  const ui = GL.ui;

  A['img-filter'] = (el) => { ui.imgFilter = el.dataset.v; GL.render(true); };
  A['open-image'] = (el) => GL.openSheet('image', { id: el.dataset.id });
  A['add-images'] = () => { const i = GL.$('#image-file'); i.value = ''; i.click(); };

  // The chosen files: shrunk for a phone screen, saved in the app's folder, and added to the rotation.
  GL.addImageFiles = async (files) => {
    const list = Array.from(files || []).filter((f) => /^image\//.test(f.type) || /\.(jpe?g|png|webp|heic)$/i.test(f.name)).slice(0, 60);
    if (!list.length) return;
    let n = 0;
    for (let k = 0; k < list.length; k++) {
      GL.toast('מוסיף תמונות… ' + (k + 1) + '/' + list.length, 30000);
      try {
        const p = await GL.prepareImage(list[k]);
        const id = 'u' + GL.uid();
        const file = await GL.writeB64('glow/img/' + id + '.jpg', p.big);
        const thumb = await GL.writeB64('glow/thumb/' + id + '.jpg', p.thumb);
        GL.state.mine.push({ id, file, thumb, name: String(list[k].name || '').replace(/\.[^.]+$/, '').slice(0, 60) || 'תמונה שלי', added: Date.now(), parts: [] });
        n++;
      } catch (e) { console.warn('image', e && e.message); }
    }
    GL.save();
    GL.toast(n ? (n === 1 ? 'התמונה נוספה לסבב' : n + ' תמונות נוספו לסבב') : 'לא הצלחתי לקרוא את התמונות');
    ui.imgFilter = n ? 'mine' : ui.imgFilter;
    GL.render(true);
  };

  A['image-now'] = async (el) => {
    const id = el.dataset.id, img = GL.imageById(id);
    if (img && img.off) GL.setImgMeta(id, 'off', false);
    if (!GL.wallsOn()) GL.state.walls.home = true;
    GL.save();
    await GL.syncEngine(false, true);
    const r = await GL.engine('setNow', { key: el.dataset.key || null, img: id, imgEntry: GL.imgEntry(img) });
    GL.closeSheet();
    GL.toast(r && r.ok === false ? 'לא הצלחתי לשים את התמונה' : 'הרקע הוחלף', 4000);
    GL.render(true);
  };
  A['fav-image'] = (el) => { const i = GL.imageById(el.dataset.id); GL.setImgMeta(i.id, 'fav', !i.fav); GL.save(); GL.haptic(); GL.rerenderAll(); };
  A['toggle-image-off'] = (el) => {
    const i = GL.imageById(el.dataset.k);
    if (!i.off && GL.allImages().filter((x) => !x.off).length <= 1) { GL.toast('צריך לפחות תמונה אחת בסבב'); return; }
    GL.setImgMeta(i.id, 'off', !i.off); GL.save(); GL.rerenderAll();
  };
  A['image-part'] = (el) => {
    const i = GL.imageById(el.dataset.id), v = el.dataset.v;
    const parts = (i.parts || []).includes(v) ? i.parts.filter((p) => p !== v) : (i.parts || []).concat([v]);
    if (i.kind === 'mine') { const m = GL.state.mine.find((x) => x.id === i.id); m.parts = parts; } else GL.setImgMeta(i.id, 'parts', parts);
    GL.save(); GL.renderSheet();
  };
  A['delete-image'] = async (el) => {
    const id = el.dataset.id, m = GL.state.mine.find((x) => x.id === id);
    if (!m) return;
    if (GL.allImages().filter((x) => !x.off && x.id !== id).length < 1) { GL.toast('צריך לפחות תמונה אחת בסבב'); return; }
    await GL.deleteFile(m.file); await GL.deleteFile(m.thumb);
    GL.state.mine = GL.state.mine.filter((x) => x.id !== id);
    delete GL.state.imgMeta[id];
    GL.save(); GL.closeSheet(); GL.toast('התמונה נמחקה'); GL.render(true);
  };
  A['share-image'] = async (el) => {
    const q = GL.views.curQuote();
    const b64 = await GL.renderJpeg(el.dataset.id, q ? q.t : '');
    await GL.shareImage(b64, 'glow-' + Date.now() + '.jpg', (q ? q.t + '\n\n' : '') + 'מתוך Glow: ' + GL.SITE_URL);
  };
})();
