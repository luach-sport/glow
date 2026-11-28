/* Light / dark / follow the phone, including the phone's status bar colour. */
(function () {
  'use strict';
  const GL = window.GL;

  GL.resolvedTheme = () => {
    const t = GL.state.settings.theme;
    if (t === 'system') return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    return t;
  };
  GL.applyTheme = () => {
    const t = GL.resolvedTheme();
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('glow.theme', GL.state.settings.theme); } catch (e) { /* ignore */ }
    const bg = t === 'dark' ? '#120A1F' : '#F7F3FC';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', bg);
    if (GL.isNative()) {
      GL.call('StatusBar', 'setBackgroundColor', { color: bg });
      GL.call('StatusBar', 'setStyle', { style: t === 'dark' ? 'DARK' : 'LIGHT' });
    }
  };
  GL.watchSystemTheme = () => {
    if (!window.matchMedia) return;
    try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (GL.state.settings.theme === 'system') GL.applyTheme(); }); } catch (e) { /* old WebView */ }
  };
})();
