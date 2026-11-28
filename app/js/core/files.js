/* Picture files on the phone: the user's own pictures and pictures from store packs, with small thumbnails.
   They live in the app's private folder (glow/img, glow/thumb, glow/packs/…), where the wallpaper engine reads
   them too. In a browser (the site's screenshots) they stay in memory as data URLs. */
(function () {
  'use strict';
  const GL = window.GL;
  const DIR = 'DATA';
  const mem = {};
  let base = null;

  // file:///data/user/0/com.luachsport.glow/files/ – the engine reads the same paths (Context.getFilesDir()).
  async function baseUri() {
    if (base !== null) return base;
    try { const r = await GL.callRaw('Filesystem', 'getUri', { path: '', directory: DIR }); base = String(r.uri || '').replace(/\/?$/, '/'); } catch (e) { base = ''; }
    return base;
  }
  GL.initFiles = baseUri;

  // A path inside the app folder → something an <img> can show.
  GL.fileSrc = (path) => {
    if (!path) return '';
    if (!GL.isNative()) return mem[path] || '';
    const C = GL.capacitor();
    const uri = (base || '') + path;
    try { return C && C.convertFileSrc ? C.convertFileSrc(uri) : uri; } catch (e) { return uri; }
  };

  GL.writeB64 = async (path, b64) => {
    if (!GL.isNative()) { mem[path] = 'data:image/jpeg;base64,' + b64; return path; }
    await GL.callRaw('Filesystem', 'writeFile', { path, data: b64, directory: DIR, recursive: true });
    return path;
  };
  GL.deleteFile = async (path) => {
    if (!path) return;
    if (!GL.isNative()) { delete mem[path]; return; }
    try { await GL.callRaw('Filesystem', 'deleteFile', { path, directory: DIR }); } catch (e) { /* already gone */ }
  };
  GL.deleteDir = async (path) => {
    if (!GL.isNative()) { Object.keys(mem).forEach((k) => { if (k.indexOf(path + '/') === 0) delete mem[k]; }); return; }
    try { await GL.callRaw('Filesystem', 'rmdir', { path, directory: DIR, recursive: true }); } catch (e) { /* not there */ }
  };
  // Downloads straight to a file on the phone (no CORS, no memory spike). Browser: via fetch.
  GL.downloadTo = async (url, path) => {
    let err = null;
    for (let i = 0; i < 2; i++) {
      try {
        const r = await GL.http(url, { as: 'base64', timeout: 40000 });
        if (!r.ok) throw new Error('http ' + r.status);
        const b64 = String(r.data || '').replace(/^data:[^,]*,/, '');
        if (b64.length < 1000) throw new Error('empty file');
        return await GL.writeB64(path, b64);
      } catch (e) { err = e; }
    }
    if (GL.isNative()) { await GL.callRaw('Filesystem', 'downloadFile', { url, path, directory: DIR, recursive: true }); return path; }
    throw err;
  };

  // Loads a picture the user chose, shrinks it for a phone screen and returns JPEG base64 (big + thumbnail).
  function loadImage(src) {
    return new Promise((resolve, reject) => { const im = new Image(); im.onload = () => resolve(im); im.onerror = () => reject(new Error('bad image')); im.src = src; });
  }
  function draw(im, w, h, cover) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d');
    x.imageSmoothingQuality = 'high';
    if (cover) {
      const s = Math.max(w / im.naturalWidth, h / im.naturalHeight);
      const cw = w / s, ch = h / s;
      x.drawImage(im, (im.naturalWidth - cw) / 2, (im.naturalHeight - ch) / 2, cw, ch, 0, 0, w, h);
    } else x.drawImage(im, 0, 0, w, h);
    return c.toDataURL('image/jpeg', cover ? 0.8 : 0.9).replace(/^data:[^,]*,/, '');
  }
  GL.prepareImage = async (file) => {
    const url = URL.createObjectURL(file);
    try {
      const im = await loadImage(url);
      const W = im.naturalWidth, H = im.naturalHeight;
      if (!W || !H) throw new Error('empty');
      const long = Math.max(W, H), short = Math.min(W, H);
      const k = Math.min(1, 2560 / long, 1440 / short);
      return { big: draw(im, Math.round(W * k), Math.round(H * k), false), thumb: draw(im, 270, 540, true), w: W, h: H };
    } finally { URL.revokeObjectURL(url); }
  };
})();
