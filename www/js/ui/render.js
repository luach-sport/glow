/* Drawing the current screen: a tab (home, pictures, sentences, store, settings). */
(function () {
  'use strict';
  const GL = window.GL;
  const ui = GL.ui;

  const scrollKey = () => { const v = GL.view(); return v ? v.name + (v.id || '') : 'tab-' + ui.tab; };

  function screenHtml() {
    const V = GL.views;
    if (ui.tab === 'images') return V.images();
    if (ui.tab === 'quotes') return V.quotes();
    if (ui.tab === 'store') return V.store();
    if (ui.tab === 'settings') return V.settings();
    return V.home();
  }

  // Canvases marked data-pv="imageId|quoteId" get the wallpaper drawn into them after each render.
  GL.paintAll = (root) => {
    (root || document).querySelectorAll('canvas[data-pv]').forEach((c) => {
      const [img, quote, noq] = c.dataset.pv.split('|');
      GL.paintPreview(c, img, quote, { noQuote: noq === '0', text: c.dataset.text || '' });
    });
  };

  // keepScroll: true = stay where you are, 'restore' = back to where this screen was left, else top.
  GL.render = (keepScroll) => {
    const main = GL.$('#screen');
    const v = GL.view();
    const prevKey = main.dataset.key;
    if (prevKey) ui.scroll[prevKey] = window.scrollY;
    document.body.classList.toggle('no-tabs', !!v);
    main.classList.toggle('pushed', !!v);
    main.innerHTML = screenHtml();
    const key = scrollKey();
    main.dataset.key = key;
    document.querySelectorAll('#tabs button[data-tab]').forEach((b) => {
      if (b.getAttribute('data-tab') === ui.tab) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    if (keepScroll === true && prevKey === key) window.scrollTo(0, ui.scroll[key] || 0);
    else if (keepScroll === 'restore') window.scrollTo(0, ui.scroll[key] || 0);
    else window.scrollTo(0, 0);
    GL.paintAll(main);
  };

  GL.rerenderAll = () => { if (ui.sheet) GL.renderSheet(); GL.render(true); };
  GL.pushView = (v) => { ui.scroll[scrollKey()] = window.scrollY; ui.stack.push(v); GL.render(); };
  GL.popView = () => { ui.stack.pop(); GL.render('restore'); };
  GL.part = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };
})();
