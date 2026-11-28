/* When each part of the day starts (for "by time of day"). */
(function () {
  'use strict';
  const GL = window.GL;
  const { esc } = GL;

  GL.SHEETS.parts = {
    title: () => 'שעות היום',
    render: () => {
      const p = GL.state.parts;
      const opts = (cur) => Array.from({ length: 24 }, (_, i) => '<option value="' + i + '"' + (i === cur ? ' selected' : '') + '>' + String(i).padStart(2, '0') + ':00</option>').join('');
      return '<p class="fine" style="font-size:14px">ב"לפי שעות היום" הרקע מתחלף בתחילת כל חלק, ובוחר תמונות שמתאימות לו (זריחה בבוקר, כוכבים בלילה…).</p>' +
        '<div class="card pad stack">' + GL.PARTS.map((x) => '<div class="field row-field"><label for="pt-' + x.v + '">' + esc(x.l) + ' מתחיל ב-</label><select class="input" id="pt-' + x.v + '" data-part="' + x.v + '">' + opts(p[x.v]) + '</select></div>').join('') + '</div>' +
        '<button type="button" class="btn" data-action="close-sheet">סיום</button>';
    }
  };
})();
