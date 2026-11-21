/* Settings: one wallpaper for both screens or each its own, hours of the day, background running, widget,
   look, feedback, updates, sharing the app, and the credit. */
(function () {
  'use strict';
  const GL = window.GL;
  const { esc, icon } = GL;
  const V = GL.views;

  V.settings = () => {
    const S = GL.state, L = GL.live, p = S.parts;
    const themes = [{ v: 'light', l: 'בהיר' }, { v: 'dark', l: 'כהה' }, { v: 'system', l: 'לפי הטלפון' }];
    const hh = (n) => String(n).padStart(2, '0') + ':00';
    let h = '<header class="top"><h1 class="h1">הגדרות</h1></header>';
    h += '<span class="section-label">מסכים</span><div class="card pad stack">' +
      '<div class="field"><span class="label">מסך הבית ומסך הנעילה</span>' +
      V.seg('set-mode', [{ v: 'same', l: 'אותו רקע' }, { v: 'separate', l: 'כל אחד בנפרד' }], S.mode, 'מסכים') +
      '<span class="hint">' + (S.mode === 'same' ? 'רקע אחד לשני המסכים (או רק לאחד מהם), עם הגדרה אחת של מתי מחליפים.' : 'לכל מסך תמונות, משפטים וזמנים משלו.') + '</span></div></div>';
    h += '<div class="card list">' +
      GL.activeKeys().map((k) => V.navRow('open-rotation', k === 'home' ? 'home' : k === 'lock' ? 'lock' : 'phone', V.keyName(k), V.rotSummary(k), '', ' data-key="' + k + '"')).join('') +
      V.navRow('open-sheet', 'palette', 'עיצוב המשפט', 'מיקום, גודל, צבע וגופן', '', ' data-sheet="style"') +
      V.navRow('open-sheet', 'sun', 'שעות היום', 'מתי מתחילים בוקר, צהריים, ערב ולילה', 'בוקר ' + hh(p.morning) + ' · לילה ' + hh(p.night), ' data-sheet="parts"') +
      '</div>';
    if (GL.isNative()) {
      h += '<span class="section-label">עבודה ברקע</span><div class="card list">' +
        V.navRow('open-battery', 'bolt', 'בלי הגבלת סוללה', 'שההחלפות לא ייעצרו כשהטלפון חוסך סוללה', L.batteryFree ? 'מאושר' : 'לא מאושר') +
        (L.sdk >= 33 ? V.navRow('ask-notif', 'bell', 'הודעה שקטה', 'צריך רק להחלפה בכל הדלקת מסך', L.notifications ? 'מאושר' : 'לא מאושר') : '') +
        V.navRow('pin-widget', 'widget', 'ווידג\'ט למסך הבית', 'המשפט של עכשיו, רקע חדש, משפט חדש ולב') +
        '</div>' +
        '<p class="fine">ההחלפות קורות גם כשהאפליקציה סגורה. "כל הדלקת מסך" מחליף ברגע שהמסך נכבה, כדי שהרקע החדש כבר יחכה בהדלקה הבאה.</p>';
    }
    h += '<span class="section-label">תצוגה</span>' + V.seg('set-theme', themes, S.settings.theme, 'מראה');
    h += '<span class="section-label">כללי</span><div class="card list">' +
      V.navRow('open-sheet', 'message', 'פנייה / הצעת ייעול', 'מה להוסיף? מה לשפר? הפנייה מגיעה ישירות למפתח', '', ' data-sheet="feedback"') +
      V.updateRow() +
      V.navRow('share-app', 'share', 'שיתוף האפליקציה', 'קישור לאתר, או הקובץ עצמו בבלוטות\' ובוואטסאפ') +
      V.navRow('open-site', 'external', 'אתר האפליקציה', 'הסבר על כל המסכים, וחנות החבילות') +
      '</div>';
    h += '<div class="credit">' + GL.logo(44) + '<span class="n">Glow · גרסה ' + esc(GL.VERSION.version) + (GL.VERSION.build && GL.VERSION.build !== 'dev' ? ' (בנייה ' + esc(GL.VERSION.build) + ')' : '') + '</span>' +
      '<span class="slogan">רקע חדש. כוח חדש.</span><span class="by">פותח על ידי <b>Itzko</b></span><span class="by" dir="ltr">Developed by Itzko</span></div>';
    return h;
  };

  V.updateRow = () => {
    const U = GL.update;
    if (!GL.isNative()) return '';
    let v = '';
    if (U.state === 'checking') v = 'בודק…';
    else if (U.info) v = 'גרסה ' + U.info.version + ' זמינה';
    return V.navRow('check-update', 'download', 'בדיקת עדכונים', U.info ? 'יש גרסה חדשה – לחיצה לעדכון' : 'העדכונים נכנסים מתוך האפליקציה', v);
  };
})();
