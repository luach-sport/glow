/* What was on the screens lately (newest first). Tap one to bring it back. */
(function () {
  'use strict';
  const GL = window.GL;
  const { esc, icon } = GL;
  const V = GL.views;

  GL.SHEETS.history = {
    full: true,
    title: () => 'מה הוצג לאחרונה',
    render: () => {
      const H = (GL.live.history || []).filter((h) => (h.img && GL.imageById(h.img)) || (!h.img && h.quote && GL.quoteById(h.quote)));
      if (!H.length) return '<div class="empty"><span class="tile big">' + icon('history') + '</span><b>עוד אין היסטוריה</b><span>כל משפט ורקע שיוצגו יופיעו כאן, ותוכל להחזיר אותם בלחיצה.</span></div>';
      const why = { time: 'לפי הזמן', screen: 'בהדלקת מסך', manual: 'בלחיצה', widget: 'מהווידג\'ט', settings: 'הגדרות', undo: 'חזרה', quote: 'משפט חדש' };
      return '<div class="card list">' + H.slice(0, 40).map((h, n) => {
        const img = h.img ? GL.imageById(h.img) : null, q = h.quote ? GL.quoteById(h.quote) : null;
        return '<button type="button" class="row hist" data-action="history-restore" data-n="' + n + '">' +
          (img ? '<img class="h-thumb" src="' + esc(img.thumb) + '" alt="">' : '<span class="h-thumb q">' + icon('quote', 'sm') + '</span>') +
          '<span class="grow"><span class="t">' + esc(q ? q.t : img ? 'רקע: ' + img.name : '') + '</span><span class="s">' + esc(GL.ago(h.ts)) + ' · ' + (img ? esc(V.keyName(h.key)) : 'משפט') + (why[h.why] ? ' · ' + why[h.why] : '') + '</span></span>' +
          '<span class="chev">' + icon('undo', 'sm') + '</span></button>';
      }).join('') + '</div><p class="fine" style="text-align:center">לחיצה על שורה מחזירה אותה למסך.</p>';
    }
  };
})();
