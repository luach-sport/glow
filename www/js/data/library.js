/* All the pictures and sentences in one place: built-in, the user's own, and packs from the store,
   with favourites and "out of the rotation" (off). Albums and sentence sets pick what a rotation uses. */
(function () {
  'use strict';
  const GL = window.GL;
  const meta = (m, id) => m[id] || {};

  GL.allImages = () => {
    const S = GL.state, out = [];
    GL.BUILTIN_WALLS.forEach((w) => {
      const m = meta(S.imgMeta, w.id);
      out.push({ id: w.id, name: w.name, kind: 'builtin', cat: w.cat, parts: m.parts || w.parts, thumb: 'img/thumbs/' + w.id + '.jpg', full: 'img/walls/' + w.id + '.jpg', a: 'public/img/walls/' + w.id + '.jpg', fav: !!m.fav, off: !!m.off });
    });
    S.mine.forEach((p) => {
      const m = meta(S.imgMeta, p.id);
      out.push({ id: p.id, name: p.name || 'תמונה שלי', kind: 'mine', cat: 'mine', parts: p.parts, thumb: GL.fileSrc(p.thumb || p.file), full: GL.fileSrc(p.file), f: p.file, fav: !!m.fav, off: !!m.off });
    });
    S.packs.filter((p) => p.kind === 'images').forEach((pk) => pk.items.forEach((p) => {
      const m = meta(S.imgMeta, p.id);
      out.push({ id: p.id, name: p.name, kind: 'pack', pack: pk.id, packName: pk.name, cat: 'pack:' + pk.id, parts: m.parts || p.parts, thumb: GL.fileSrc(p.thumb || p.file), full: GL.fileSrc(p.file), f: p.file, fav: !!m.fav, off: !!m.off });
    }));
    return out;
  };
  GL.imageById = (id) => GL.allImages().find((i) => i.id === id) || null;

  GL.quotePacks = () => GL.BUILTIN_PACKS.map((p) => ({ id: p.id, name: p.name, items: p.items, builtin: true }))
    .concat(GL.state.packs.filter((p) => p.kind === 'quotes'));

  GL.allQuotes = () => {
    const S = GL.state, out = [];
    GL.quotePacks().forEach((p) => p.items.forEach((q) => { const m = meta(S.qMeta, q.id); out.push({ id: q.id, t: q.t, pack: p.id, packName: p.name, fav: !!m.fav, off: !!m.off }); }));
    S.myQuotes.forEach((q) => { const m = meta(S.qMeta, q.id); out.push({ id: q.id, t: q.t, pack: 'mine', packName: 'המשפטים שלי', mine: true, fav: !!m.fav, off: !!m.off, added: q.added }); });
    return out;
  };
  GL.quoteById = (id) => GL.allQuotes().find((q) => q.id === id) || null;

  // Albums: which pictures a rotation takes from.
  GL.inAlbum = (img, album) => {
    if (album === 'all') return true;
    if (album === 'fav') return img.fav;
    if (album === 'mine') return img.kind === 'mine';
    if (album === 'builtin') return img.kind === 'builtin';
    if (album.indexOf('cat:') === 0) return img.cat === album.slice(4);
    if (album.indexOf('pack:') === 0) return img.pack === album.slice(5);
    return true;
  };
  GL.albums = () => {
    const imgs = GL.allImages();
    const list = [{ v: 'all', l: 'כל התמונות' }, { v: 'fav', l: 'המועדפות' }, { v: 'mine', l: 'התמונות שלי' }, { v: 'builtin', l: 'התמונות של Glow' }];
    Object.keys(GL.WALL_CATS).forEach((c) => list.push({ v: 'cat:' + c, l: GL.WALL_CATS[c] }));
    GL.state.packs.filter((p) => p.kind === 'images').forEach((p) => list.push({ v: 'pack:' + p.id, l: p.name }));
    list.forEach((a) => { a.n = imgs.filter((i) => !i.off && GL.inAlbum(i, a.v)).length; });
    return list;
  };
  GL.albumName = (v) => (GL.albums().find((a) => a.v === v) || { l: 'כל התמונות' }).l;

  // Sentence sets: which sentences a rotation takes from.
  GL.inSet = (q, set) => {
    if (set === 'all') return true;
    if (set === 'fav') return q.fav;
    if (set === 'mine') return !!q.mine;
    if (set.indexOf('pack:') === 0) return q.pack === set.slice(5);
    return true;
  };
  GL.quoteSets = () => {
    const qs = GL.allQuotes();
    const list = [{ v: 'all', l: 'כל המשפטים' }, { v: 'fav', l: 'המועדפים' }, { v: 'mine', l: 'המשפטים שלי' }];
    GL.quotePacks().forEach((p) => list.push({ v: 'pack:' + p.id, l: p.name }));
    list.forEach((s) => { s.n = qs.filter((q) => !q.off && GL.inSet(q, s.v)).length; });
    return list;
  };
  GL.setName = (v) => (GL.quoteSets().find((s) => s.v === v) || { l: 'כל המשפטים' }).l;

  // What a rotation will actually use. An empty album falls back to everything, so the screen never stays blank.
  GL.rotImages = (r) => {
    const all = GL.allImages().filter((i) => !i.off);
    const pick = all.filter((i) => GL.inAlbum(i, r.album));
    return pick.length ? pick : all.length ? all : GL.allImages();
  };
  GL.rotQuotes = (r) => {
    const all = GL.allQuotes().filter((q) => !q.off);
    const pick = all.filter((q) => GL.inSet(q, r.quoteSet));
    return pick.length ? pick : all;
  };

  const setMeta = (store, id, k, v) => {
    const m = Object.assign({}, store[id] || {});
    if (v) m[k] = v; else delete m[k];
    if (Object.keys(m).length) store[id] = m; else delete store[id];
  };
  GL.setImgMeta = (id, k, v) => setMeta(GL.state.imgMeta, id, k, v);
  GL.setQMeta = (id, k, v) => setMeta(GL.state.qMeta, id, k, v);
})();
