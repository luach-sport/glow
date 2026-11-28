/* Clipboard, the share menu, and files and pictures to share. */
(function () {
  'use strict';
  const GL = window.GL;

  GL.writeClipboard = async (text) => {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) { /* fall back below */ }
    try {
      const t = document.createElement('textarea');
      t.value = text; t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.appendChild(t); t.select();
      const ok = document.execCommand('copy'); t.remove(); return ok;
    } catch (e) { return false; }
  };
  GL.shareText = async (text, title) => {
    if (GL.isNative()) { try { await GL.callRaw('Share', 'share', { text, title, dialogTitle: title || 'שיתוף' }); return true; } catch (e) { return false; } }
    if (navigator.share) { try { await navigator.share({ text, title }); return true; } catch (e) { return false; } }
    const ok = await GL.writeClipboard(text);
    if (ok && GL.toast) GL.toast('הועתק ללוח');
    return ok;
  };
  // files: [{ name, content, mime }]. Android: written to the cache and shared one by one (Drive, WhatsApp, mail…).
  // iPhone / browser: all together to the share sheet, or downloaded (web-share.js).
  GL.shareFiles = async (files, title) => {
    if (GL.isNative()) {
      for (const f of files) {
        const w = await GL.call('Filesystem', 'writeFile', { path: f.name, data: f.content, directory: 'CACHE', encoding: 'utf8' });
        if (!w || !w.uri) return false;
        try { await GL.callRaw('Share', 'share', { title: title || f.name, files: [w.uri], dialogTitle: title || 'שיתוף' }); } catch (e) {
          try { await GL.callRaw('Share', 'share', { title: title || f.name, url: w.uri, dialogTitle: title || 'שיתוף' }); } catch (e2) { return false; }
        }
      }
      return true;
    }
    const list = files.map((f) => new File([f.content], f.name, { type: f.mime }));
    if (navigator.canShare && navigator.canShare({ files: list })) { try { await navigator.share({ files: list, title }); return true; } catch (e) { return false; } }
    list.forEach((f) => { const a = document.createElement('a'); a.href = URL.createObjectURL(f); a.download = f.name; document.body.appendChild(a); a.click(); a.remove(); });
    return true;
  };
  GL.shareFile = (name, content, mime, title) => GL.shareFiles([{ name, content, mime }], title);
  // A picture (JPEG base64) to WhatsApp and friends, with a short text.
  GL.shareImage = async (b64, name, text) => {
    if (GL.isNative()) {
      try {
        const w = await GL.callRaw('Filesystem', 'writeFile', { path: 'share/' + name, data: b64, directory: 'CACHE', recursive: true });
        await GL.callRaw('Share', 'share', { title: 'Glow', text, files: [w.uri], dialogTitle: 'שיתוף' });
        return true;
      } catch (e) { return !/cancel/i.test(String(e && (e.message || e))) ? false : true; }
    }
    const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    return GL.shareFiles([{ name, content: bin, mime: 'image/jpeg' }], 'Glow');
  };
})();
