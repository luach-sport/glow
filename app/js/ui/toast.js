/* Short messages at the bottom of the screen, and a light vibration on the phone. */
(function () {
  'use strict';
  const GL = window.GL;
  let timer;

  GL.toast = (msg, ms) => {
    const root = GL.$('#toast-root');
    root.innerHTML = '<div class="toast">' + GL.esc(msg) + '</div>';
    clearTimeout(timer);
    timer = setTimeout(() => { root.innerHTML = ''; }, ms || 2600);
  };
  GL.haptic = () => { if (GL.isNative()) GL.call('Haptics', 'impact', { style: 'LIGHT' }); };
})();
