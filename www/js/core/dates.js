/* Dates in Hebrew: "היום", "אתמול", "4 בספטמבר", months ("נובמבר 2026") and date inputs. */
(function () {
  'use strict';
  const GL = window.GL;

  const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
  const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  GL.MONTHS = MONTHS; GL.DAYS = DAYS;
  const p2 = (n) => String(n).padStart(2, '0');
  GL.dayStart = (d) => { d = new Date(d); d.setHours(0, 0, 0, 0); return d.getTime(); };
  GL.dateFull = (ts) => { const d = new Date(ts); return d.getDate() + '.' + (d.getMonth() + 1) + '.' + d.getFullYear(); };
  GL.dateInput = (ts) => { const d = new Date(ts); return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); };
  // "2026-11-19" → noon of that day (noon keeps the date right in every time zone).
  GL.fromInput = (s) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '')); return m ? new Date(+m[1], +m[2] - 1, +m[3], 12).getTime() : NaN; };
  GL.time = (ts) => { const d = new Date(ts); return p2(d.getHours()) + ':' + p2(d.getMinutes()); };
  GL.dayName = (i) => (i === 6 ? 'שבת' : 'יום ' + DAYS[i]);
  GL.dateLong = (ts) => { const d = new Date(ts); return GL.dayName(d.getDay()) + ', ' + d.getDate() + ' ב' + MONTHS[d.getMonth()]; };
  GL.dayLabel = (ts) => {
    const t = GL.dayStart(ts), today = GL.dayStart(Date.now());
    if (t === today) return 'היום';
    if (t === today - 864e5) return 'אתמול';
    const d = new Date(ts);
    return d.getDate() + ' ב' + MONTHS[d.getMonth()] + (d.getFullYear() !== new Date().getFullYear() ? ' ' + d.getFullYear() : '');
  };

  GL.ago = (ts) => {
    const m = Math.round((Date.now() - ts) / 60000);
    if (m < 1) return 'עכשיו';
    if (m < 60) return 'לפני ' + (m === 1 ? 'דקה' : m + ' דקות');
    const h = Math.round(m / 60);
    if (h < 24) return 'לפני ' + (h === 1 ? 'שעה' : h === 2 ? 'שעתיים' : h + ' שעות');
    return GL.dayLabel(ts) + ' ' + GL.time(ts);
  };
  GL.inMin = (ts) => {
    const m = Math.max(0, Math.round((ts - Date.now()) / 60000));
    if (m < 1) return 'עוד רגע';
    if (m < 60) return 'בעוד ' + (m === 1 ? 'דקה' : m + ' דקות');
    if (m < 24 * 60) return 'ב-' + GL.time(ts);
    return GL.dayLabel(ts) + ' ב-' + GL.time(ts);
  };
})();
