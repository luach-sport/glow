/* Glow's wallpapers: on which screens (or none – your own wallpaper stays), the same picture or a different one
   on each, when a new picture comes, and from which pictures. */
(function () {
  'use strict';
  const GL = window.GL;
  const { esc, icon } = GL;
  const V = GL.views;

  const modes = (cur, key) => '<div class="mode-grid">' + GL.MODES.map((m) => '<button type="button" class="mode' + (m.v === cur ? ' on' : '') + '" data-action="wall-mode" data-key="' + key + '" data-v="' + m.v + '" aria-pressed="' + (m.v === cur) + '">' + icon(m.icon) + '<span>' + m.l + '</span></button>').join('') + '</div>';
  const hint = (m) => ({
    interval: 'תמונה חדשה לפי הזמן שבחרת, גם כשהאפליקציה סגורה.',
    screen: 'תמונה חדשה בכל פעם שהמסך נכבה, כך שבכל הדלקה מחכה רקע חדש.',
    parts: 'בתחילת הבוקר, הצהריים, הערב והלילה – עם תמונות שמתאימות לכל שעה.',
    manual: 'רק כשלוחצים "רקע חדש".'
  })[m];

  function section(k) {
    const r = GL.rot(k);
    return '<div class="card pad stack soft"><div class="sec-title">' + icon(k === 'home' ? 'home' : k === 'lock' ? 'lock' : 'phone') + '<b>' + esc(V.keyName(k)) + '</b></div>' +
      '<div class="field"><span class="label">מתי מגיעה תמונה חדשה</span>' + modes(r.img.mode, k) + '<span class="hint">' + hint(r.img.mode) + '</span></div>' +
      (r.img.mode === 'interval' ? '<div class="field"><span class="label">כל כמה זמן</span><div class="chips scroll">' + GL.EVERY.map((m) => V.chip('wall-every', m, 'כל ' + GL.everyLabel(m), m === r.img.every, null, ' data-key="' + k + '"')).join('') + '</div></div>' : '') +
      '<div class="field"><span class="label">מאיזה תמונות</span><div class="chips scroll">' + GL.albums().filter((a) => a.n > 0 || a.v === r.album).map((a) => V.chip('wall-album', a.v, a.l, a.v === r.album, a.n, ' data-key="' + k + '"')).join('') + '</div></div></div>';
  }

  GL.SHEETS.walls = {
    full: true,
    title: () => 'רקעים מ-Glow',
    render: () => {
      const w = GL.state.walls, canLock = GL.live.canLock !== false;
      const tile = (s, ic, label) => '<button type="button" class="screen-tile' + (w[s] ? ' on' : '') + '" data-action="wall-screen" data-v="' + s + '" aria-pressed="' + w[s] + '">' + icon(ic) + '<b>' + label + '</b><span>' + (w[s] ? 'רקע של Glow' : 'הרקע שלך') + '</span></button>';
      let h = '<p class="fine" style="font-size:14px">על איזה מסך Glow יחליף את הרקע? מסך שלא בוחרים נשאר עם הרקע שלך, ו-Glow לא נוגע בו. המשפטים עובדים בכל מקרה.</p>';
      h += '<div class="grid2">' + tile('home', 'home', 'מסך הבית') + (canLock ? tile('lock', 'lock', 'מסך הנעילה') : '') + '</div>';
      if (!GL.wallsOn()) {
        h += '<div class="notice gray">' + icon('info', 'sm') + '<span class="grow">הרקעים של Glow כבויים. אם הרקע האחרון של Glow עוד על המסך, אפשר להחזיר רקע משלך.</span></div>' +
          '<button type="button" class="btn secondary" data-action="open-wall-picker">' + icon('image') + 'בחירת רקע משלי בטלפון</button>';
        return h;
      }
      if (w.home && w.lock && canLock) h += '<div class="field"><span class="label">בבית ובנעילה</span>' + V.seg('wall-same', [{ v: 'same', l: 'אותה תמונה' }, { v: 'separate', l: 'תמונה אחרת בכל אחד' }], GL.state.mode, 'אותה תמונה') + '</div>';
      GL.activeKeys().forEach((k) => { h += section(k); });
      h += '<button type="button" class="btn" data-action="change-now" data-what="image">' + icon('refresh') + 'רקע חדש עכשיו</button>';
      return h;
    }
  };
})();
