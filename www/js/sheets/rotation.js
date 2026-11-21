/* "When to change" for one rotation: which screens, when a new picture comes, from which album,
   the sentence (on/off, when, from which set, on which screen). Changes are saved and sent to the engine at once. */
(function () {
  'use strict';
  const GL = window.GL;
  const { esc, icon } = GL;
  const V = GL.views;

  const modes = (what, cur, key) => '<div class="mode-grid">' + GL.MODES.map((m) => '<button type="button" class="mode' + (m.v === cur ? ' on' : '') + '" data-action="rot-mode" data-what="' + what + '" data-key="' + key + '" data-v="' + m.v + '" aria-pressed="' + (m.v === cur) + '">' + icon(m.icon) + '<span>' + m.l + '</span></button>').join('') + '</div>';
  const every = (what, cur, key) => '<div class="chips scroll">' + GL.EVERY.map((m) => V.chip('rot-every', m, 'כל ' + GL.everyLabel(m), m === cur, null, ' data-what="' + what + '" data-key="' + key + '"')).join('') + '</div>';
  const hint = (m) => ({
    interval: 'מתחלף לבד לפי הזמן שבחרת, גם כשהאפליקציה סגורה.',
    screen: 'מתחלף בכל פעם שהמסך נכבה, כך שבכל הדלקה מחכה רקע חדש. צריך הודעה שקטה קטנה בשורת ההתראות.',
    parts: 'מתחלף בתחילת כל חלק ביום, ובוחר תמונות שמתאימות לבוקר, לצהריים, לערב או ללילה.',
    manual: 'מתחלף רק כשלוחצים "רקע חדש" באפליקציה או בווידג\'ט.'
  })[m];

  GL.SHEETS.rotation = {
    full: true,
    title: (d) => V.keyName(d.key),
    render: (d) => {
      const k = d.key, r = GL.rot(k), canLock = GL.live.canLock !== false;
      let h = '';
      if (k === 'both') {
        h += '<div class="field"><span class="label">על איזה מסך</span><div class="seg" role="group" aria-label="על איזה מסך">' +
          '<button type="button" data-action="rot-target" data-v="home" aria-pressed="' + r.targets.home + '">' + icon('home', 'sm') + 'מסך הבית</button>' +
          (canLock ? '<button type="button" data-action="rot-target" data-v="lock" aria-pressed="' + r.targets.lock + '">' + icon('lock', 'sm') + 'מסך הנעילה</button>' : '') + '</div></div>';
      }
      h += '<div class="card pad stack"><div class="sec-title">' + icon('image') + '<b>תמונה</b></div>' +
        '<div class="field"><span class="label">מתי מחליפים תמונה</span>' + modes('img', r.img.mode, k) + '<span class="hint">' + hint(r.img.mode) + '</span></div>' +
        (r.img.mode === 'interval' ? '<div class="field"><span class="label">כל כמה זמן</span>' + every('img', r.img.every, k) + '</div>' : '') +
        '<div class="field"><span class="label">מאיזה תמונות</span><div class="chips scroll">' + GL.albums().filter((a) => a.n > 0 || a.v === r.album).map((a) => V.chip('rot-album', a.v, a.l, a.v === r.album, a.n, ' data-key="' + k + '"')).join('') + '</div></div></div>';
      h += '<div class="card pad stack"><div class="sec-title">' + icon('quote') + '<b>משפט</b>' +
        '<button type="button" class="switch-hit" role="switch" aria-checked="' + r.quote.on + '" data-action="rot-quote-on" data-key="' + k + '" aria-label="להציג משפט"><span class="switch"></span></button></div>';
      if (r.quote.on) {
        h += '<div class="field"><span class="label">מתי מחליפים משפט</span>' + modes('quote', r.quote.mode, k) + '<span class="hint">' + hint(r.quote.mode) + '</span></div>' +
          (r.quote.mode === 'interval' ? '<div class="field"><span class="label">כל כמה זמן</span>' + every('quote', r.quote.every, k) + '</div>' : '') +
          '<div class="field"><span class="label">מאיזה משפטים</span><div class="chips scroll">' + GL.quoteSets().filter((s) => s.n > 0 || s.v === r.quoteSet).map((s) => V.chip('rot-set', s.v, s.l, s.v === r.quoteSet, s.n, ' data-key="' + k + '"')).join('') + '</div></div>';
        if (k === 'both' && r.targets.home && r.targets.lock) {
          h += '<div class="field"><span class="label">איפה להציג את המשפט</span>' + V.seg('rot-where', [{ v: 'both', l: 'בשניהם' }, { v: 'lock', l: 'רק בנעילה' }, { v: 'home', l: 'רק בבית' }], r.quoteWhere, 'איפה להציג') +
            '<span class="hint">במסך הבית האייקונים עלולים להסתיר את המשפט. במסך הנעילה הוא בולט יותר.</span></div>';
        }
      } else h += '<p class="fine">רק תמונה, בלי משפט.</p>';
      h += '</div>';
      h += '<button type="button" class="btn" data-action="change-now" data-what="all" data-key="' + k + '">' + icon('refresh') + 'להחליף עכשיו</button>';
      return h;
    }
  };
})();
