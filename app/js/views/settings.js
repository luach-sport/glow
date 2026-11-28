/* Settings: the sentences, the widget, Glow's wallpapers, hours of the day, background running,
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
    const Q = S.quotes;
    h += '<span class="section-label">מה Glow עושה</span><div class="card list">' +
      V.navRow('open-sheet', 'quote', 'משפטים', Q.on ? V.whenText(Q) + ' · בבית בווידג\'ט · בנעילה ' + ({ notification: 'בהודעה', wallpaper: 'על הרקע', off: 'בלי' })[V.lockMode()] : 'כבוי', '', ' data-sheet="qset"') +
      V.navRow('open-sheet', 'widget', 'הווידג\'ט', 'מראה, צבע, יישור וכפתורים', GL.live.widgets ? 'במסך הבית' : '', ' data-sheet="widget"') +
      V.navRow('open-sheet', 'image', 'רקעים מ-Glow', GL.wallsOn() ? GL.activeKeys().map((k) => V.keyName(k) + ' ' + V.whenText(GL.rot(k).img)).join(' · ') : 'כבוי – הרקעים שלך', '', ' data-sheet="walls"') +
      V.navRow('open-sheet', 'palette', 'עיצוב המשפט על הרקע', 'כשהמשפט מודפס על רקע הנעילה, ובשיתוף כתמונה', '', ' data-sheet="style"') +
      V.navRow('open-sheet', 'sun', 'שעות היום', 'מתי מתחילים בוקר, צהריים, ערב ולילה', 'בוקר ' + hh(p.morning) + ' · לילה ' + hh(p.night), ' data-sheet="parts"') +
      '</div>';
    if (GL.isNative()) {
      h += '<span class="section-label">עבודה ברקע</span><div class="card list">' +
        V.navRow('open-battery', 'bolt', 'בלי הגבלת סוללה', 'שההחלפות לא ייעצרו כשהטלפון חוסך סוללה', L.batteryFree ? 'מאושר' : 'לא מאושר') +
        (L.sdk >= 33 ? V.navRow('ask-notif', 'bell', 'הודעות', 'למשפט במסך הנעילה ולהחלפה בכל הדלקה', L.notifications ? 'מאושר' : 'לא מאושר') : '') +
        '</div>' +
        '<p class="fine">ההחלפות קורות גם כשהאפליקציה סגורה. "כל הדלקת מסך" מחליף ברגע שהמסך נכבה, כדי שהחדש כבר יחכה בהדלקה הבאה. ההודעה השקטה צריכה רק להחלפה בכל הדלקה ולמשפט במסך הנעילה.</p>';
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
