/* Home: the sentence now (big), what is on each screen in plain words, and three switches –
   the sentences, the widget, Glow's wallpapers. Everything Glow does is visible here. */
(function () {
  'use strict';
  const GL = window.GL;
  const { esc, icon } = GL;
  const V = GL.views;

  const hello = () => { const h = new Date().getHours(); return h < 5 ? 'לילה טוב' : h < 12 ? 'בוקר טוב' : h < 17 ? 'צהריים טובים' : h < 21 ? 'ערב טוב' : 'לילה טוב'; };

  function quoteHero() {
    const Q = GL.state.quotes, q = V.curQuote();
    if (!Q.on || !q) {
      return '<section class="q-hero off"><span class="q-label">' + icon('quote', 'sm') + 'המשפטים כבויים</span><p class="q-big">רקע חדש. כוח חדש.</p>' +
        '<div class="q-acts"><button type="button" class="pill-btn light" data-action="toggle-quotes">' + icon('sparkle', 'sm') + 'להדליק משפטים</button></div></section>';
    }
    return '<section class="q-hero"><span class="q-label">' + icon('sparkle', 'sm') + 'המשפט של עכשיו · ' + esc(V.whenText(Q)) + '</span>' +
      '<p class="q-big">' + esc(q.t) + '</p>' +
      '<div class="q-acts"><button type="button" class="pill-btn light" data-action="change-now" data-what="quote">' + icon('refresh', 'sm') + 'משפט הבא</button>' +
      '<button type="button" class="round-btn' + (q.fav ? ' on' : '') + '" data-action="fav-current" aria-pressed="' + q.fav + '" aria-label="אהבתי">' + icon(q.fav ? 'heartFill' : 'heart') + '</button>' +
      '<button type="button" class="round-btn" data-action="share-current" aria-label="שיתוף">' + icon('share') + '</button></div></section>';
  }

  function screens() {
    const lockOk = GL.live.canLock !== false;
    return '<section class="now"><h2 class="now-h">' + icon('phone', 'sm') + 'מה יש עכשיו בטלפון</h2><div class="phones two">' +
      V.screenPhone('home') + (lockOk ? V.screenPhone('lock') : '') + '</div>' +
      '<ul class="now-list"><li><b>מסך הבית:</b> ' + esc(V.wallText('home')) + ' · ' + esc(V.quoteText('home')) + '</li>' +
      (lockOk ? '<li><b>מסך הנעילה:</b> ' + esc(V.wallText('lock')) + ' · ' + esc(V.quoteText('lock')) + '</li>' : '') + '</ul></section>';
  }

  function quotesCard() {
    const Q = GL.state.quotes, n = GL.setQuotes().length;
    let h = '<section class="fcard pink"><div class="fc-head"><span class="bubble">' + icon('quote') + '</span><div class="grow"><b>משפטים</b><span>' +
      (Q.on ? esc(V.whenText(Q) + ' · ' + n + ' משפטים · ' + (Q.order === 'list' ? 'לפי הסדר שלך' : 'בסדר אקראי')) : 'כבוי') + '</span></div>' + V.bigSwitch('toggle-quotes', Q.on, 'משפטים') + '</div>';
    if (Q.on) {
      h += '<div class="fc-tags"><span class="tag">' + icon('home', 'xs') + 'בבית: ווידג\'ט</span><span class="tag">' + icon('lock', 'xs') + 'בנעילה: ' + ({ notification: 'הודעה', wallpaper: 'על הרקע', off: 'בלי' })[V.lockMode()] + '</span></div>' +
        '<div class="fc-acts"><button type="button" class="pill-btn" data-action="open-sheet" data-sheet="qset">' + icon('gear', 'sm') + 'מתי ואיזה משפטים</button>' +
        '<button type="button" class="pill-btn ghost" data-action="tab" data-tab="quotes">' + icon('list', 'sm') + 'הרשימה</button></div>';
    }
    return h + '</section>';
  }

  function widgetCard() {
    const n = GL.live.widgets || 0;
    return '<section class="fcard teal"><div class="fc-head"><span class="bubble">' + icon('widget') + '</span><div class="grow"><b>ווידג\'ט במסך הבית</b><span>' +
      (n ? 'נמצא במסך הבית ✓ – אפשר להגדיל ולהזיז אותו' : 'כך המשפט מופיע במסך הבית, מעל כל רקע') + '</span></div></div>' +
      '<div class="fc-acts">' + (n ? '' : '<button type="button" class="pill-btn" data-action="pin-widget">' + icon('plus', 'sm') + 'הוספה למסך הבית</button>') +
      '<button type="button" class="pill-btn ghost" data-action="open-sheet" data-sheet="widget">' + icon('palette', 'sm') + 'איך הוא נראה</button></div></section>';
  }

  function wallsCard() {
    const on = GL.wallsOn(), keys = GL.activeKeys();
    let h = '<section class="fcard violet"><div class="fc-head"><span class="bubble">' + icon('image') + '</span><div class="grow"><b>רקעים מ-Glow</b><span>' +
      (on ? esc(keys.map((k) => V.keyName(k) + ': ' + V.whenText(GL.rot(k).img)).join(' · ')) : 'כבוי – הרקעים שלך נשארים כמו שהם') + '</span></div>' + V.bigSwitch('toggle-walls', on, 'רקעים מ-Glow') + '</div>';
    if (on) {
      h += '<div class="fc-acts"><button type="button" class="pill-btn" data-action="change-now" data-what="image">' + icon('refresh', 'sm') + 'רקע חדש</button>' +
        '<button type="button" class="pill-btn ghost" data-action="undo">' + icon('undo', 'sm') + 'הקודם</button>' +
        '<button type="button" class="pill-btn ghost" data-action="open-sheet" data-sheet="walls">' + icon('gear', 'sm') + 'הגדרות</button></div>';
    }
    return h + '</section>';
  }

  function banners() {
    const L = GL.live, h = [];
    const service = (GL.state.quotes.on && (GL.state.quotes.mode === 'screen' || V.lockMode() === 'notification')) || GL.activeKeys().some((k) => GL.rot(k).img.mode === 'screen');
    if (GL.isNative() && service && !L.batteryFree) h.push('<div class="banner"><span class="ic">' + icon('bolt') + '</span><span class="txt"><span class="t">שהטלפון לא יעצור את Glow</span><span class="s">אישור אחד בחיסכון בסוללה</span></span><button type="button" class="go" data-action="open-battery">לאשר</button></div>');
    if (GL.isNative() && service && !L.notifications) h.push('<div class="banner gray"><span class="ic">' + icon('bell') + '</span><span class="txt"><span class="t">' + (V.lockMode() === 'notification' ? 'המשפט במסך הנעילה' : 'הודעה שקטה של Glow') + '</span><span class="s">צריך לאפשר הודעות</span></span><button type="button" class="go" data-action="ask-notif">לאפשר</button></div>');
    return h.join('');
  }

  V.home = () => {
    let h = '<header class="top"><div class="brand">' + GL.logo(38) + '<div><h1 class="h1">Glow</h1><span class="slogan">' + hello() + ' ✨</span></div></div>' +
      '<button type="button" class="icon-btn boxed" data-action="open-sheet" data-sheet="history" aria-label="מה הוצג לאחרונה">' + icon('history') + '</button></header>';
    h += quoteHero() + banners() + screens() + quotesCard() + widgetCard() + wallsCard();
    return h;
  };
})();
