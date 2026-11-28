/* Rows and bits shared by the screens and sheets: switches, rows, chips, plain-language status,
   and the little phones that show what is on each screen right now. */
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
  V.bigSwitch = (action, on, label) => '<button type="button" class="switch-hit" role="switch" aria-checked="' + !!on + '" data-action="' + action + '" aria-label="' + esc(label) + '"><span class="switch"></span></button>';

  V.keyName = (key) => (key === 'home' ? 'מסך הבית' : key === 'lock' ? 'מסך הנעילה' : GL.targetsOf('both').length > 1 ? 'מסך הבית והנעילה' : GL.state.walls.lock ? 'מסך הנעילה' : 'מסך הבית');
  V.whenText = (o) => (o.mode === 'seconds' ? 'כל ' + o.seconds + ' שניות' : o.mode === 'interval' ? 'כל ' + GL.everyLabel(o.every) : o.mode === 'screen' ? 'בכל הדלקת מסך' : o.mode === 'parts' ? 'לפי שעות היום' : 'רק בלחיצה');

  // In plain words: what Glow does on each screen.
  V.wallText = (screen) => {
    const k = GL.activeKeys().find((x) => GL.targetsOf(x).includes(screen));
    return k ? 'רקע של Glow, ' + V.whenText(GL.rot(k).img) : 'הרקע שלך (Glow לא נוגע)';
  };
  V.quoteText = (screen) => {
    const Q = GL.state.quotes;
    if (!Q.on) return 'בלי משפט';
    if (screen === 'home') return GL.live.widgets ? 'משפט בווידג\'ט' : 'משפט בווידג\'ט (עוד לא נוסף)';
    const lock = V.lockMode();
    return lock === 'wallpaper' ? 'משפט על הרקע' : lock === 'notification' ? 'משפט בהודעה' : 'בלי משפט';
  };
  // Where the sentence goes on the lock screen, as the engine will really do it.
  V.lockMode = () => {
    const Q = GL.state.quotes;
    if (!Q.on) return 'off';
    if (Q.lock === 'wallpaper' && !GL.activeKeys().some((k) => GL.targetsOf(k).includes('lock'))) return 'notification';
    return Q.lock;
  };

  // Glow's picture on a screen now ('' = the user's own wallpaper).
  V.wallOn = (screen) => {
    const k = GL.activeKeys().find((x) => GL.targetsOf(x).includes(screen));
    if (!k) return '';
    const st = GL.live.rotations[k] || {};
    if (st.img && GL.imageById(st.img)) return st.img;
    const l = GL.rotImages(GL.rot(k));
    return l.length ? l[0].id : '';
  };
  V.curQuote = () => {
    if (!GL.state.quotes.on) return null;
    const id = GL.live.quote && GL.live.quote.id;
    return (id && GL.quoteById(id)) || GL.setQuotes()[0] || null;
  };

  // A phone with what is on that screen: Glow's picture or "your wallpaper", the clock, the widget, the notification.
  V.screenPhone = (screen, cls) => {
    const img = V.wallOn(screen), q = V.curQuote(), lock = screen === 'lock', lm = V.lockMode();
    const baked = lock && lm === 'wallpaper' && img && q;
    let h = '<figure class="phone' + (cls ? ' ' + cls : '') + '"><div class="screen' + (img ? '' : ' yours') + '">';
    h += img ? '<canvas data-pv="' + esc(img) + '|' + esc(baked ? q.id : '') + '|' + (baked ? '1' : '0') + '" aria-hidden="true"></canvas>' : '<span class="yours-l">' + icon('image', 'sm') + 'הרקע שלך</span>';
    if (lock) h += '<div class="lock-clock"><b>' + GL.time(Date.now()) + '</b><span>' + esc(GL.dateLong(Date.now())) + '</span></div>';
    if (lock && q && lm === 'notification') h += '<div class="mini-notif"><b>' + esc(q.t) + '</b><span>Glow ✨</span></div>';
    if (!lock && q) h += '<div class="mini-widget w-' + esc(GL.state.widget.look) + (GL.live.widgets ? '' : ' ghost') + '"><b>' + esc(q.t) + '</b></div>';
    if (!lock) h += '<div class="mini-apps" aria-hidden="true"><i></i><i></i><i></i><i></i></div>';
    return h + '</div><figcaption>' + (lock ? 'מסך הנעילה' : 'מסך הבית') + '</figcaption></figure>';
  };

  // A phone with any picture + sentence (previews in sheets).
  V.phone = (img, quote, showQuote, lock, label, cls) => '<figure class="phone' + (cls ? ' ' + cls : '') + '"><div class="screen"><canvas data-pv="' + esc(img) + '|' + esc(quote) + '|' + (showQuote ? '1' : '0') + '" aria-hidden="true"></canvas>' +
    (lock ? '<div class="lock-clock"><b>' + GL.time(Date.now()) + '</b><span>' + esc(GL.dateLong(Date.now())) + '</span></div>' : '') + '</div>' +
    (label ? '<figcaption>' + esc(label) + '</figcaption>' : '') + '</figure>';
})();
