/* Home: the wallpaper now (as a phone), change / back / heart / share, when things change, and tips. */
(function () {
  'use strict';
  const GL = window.GL;
  const { esc, icon } = GL;
  const V = GL.views;

  function previews() {
    const keys = GL.activeKeys();
    let h = '<div class="phones' + (keys.length > 1 ? ' two' : '') + '">';
    keys.forEach((k) => {
      const c = V.current(k), t = k === 'both' ? GL.rot('both').targets : null;
      const lock = k === 'lock' || (t && t.lock);
      const screen = k === 'both' ? (t.lock ? 'lock' : 'home') : k;
      h += V.phone(c.img, c.quote, V.quoteOnScreen(k, screen), lock, V.keyName(k));
    });
    return h + '</div>';
  }

  function actions() {
    const k = GL.activeKeys()[0], c = V.current(k), q = c.quote ? GL.quoteById(c.quote) : null;
    const fav = q && q.fav;
    return '<div class="act-row">' +
      '<button type="button" class="act main" data-action="change-now" data-what="all">' + icon('refresh') + '<span>רקע חדש</span></button>' +
      '<button type="button" class="act" data-action="change-now" data-what="quote"' + (GL.rot(k).quote.on ? '' : ' aria-disabled="true"') + '>' + icon('quote') + '<span>משפט חדש</span></button>' +
      '<button type="button" class="act" data-action="undo">' + icon('undo') + '<span>הקודם</span></button>' +
      '<button type="button" class="act' + (fav ? ' on' : '') + '" data-action="fav-current"' + (q ? '' : ' aria-disabled="true"') + ' aria-pressed="' + !!fav + '">' + icon(fav ? 'heartFill' : 'heart') + '<span>אהבתי</span></button>' +
      '<button type="button" class="act" data-action="share-current">' + icon('share') + '<span>שיתוף</span></button>' +
      '</div>';
  }

  function status() {
    const L = GL.live, bits = [];
    if (L.nextAt) bits.push('ההחלפה הבאה ' + GL.inMin(L.nextAt));
    if (GL.activeKeys().some((k) => GL.rot(k).img.mode === 'screen' || (GL.rot(k).quote.on && GL.rot(k).quote.mode === 'screen'))) bits.push('ובכל הדלקת מסך');
    return bits.length ? '<p class="next-line">' + icon('clock', 'xs') + esc(bits.join(' ')) + '</p>' : '';
  }

  function banners() {
    const L = GL.live, h = [];
    const screen = GL.activeKeys().some((k) => GL.rot(k).img.mode === 'screen' || (GL.rot(k).quote.on && GL.rot(k).quote.mode === 'screen'));
    if (GL.isNative() && screen && !L.batteryFree) {
      h.push('<div class="banner"><span class="ic">' + icon('bolt') + '</span><span class="txt"><span class="t">שההחלפה בכל הדלקה לא תיעצר</span><span class="s">אישור אחד: לא להגביל את Glow בחיסכון בסוללה</span></span><button type="button" class="go" data-action="open-battery">לאשר</button></div>');
    }
    if (GL.isNative() && screen && !L.notifications) {
      h.push('<div class="banner gray"><span class="ic">' + icon('bell') + '</span><span class="txt"><span class="t">הודעה שקטה של Glow</span><span class="s">מאפשרת החלפה בכל הדלקת מסך</span></span><button type="button" class="go" data-action="ask-notif">לאפשר</button></div>');
    }
    if (GL.state.ui.widgetTip && GL.isNative()) {
      h.push('<div class="banner gray"><span class="ic">' + icon('widget') + '</span><span class="txt"><span class="t">ווידג\'ט למסך הבית</span><span class="s">המשפט של עכשיו, ורקע חדש בלחיצה</span></span><button type="button" class="go" data-action="pin-widget">הוספה</button><button type="button" class="x" data-action="hide-widget-tip" aria-label="לא עכשיו">' + icon('close', 'sm') + '</button></div>');
    }
    if (GL.isNative() && GL.live.sdk < 24) h.push('<div class="notice gray">' + icon('info', 'sm') + '<span class="grow">בגרסת האנדרואיד של הטלפון הזה אפשר להחליף רק את מסך הבית.</span></div>');
    return h.join('');
  }

  V.home = () => {
    let h = '<header class="top"><div class="brand">' + GL.logo(38) + '<div><h1 class="h1">Glow</h1><span class="slogan">רקע חדש. כוח חדש.</span></div></div>' +
      '<button type="button" class="icon-btn boxed" data-action="open-sheet" data-sheet="history" aria-label="מה הוצג לאחרונה">' + icon('history') + '</button></header>';
    h += '<section class="stage">' + previews() + status() + actions() + '</section>';
    h += banners();
    h += '<span class="section-label">מתי מחליפים</span><div class="card list">';
    GL.activeKeys().forEach((k) => { h += V.navRow('open-rotation', k === 'home' ? 'home' : k === 'lock' ? 'lock' : 'phone', V.keyName(k), V.rotSummary(k), '', ' data-key="' + k + '"'); });
    h += V.navRow('open-sheet', 'palette', 'עיצוב המשפט', 'מיקום, גודל, צבע, גופן ופס רקע', '', ' data-sheet="style"');
    h += '</div>';
    h += '<div class="grid2">' +
      '<button type="button" class="src-tile" data-action="tab" data-tab="images"><span class="tile pink">' + icon('image') + '</span><span class="grow"><span class="t">תמונות</span><span class="s">' + GL.allImages().filter((i) => !i.off).length + ' בסבב</span></span></button>' +
      '<button type="button" class="src-tile" data-action="tab" data-tab="quotes"><span class="tile violet">' + icon('quote') + '</span><span class="grow"><span class="t">משפטים</span><span class="s">' + GL.allQuotes().filter((q) => !q.off).length + ' בסבב</span></span></button>' +
      '</div>';
    return h;
  };
})();
