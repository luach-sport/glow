/* Taps, typing and file choosers. Every button has data-action="name"; its function is GL.A[name] (js/actions/). */
(function () {
  'use strict';
  const GL = window.GL;
  const ui = GL.ui;

  function onClick(e) {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const fn = GL.A[el.dataset.action];
    if (!fn) return;
    e.preventDefault();
    if (el.getAttribute('aria-disabled') === 'true' || el.disabled) return;
    fn(el, e);
  }

  const search = GL.debounce((v) => GL.searchQuotes(v), 200);
  function onInput(e) {
    const el = e.target;
    if (el.id === 'q-search') { search(el.value); return; }
    if (el.dataset.f && ui.sheet) ui.form[el.dataset.f] = el.value;
  }

  function onChange(e) {
    const el = e.target;
    if (el.dataset.part) { GL.setPart(el.dataset.part, +el.value); return; }
    if (el.dataset.f && ui.sheet) ui.form[el.dataset.f] = el.value;
    if (el.id === 'image-file') GL.addImageFiles(el.files);
    if (el.id === 'quotes-file') { const f = el.files && el.files[0]; if (f) GL.importQuotesFile(f); }
  }

  function onKey(e) {
    if (e.key === 'Escape' && ui.sheet) { GL.closeSheet(); return; }
    if (e.key === 'Enter' && e.target && e.target.tagName === 'INPUT') { e.preventDefault(); e.target.blur(); }
  }

  GL.bindEvents = () => {
    document.addEventListener('click', onClick);
    document.addEventListener('input', onInput);
    document.addEventListener('change', onChange);
    document.addEventListener('keydown', onKey);
  };
})();
