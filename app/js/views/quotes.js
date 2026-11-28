/* Sentences: all of them by set, search, add your own, import and export; tap one for its options. */
(function () {
  'use strict';
  const GL = window.GL;
  const { esc, icon } = GL;
  const V = GL.views;

  // Arrange mode: the sentences in use, in the order they come, with arrows.
  V.arrangeList = () => {
    const list = GL.setQuotes();
    return '<div class="card list q-list">' + list.slice(0, 300).map((x, i) => '<div class="row q-row arr">' +
      '<span class="q-num">' + (i + 1) + '</span><button type="button" class="q-main" data-action="open-quote" data-id="' + esc(x.id) + '"><span class="t">' + esc(x.t) + '</span></button>' +
      '<span class="arr-btns"><button type="button" class="icon-btn" data-action="q-move" data-d="-1" data-id="' + esc(x.id) + '" aria-label="למעלה"' + (i ? '' : ' aria-disabled="true"') + '>' + icon('arrowUp', 'sm') + '</button>' +
      '<button type="button" class="icon-btn" data-action="q-move" data-d="1" data-id="' + esc(x.id) + '" aria-label="למטה"' + (i < list.length - 1 ? '' : ' aria-disabled="true"') + '>' + icon('arrowDown', 'sm') + '</button></span></div>').join('') + '</div>';
  };

  V.quoteList = () => {
    if (GL.ui.arrange) return V.arrangeList();
    const f = GL.ui.qFilter, q = GL.ui.q.trim();
    let list = GL.allQuotes().filter((x) => (f === 'off' ? x.off : GL.inSet(x, f)));
    if (q) list = list.filter((x) => x.t.indexOf(q) >= 0);
    if (f === 'mine') list.sort((a, b) => (b.added || 0) - (a.added || 0));
    if (!list.length) {
      return '<div class="empty"><span class="tile big">' + icon(f === 'fav' ? 'heart' : 'quote') + '</span><b>' + (q ? 'לא נמצאו משפטים' : f === 'fav' ? 'עוד אין משפטים מועדפים' : f === 'mine' ? 'עוד לא כתבת משפטים' : 'אין כאן משפטים') + '</b>' +
        (f === 'mine' && !q ? '<span>משפט שכותבים כאן נכנס לסבב כמו כל השאר.</span><button type="button" class="btn small" data-action="new-quote">' + icon('plus') + 'משפט חדש</button>' : '') + '</div>';
    }
    const shown = list.slice(0, 300);
    return '<div class="card list q-list">' + shown.map((x) => '<div class="row q-row' + (x.off ? ' off' : '') + '">' +
      '<button type="button" class="q-main" data-action="open-quote" data-id="' + esc(x.id) + '"><span class="t">' + esc(x.t) + '</span><span class="s">' + esc(x.packName) + (x.off ? ' · מחוץ לסבב' : '') + '</span></button>' +
      '<button type="button" class="icon-btn heart' + (x.fav ? ' on' : '') + '" data-action="fav-quote" data-id="' + esc(x.id) + '" aria-pressed="' + x.fav + '" aria-label="מועדף">' + icon(x.fav ? 'heartFill' : 'heart') + '</button></div>').join('') + '</div>' +
      (list.length > shown.length ? '<p class="fine" style="text-align:center">מוצגים 300 מתוך ' + list.length + '. אפשר לחפש.</p>' : '');
  };

  V.quotes = () => {
    const f = GL.ui.qFilter;
    const sets = GL.quoteSets();
    const offN = GL.allQuotes().filter((x) => x.off).length;
    let h = '<header class="top"><h1 class="h1">משפטים</h1><button type="button" class="pill-btn' + (GL.ui.arrange ? '' : ' ghost') + '" data-action="toggle-arrange">' + icon(GL.ui.arrange ? 'check' : 'list', 'sm') + (GL.ui.arrange ? 'סיום סידור' : 'סידור') + '</button></header>';
    if (GL.ui.arrange) {
      return h + '<div class="notice accent">' + icon('info', 'sm') + '<span class="grow">כך המשפטים יופיעו, מלמעלה למטה' + (GL.state.quotes.order === 'list' ? '.' : '. הסדר נשמר גם כשהמשפטים מוצגים באקראי, ונכנס לפעולה כשבוחרים "לפי הסדר שלי".') + ' הקבוצה: ' + esc(GL.setName(GL.state.quotes.set)) + '.</span></div>' +
        '<div id="q-results">' + V.arrangeList() + '</div>';
    }
    h += '<div class="btn-row"><button type="button" class="btn small" data-action="new-quote">' + icon('plus') + 'משפט חדש</button>' +
      '<button type="button" class="btn small secondary" data-action="import-quotes">' + icon('download') + 'ייבוא</button>' +
      '<button type="button" class="btn small secondary" data-action="export-quotes">' + icon('upload') + 'ייצוא</button></div>';
    h += '<div class="input-wrap' + (GL.ui.q ? ' has-q' : '') + '"><span class="lead">' + icon('search', 'sm') + '</span><input class="input" type="search" id="q-search" placeholder="חיפוש משפט" value="' + esc(GL.ui.q) + '" aria-label="חיפוש משפט"><button type="button" class="clear" data-action="clear-q" aria-label="ניקוי">' + icon('close', 'sm') + '</button></div>';
    h += '<div class="chips scroll">' + sets.map((s) => V.chip('q-filter', s.v, s.l, f === s.v, s.v === 'all' ? null : s.n)).join('') +
      (offN ? V.chip('q-filter', 'off', 'מחוץ לסבב', f === 'off', offN) : '') + '</div>';
    h += '<div id="q-results">' + V.quoteList() + '</div>';
    return h;
  };
})();
