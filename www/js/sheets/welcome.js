/* First start: what Glow does, where to put the wallpaper and how often. One tap and it starts. */
(function () {
  'use strict';
  const GL = window.GL;
  const { icon } = GL;
  const ui = GL.ui;

  const WHERE = [{ v: 'both', l: 'בית ונעילה', i: 'phone' }, { v: 'lock', l: 'רק נעילה', i: 'lock' }, { v: 'home', l: 'רק בית', i: 'home' }];
  const WHEN = [
    { v: 'screen', l: 'בכל הדלקת מסך', s: 'רקע ומשפט חדשים בכל פעם שמסתכלים' },
    { v: 'hour', l: 'כל שעה', s: 'תמונה חדשה כל שעה, משפט חדש בכל הדלקה' },
    { v: 'parts', l: 'לפי שעות היום', s: 'זריחה בבוקר, שקיעה בערב, כוכבים בלילה' },
    { v: 'day', l: 'פעם ביום', s: 'רקע ומשפט חדשים כל בוקר' }
  ];

  GL.SHEETS.welcome = {
    full: true,
    noClose: () => !GL.state.onboarded,
    title: () => 'ברוכים הבאים ל-Glow',
    init: () => { ui.form = { where: GL.live.canLock === false ? 'home' : 'both', when: 'screen' }; },
    render: () => {
      const f = ui.form, canLock = GL.live.canLock !== false;
      return '<div class="about-head">' + GL.logo(76) + '<h2>Glow</h2><span class="slogan big">רקע חדש. כוח חדש.</span></div>' +
        '<p class="fine" style="font-size:15px;text-align:center">Glow מחליף לבד את הרקע של הטלפון, ושם עליו משפט של מוטיבציה וחיזוק. 50 תמונות מוכנות, ואפשר להוסיף משלך. עובד בלי אינטרנט.</p>' +
        '<div class="field"><span class="label">איפה לשים את הרקע</span><div class="seg" role="group" aria-label="איפה">' +
        WHERE.filter((w) => canLock || w.v === 'home').map((w) => '<button type="button" data-action="wel-where" data-v="' + w.v + '" aria-pressed="' + (f.where === w.v) + '">' + icon(w.i, 'sm') + w.l + '</button>').join('') + '</div></div>' +
        '<div class="field"><span class="label">מתי להחליף</span><div class="card list pick-list">' +
        WHEN.map((w) => '<button type="button" class="row" data-action="wel-when" data-v="' + w.v + '" aria-pressed="' + (f.when === w.v) + '"><span class="grow"><span class="t">' + w.l + '</span><span class="s">' + w.s + '</span></span>' + (f.when === w.v ? '<span class="check">' + icon('check') + '</span>' : '') + '</button>').join('') +
        '</div><span class="hint">הכל אפשר לשנות אחר כך: תמונות, משפטים, זמנים ועיצוב.</span></div>' +
        '<button type="button" class="btn" data-action="finish-welcome">' + icon('sparkle') + 'בואו נתחיל</button>';
    }
  };
})();
