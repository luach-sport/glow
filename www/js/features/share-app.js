/* Sharing the app with friends: a short personal message with the link to the app's site, or the app
   itself as an APK file (Bluetooth, WhatsApp, Nearby Share, file manager…).
   The APK file is the one installed on this phone, so it works without internet. If that copy can't be
   reached, the latest APK is downloaded from GitHub instead. */
(function () {
  'use strict';
  const GL = window.GL;
  const S = (GL.shareApp = {});
  const FILE = 'share/glow.apk';

  S.text = 'היי! אני משתמש באפליקציה Glow. היא מחליפה לבד את הרקע של הטלפון ושמה עליו משפטי מוטיבציה וחיזוק, גם במסך הנעילה. עובדת בלי אינטרנט, בלי פרסומות ובלי הרשמה. אשמח מאוד לשתף אותך:';
  S.message = () => S.text + '\n' + GL.SITE_URL;

  S.link = () => GL.shareText(S.message(), 'שיתוף Glow');

  // Where Android installed this app: the line with base.apk in the process memory map.
  async function installedApk() {
    const r = await GL.callRaw('Filesystem', 'readFile', { path: '/proc/self/maps', encoding: 'utf8' });
    const m = String((r && r.data) || '').match(/(\/data\/app\/\S+?\/base\.apk)/);
    if (!m) throw new Error('no base.apk');
    return m[1];
  }

  async function prepareFile(onStatus) {
    try { await GL.callRaw('Filesystem', 'deleteFile', { path: FILE, directory: 'CACHE' }); } catch (e) { /* not there */ }
    try { await GL.callRaw('Filesystem', 'mkdir', { path: 'share', directory: 'CACHE', recursive: true }); } catch (e) { /* exists */ }
    try {
      await GL.callRaw('Filesystem', 'copy', { from: await installedApk(), to: FILE, toDirectory: 'CACHE' });
    } catch (e) {
      console.warn('apk copy', e && (e.message || e));
      if (!GL.online()) throw new Error('offline');
      onStatus('מוריד את הקובץ…');
      await GL.callRaw('Filesystem', 'downloadFile', { url: GL.APK_URL, path: FILE, directory: 'CACHE', recursive: true });
    }
    const st = await GL.callRaw('Filesystem', 'stat', { path: FILE, directory: 'CACHE' });
    if (!st || st.size < 500000) throw new Error('small file');
    return (await GL.callRaw('Filesystem', 'getUri', { path: FILE, directory: 'CACHE' })).uri;
  }

  S.apk = async () => {
    if (!GL.isNative()) { window.open(GL.APK_URL, '_blank'); return true; }
    if (S.busy) return false;
    S.busy = true;
    GL.toast('מכין את הקובץ…', 8000);
    try {
      const uri = await prepareFile((t) => GL.toast(t, 30000));
      const t = GL.$('#toast-root'); if (t) t.innerHTML = '';
      await GL.callRaw('Share', 'share', { title: 'Glow', text: S.message(), files: [uri], dialogTitle: 'שליחת האפליקציה כקובץ' });
      return true;
    } catch (e) {
      const msg = String(e && (e.message || e));
      if (/cancel/i.test(msg)) return false;
      console.warn('share apk', msg);
      GL.toast(msg === 'offline' ? 'אין אינטרנט כרגע. אפשר לשלוח קישור לאתר במקום' : 'לא הצלחתי להכין את הקובץ. אפשר לשלוח קישור לאתר במקום', 4000);
      return false;
    } finally {
      S.busy = false;
    }
  };
})();
