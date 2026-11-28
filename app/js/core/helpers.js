/* Small helpers: escaping, ids, timing, lists and numbers. */
(function () {
  'use strict';
  const GL = window.GL;

  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  GL.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ESC[c]);
  GL.clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  GL.uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  GL.debounce = (fn, ms) => { let t; return function () { const a = arguments; clearTimeout(t); t = setTimeout(() => fn.apply(null, a), ms); }; };
  GL.sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  GL.isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s || '').trim());
  GL.isObj = (o) => !!o && typeof o === 'object' && !Array.isArray(o);
  GL.str = (v, n) => String(v == null ? '' : v).slice(0, n);
  GL.clip = (s, n) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);
  GL.sum = (arr, f) => arr.reduce((t, x) => t + (f ? f(x) : x), 0);
  GL.round2 = (n) => Math.round((+n || 0) * 100) / 100;

  GL.shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  GL.fmt = (n) => new Intl.NumberFormat('he-IL').format(n);
  GL.plural = (n, one, many) => (n === 1 ? one : GL.fmt(n) + ' ' + many);
})();
