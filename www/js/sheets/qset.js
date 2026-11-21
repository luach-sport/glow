/* The sentences: on/off, where they show (home-screen widget; lock screen as a notification, on Glow's wallpaper,
   or not at all), how often they change (even every few seconds), which ones, and in what order. */
(function () {
  'use strict';
  const GL = window.GL;
  const { icon } = GL;
  const V = GL.views;
  const hint = (m) => ({
    seconds: 'הווידג\'ט מחליף לבד, בלי לבזבז סוללה. במסך הנעילה מגיע משפט חדש בכל הדלקה.',
    interval: 'משפט חדש לפי הזמן שבחרת, בווידג\'ט ובמסך הנעילה.',
    screen: 'משפט חדש בכל פעם שהמסך נכבה – מחכה לך בהדלקה הבאה.',
    parts: 'משפט חדש בתחילת הבוקר, הצהריים, הערב והלילה.',
    manual: 'רק כשלוחצים "משפט הבא" (באפליקציה או בווידג\'ט).'
  })[m];

  GL.SHEETS.qset = {
    full: true,
    title: () => 'משפטים',
    render: () => {
      const Q = GL.state.quotes, lockWall = GL.activeKeys().some((k) => GL.targetsOf(k).includes('lock'));
      let h = '<div class="card list">' + V.sw('toggle-quotes', 'on', 'להציג משפטים', Q.on ? 'בווידג\'ט במסך הבית, ובמסך הנעילה כמו שתבחר' : 'כבוי', Q.on, 'quote') + '</div>';
      if (!Q.on) return h;
      h += '<div class="card pad stack soft"><div class="sec-title">' + icon('phone') + '<b>איפה רואים אותם</b></div>' +
        '<div class="where-row"><span class="where-k">' + icon('home', 'sm') + 'מסך הבית</span><span class="where-v">בווידג\'ט – מעל כל רקע, שלך או של Glow</span></div>' +
        '<button type="button" class="pill-btn" data-action="pin-widget">' + icon('plus', 'sm') + (GL.live.widgets ? 'עוד ווידג\'ט' : 'הוספת הווידג\'ט') + '</button>' +
        (GL.live.canLock !== false ? '<div class="field"><span class="label">' + icon('lock', 'xs') + ' מסך הנעילה</span>' +
          V.seg('q-lock', [{ v: 'notification', l: 'בהודעה' }].concat(lockWall ? [{ v: 'wallpaper', l: 'על הרקע' }] : []).concat([{ v: 'off', l: 'בלי' }]), V.lockMode(), 'מסך הנעילה') +
          '<span class="hint">' + ({ notification: 'הודעה שקטה (בלי צליל) שמראה את המשפט במסך הנעילה – עם כל רקע.', wallpaper: 'המשפט מודפס על הרקע של Glow במסך הנעילה. העיצוב ב"עיצוב המשפט על הרקע".', off: 'מסך הנעילה בלי משפט.' })[V.lockMode()] + '</span></div>' : '') +
        (V.lockMode() === 'wallpaper' ? '<button type="button" class="pill-btn ghost" data-action="open-sheet" data-sheet="style">' + icon('palette', 'sm') + 'עיצוב המשפט על הרקע</button>' : '') + '</div>';
      h += '<div class="card pad stack soft"><div class="sec-title">' + icon('clock') + '<b>מתי מתחלף</b></div>' +
        '<div class="mode-grid">' + GL.QMODES.map((m) => '<button type="button" class="mode' + (m.v === Q.mode ? ' on' : '') + '" data-action="q-mode" data-v="' + m.v + '" aria-pressed="' + (m.v === Q.mode) + '">' + icon(m.icon) + '<span>' + m.l + '</span></button>').join('') + '</div>' +
        '<span class="hint">' + hint(Q.mode) + '</span>' +
        (Q.mode === 'seconds' ? '<div class="chips scroll">' + GL.SECONDS.map((n) => V.chip('q-seconds', n, 'כל ' + n + ' שניות', n === Q.seconds)).join('') + '</div>' : '') +
        (Q.mode === 'interval' ? '<div class="chips scroll">' + GL.QEVERY.map((m) => V.chip('q-every', m, 'כל ' + GL.everyLabel(m), m === Q.every)).join('') + '</div>' : '') + '</div>';
      h += '<div class="card pad stack soft"><div class="sec-title">' + icon('list') + '<b>איזה משפטים ובאיזה סדר</b></div>' +
        '<div class="chips scroll">' + GL.quoteSets().filter((s) => s.n > 0 || s.v === Q.set).map((s) => V.chip('q-set', s.v, s.l, s.v === Q.set, s.n)).join('') + '</div>' +
        V.seg('q-order', [{ v: 'random', l: 'אקראי', icon: 'repeat' }, { v: 'list', l: 'לפי הסדר שלי', icon: 'list' }], Q.order, 'סדר') +
        '<button type="button" class="pill-btn ghost" data-action="arrange-quotes">' + icon('arrowDown', 'sm') + 'לסדר את המשפטים</button></div>';
      return h;
    }
  };
})();
