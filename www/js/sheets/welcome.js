/* First start, in three simple questions: Glow's wallpapers (or keep your own), the sentence on the lock screen,
   and how often a new sentence comes. Then the widget, so the sentence is on the home screen too. */
(function () {
  'use strict';
  const GL = window.GL;
  const { icon } = GL;
  const ui = GL.ui;

  const WALLS = [{ v: 'both', l: 'בבית ובנעילה', i: 'phone' }, { v: 'home', l: 'רק בבית', i: 'home' }, { v: 'lock', l: 'רק בנעילה', i: 'lock' }, { v: 'none', l: 'בלי – הרקע שלי', i: 'heart' }];
  const LOCK = [{ v: 'notification', l: 'בהודעה' }, { v: 'wallpaper', l: 'על הרקע' }, { v: 'off', l: 'בלי' }];
  const WHEN = [{ v: 's10', l: 'כל 10 שניות' }, { v: 'm1', l: 'כל דקה' }, { v: 'screen', l: 'בכל הדלקה' }, { v: 'h1', l: 'כל שעה' }];

  const opt = (action, o, on) => '<button type="button" class="opt' + (on ? ' on' : '') + '" data-action="' + action + '" data-v="' + o.v + '" aria-pressed="' + on + '">' + (o.i ? icon(o.i) : '') + '<span>' + o.l + '</span></button>';

  GL.SHEETS.welcome = {
    full: true,
    noClose: () => !GL.state.onboarded,
    title: () => 'ברוכים הבאים ל-Glow ✨',
    init: () => { ui.form = { walls: 'none', lock: 'notification', when: 's10' }; },
    render: () => {
      const f = ui.form, canLock = GL.live.canLock !== false;
      const lockWall = f.walls === 'both' || f.walls === 'lock';
      if (!lockWall && f.lock === 'wallpaper') f.lock = 'notification';
      return '<div class="about-head">' + GL.logo(76) + '<h2>Glow</h2><span class="slogan big">רקע חדש. כוח חדש.</span></div>' +
        '<p class="fine" style="font-size:15px;text-align:center">משפטים של מוטיבציה וחיזוק על המסך, ואם תרצה – גם רקעים מתחלפים. הכל בחירה שלך, והכל עובד בלי אינטרנט.</p>' +
        '<div class="q-step"><span class="n">1</span><b>רקעים של Glow?</b></div><div class="opt-grid">' + WALLS.filter((w) => canLock || w.v === 'home' || w.v === 'none').map((w) => opt('wel-walls', w, f.walls === w.v)).join('') + '</div>' +
        '<p class="fine">' + (f.walls === 'none' ? 'הרקעים שלך נשארים בדיוק כמו שהם.' : 'Glow יחליף את הרקע במסך שבחרת. אפשר לכבות בכל רגע.') + '</p>' +
        (canLock ? '<div class="q-step"><span class="n">2</span><b>משפט במסך הנעילה</b></div>' + '<div class="opt-row">' + LOCK.filter((o) => lockWall || o.v !== 'wallpaper').map((o) => opt('wel-lock', o, f.lock === o.v)).join('') + '</div>' : '') +
        '<div class="q-step"><span class="n">' + (canLock ? 3 : 2) + '</span><b>כל כמה משפט חדש</b></div><div class="opt-row four">' + WHEN.map((o) => opt('wel-when', o, f.when === o.v)).join('') + '</div>' +
        '<p class="fine">במסך הבית המשפט מופיע בווידג\'ט – נוסיף אותו מיד אחרי זה.</p>' +
        '<button type="button" class="btn" data-action="finish-welcome">' + icon('sparkle') + 'בואו נתחיל</button>';
    }
  };
})();
