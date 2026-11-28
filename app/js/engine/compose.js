/* Drawing a wallpaper in the app: the picture cropped to the screen and the sentence in the chosen design.
   Same rules as the engine on the phone (android-native/Composer.java), so the preview matches the real thing.
   Used for the previews and for "share as a picture". */
(function () {
  'use strict';
  const GL = window.GL;
  const SIZE = { s: 0.050, m: 0.062, l: 0.076, xl: 0.092 };
  const POS = { top: 0.30, middle: 0.50, bottom: 0.70 };
  const cache = {};

  GL.loadImg = (src) => {
    if (!src) return Promise.resolve(null);
    if (cache[src]) return cache[src];
    cache[src] = new Promise((resolve) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = () => { delete cache[src]; resolve(null); };
      im.src = src;
    });
    return cache[src];
  };

  const family = (font) => (font === 'serif' ? '"Times New Roman", "Noto Serif Hebrew", serif' : font === 'sans' ? 'Arial, "Noto Sans Hebrew", sans-serif' : 'Rubik, sans-serif');

  function wrap(x, text, max) {
    const words = text.split(/\s+/), lines = [];
    let line = '';
    words.forEach((w) => {
      const t = line ? line + ' ' + w : w;
      if (x.measureText(t).width <= max || !line) line = t; else { lines.push(line); line = w; }
    });
    if (line) lines.push(line);
    return lines;
  }

  function roundRect(x, l, t, w, h, r) {
    x.beginPath();
    x.moveTo(l + r, t); x.lineTo(l + w - r, t); x.quadraticCurveTo(l + w, t, l + w, t + r);
    x.lineTo(l + w, t + h - r); x.quadraticCurveTo(l + w, t + h, l + w - r, t + h);
    x.lineTo(l + r, t + h); x.quadraticCurveTo(l, t + h, l, t + h - r);
    x.lineTo(l, t + r); x.quadraticCurveTo(l, t, l + r, t);
    x.closePath();
  }

  // Draws on a canvas of size w × h (CSS pixels × dpr handled by the caller).
  GL.drawWallpaper = async (canvas, imgSrc, quote, style, w, h) => {
    style = style || GL.state.style;
    canvas.width = w; canvas.height = h;
    const x = canvas.getContext('2d');
    const im = await GL.loadImg(imgSrc);
    if (im && im.naturalWidth) {
      const s = Math.max(w / im.naturalWidth, h / im.naturalHeight);
      const cw = w / s, ch = h / s;
      x.drawImage(im, (im.naturalWidth - cw) / 2, (im.naturalHeight - ch) / 2, cw, ch, 0, 0, w, h);
    } else {
      const g = x.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#3D1B63'); g.addColorStop(1, '#D94FA8');
      x.fillStyle = g; x.fillRect(0, 0, w, h);
    }
    const text = String(quote || '').trim();
    if (!text) return canvas;
    if (style.font === 'rubik' && document.fonts && document.fonts.load) { try { await document.fonts.load((style.bold ? '700 ' : '400 ') + '40px Rubik'); } catch (e) { /* fallback font */ } }
    const size = w * (SIZE[style.size] || SIZE.m);
    x.font = (style.bold ? '700 ' : '400 ') + size + 'px ' + family(style.font);
    x.direction = 'rtl';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    const lines = wrap(x, text, w * 0.8);
    const lh = size * 1.18 * 1.2;
    const total = lh * lines.length;
    const cy = h * (POS[style.pos] || 0.5);
    const top = cy - total / 2;
    if (style.band !== 'none') {
      const maxW = Math.max.apply(null, lines.map((l) => x.measureText(l).width));
      const padX = size * 0.9, padY = size * 0.65;
      x.fillStyle = style.band === 'light' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.45)';
      roundRect(x, w / 2 - maxW / 2 - padX, top - padY, maxW + padX * 2, total + padY * 2, size * 0.8);
      x.fill();
    } else if (style.shadow) {
      x.shadowColor = 'rgba(0,0,0,0.67)'; x.shadowBlur = size * 0.36; x.shadowOffsetY = size * 0.05;
    }
    x.fillStyle = style.color || '#FFFFFF';
    lines.forEach((l, i) => x.fillText(l, w / 2, top + lh * i + lh / 2));
    x.shadowColor = 'transparent';
    return canvas;
  };

  // The current wallpaper of a rotation (or any picture + sentence) into a canvas element on screen.
  GL.paintPreview = (el, imgId, quoteId, opts) => {
    if (!el) return;
    opts = opts || {};
    const img = imgId ? GL.imageById(imgId) : null;
    const q = quoteId ? GL.quoteById(quoteId) : null;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cssW = el.clientWidth || 180;
    const ratio = (GL.live.h || 2160) / (GL.live.w || 1080);
    GL.drawWallpaper(el, img ? img.full : '', opts.noQuote ? '' : q ? q.t : opts.text || '', opts.style, Math.round(cssW * dpr), Math.round(cssW * ratio * dpr));
  };

  // A finished picture (for sharing): 1080 wide, the phone's shape.
  GL.renderJpeg = async (imgId, text) => {
    const c = document.createElement('canvas');
    const img = imgId ? GL.imageById(imgId) : null;
    await GL.drawWallpaper(c, img ? img.full : '', text, GL.state.style, 1080, Math.round(1080 * ((GL.live.h || 2160) / (GL.live.w || 1080))));
    return c.toDataURL('image/jpeg', 0.9).replace(/^data:[^,]*,/, '');
  };
})();
