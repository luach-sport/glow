/* Online / offline status. */
(function () {
  'use strict';
  const GL = window.GL;

  let online = typeof navigator !== 'undefined' ? navigator.onLine !== false : true;
  const netListeners = [];
  GL.online = () => online;
  GL.onNetwork = (cb) => netListeners.push(cb);
  function setOnline(v) {
    v = !!v;
    if (v === online) return;
    online = v;
    netListeners.forEach((cb) => { try { cb(v); } catch (e) { console.warn(e); } });
  }
  GL.initNetwork = async () => {
    window.addEventListener('online', () => setOnline(true));
    window.addEventListener('offline', () => setOnline(false));
    if (GL.isNative()) {
      const st = await GL.call('Network', 'getStatus');
      if (st && typeof st.connected === 'boolean') online = st.connected;
      GL.listen('Network', 'networkStatusChange', (s) => setOnline(s && s.connected));
    }
  };
})();
