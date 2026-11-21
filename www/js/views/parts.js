/* Rows and bits shared by the screens and sheets: switches, navigation rows, chips, the phone preview. */
(function () {
  'use strict';
  const GL = window.GL;
  const { esc, icon } = GL;
  const V = GL.views;

  V.sw = (action, key, label, sub, on, ic, extra) => '<div class="row">' + (ic ? '<span class="lead">' + icon(ic) + '</span>' : '') + '<span class="grow"><span class="t">' + esc(label) + '</span>' + (sub ? '<span class="s">' + esc(sub) + '</span>' : '') + '</span>' +
    '<button type="button" class="switch-hit" role="switch" aria-checked="' + !!on + '" data-action="' + action + '" data-k="' + esc(key) + '"' + (extra || '') + ' aria-label="' + esc(label) + '"><span class="switch"></span></button></div>';
  V.navRow = (action, ic, label, sub, value, extra) => '<button type="button" class="row" data-action="' + action + '"' + (extra || '') + '>' + (ic ? '<span class="lead accent">' + icon(ic) + '</span>' : '') + '<span class="grow"><span class="t">' + esc(label) + '</span>' + (sub ? '<span class="s">' + esc(sub) + '</span>' : '') + '</span>' + (value ? '<span class="v">' + esc(value) + '</span>' : '') + '<span class="chev">' + icon('chevL', 'sm') + '</span></button>';
  V.chip = (action, v, label, on, n, extra) => '<button type="button" class="chip accent" data-action="' + action + '" data-v="' + esc(v) + '" aria-pressed="' + !!on + '"' + (extra || '') + '>' + esc(label) + (n != null ? ' <span class="n">' + n + '</span>' : '') + '</button>';
  V.seg = (action, list, cur, label, extra) => '<div class="seg" role="group" aria-label="' + esc(label) + '">' + list.map((o) => '<button type="button" data-action="' + action + '" data-v="' + esc(o.v) + '"' + (extra || '') + ' aria-pressed="' + (String(o.v) === String(cur)) + '">' + (o.icon ? icon(o.icon, 'sm') : '') + esc(o.l) + '</button>').join('') + '</div>';

  // Names of the screens a rotation sets.
  V.keyName = (key) => {
    if (key === 'home') return 'מסך הבית';
    if (key === 'lock') return 'מסך הנעילה';
    const t = GL.rot('both').targets;
    return t.home && t.lock ? 'מסך הבית והנעילה' : t.lock ? 'מסך הנעילה' : 'מסך הבית';
  };
  // "every hour", "every screen-on", …
  V.whenText = (o) => (o.mode === 'interval' ? 'כל ' + GL.everyLabel(o.every) : o.mode === 'screen' ? 'בכל הדלקת מסך' : o.mode === 'parts' ? 'לפי שעות היום' : 'רק בלחיצה');
  V.rotSummary = (key) => {
    const r = GL.rot(key);
    return 'תמונה ' + V.whenText(r.img) + ' · ' + (r.quote.on ? 'משפט ' + V.whenText(r.quote) : 'בלי משפט');
  };

  // What is on a rotation now (from the engine), with a sensible fallback before the first change.
  V.current = (key) => {
    const r = GL.rot(key), st = GL.live.rotations[key] || {};
    let img = st.img && GL.imageById(st.img) ? st.img : '';
    let quote = st.quote && GL.quoteById(st.quote) ? st.quote : '';
    if (!img) { const l = GL.rotImages(r); img = l.length ? l[0].id : ''; }
    if (!quote && r.quote.on) { const l = GL.rotQuotes(r); quote = l.length ? l[0].id : ''; }
    return { img, quote: r.quote.on ? quote : '', at: Math.max(st.imgAt || 0, st.quoteAt || 0) };
  };
  // Does the sentence show on this screen of the rotation?
  V.quoteOnScreen = (key, screen) => {
    const r = GL.rot(key);
    if (!r.quote.on) return false;
    if (key !== 'both') return true;
    return r.quoteWhere === 'both' || r.quoteWhere === screen;
  };

  // A phone with the wallpaper drawn in it. lock = shows the clock like a lock screen.
  V.phone = (img, quote, showQuote, lock, label, cls) => '<figure class="phone' + (cls ? ' ' + cls : '') + '"><div class="screen"><canvas data-pv="' + esc(img) + '|' + esc(quote) + '|' + (showQuote ? '1' : '0') + '" aria-hidden="true"></canvas>' +
    (lock ? '<div class="lock-clock"><b>' + GL.time(Date.now()) + '</b><span>' + esc(GL.dateLong(Date.now())) + '</span></div>' : '') + '</div>' +
    (label ? '<figcaption>' + esc(label) + '</figcaption>' : '') + '</figure>';
})();
