/* Pictures: everything Glow can show, by album; add your own from the phone; tap one for its options. */
(function () {
  'use strict';
  const GL = window.GL;
  const { esc, icon } = GL;
  const V = GL.views;

  V.images = () => {
    const f = GL.ui.imgFilter;
    const albums = GL.albums().filter((a) => a.v === 'all' || a.v === f || a.n > 0 || a.v === 'mine');
    const all = GL.allImages();
    const list = all.filter((i) => (f === 'off' ? i.off : GL.inAlbum(i, f)));
    const offN = all.filter((i) => i.off).length;
    let h = '<header class="top"><h1 class="h1">תמונות</h1><span class="count">' + all.filter((i) => !i.off).length + ' בסבב</span></header>';
    if (!GL.wallsOn()) h += '<div class="banner gray"><span class="ic">' + icon('image') + '</span><span class="txt"><span class="t">הרקעים של Glow כבויים</span><span class="s">התמונות כאן נכנסות לפעולה כשמדליקים אותם</span></span><button type="button" class="go" data-action="open-sheet" data-sheet="walls">להדליק</button></div>';
    h += '<button type="button" class="dashed-btn" data-action="add-images">' + icon('plus') + 'הוספת תמונות מהטלפון</button>';
    h += '<div class="chips scroll">' + albums.map((a) => V.chip('img-filter', a.v, a.l, f === a.v, a.v === 'all' ? null : a.n)).join('') +
      (offN ? V.chip('img-filter', 'off', 'מחוץ לסבב', f === 'off', offN) : '') + '</div>';
    if (!list.length) {
      h += '<div class="empty"><span class="tile big">' + icon(f === 'fav' ? 'heart' : 'image') + '</span><b>' + (f === 'fav' ? 'עוד אין תמונות מועדפות' : f === 'mine' ? 'עוד לא הוספת תמונות' : 'אין כאן תמונות') + '</b>' +
        '<span>' + (f === 'fav' ? 'לחיצה על תמונה ואז על הלב מוסיפה אותה לכאן.' : f === 'mine' ? 'אפשר לבחור כמה תמונות בבת אחת מהגלריה.' : '') + '</span></div>';
      return h;
    }
    h += '<div class="gallery">' + list.map((i) => '<button type="button" class="g-item' + (i.off ? ' off' : '') + '" data-action="open-image" data-id="' + esc(i.id) + '" aria-label="' + esc(i.name) + '">' +
      '<img src="' + esc(i.thumb) + '" alt="" loading="lazy">' + (i.fav ? '<span class="g-fav">' + icon('heartFill', 'xs') + '</span>' : '') + (i.off ? '<span class="g-off">' + icon('eyeOff', 'xs') + '</span>' : '') + '</button>').join('') + '</div>';
    h += '<p class="fine" style="text-align:center">התמונות של Glow מצוירות במיוחד: נופים וצבעים, בלי אנשים. עוד תמונות בחנות.</p>';
    return h;
  };
})();
