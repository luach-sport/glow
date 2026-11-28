/* The sentence's design, with a live preview: where on the screen, size, colour, font, bold, background band, shadow. */
(function () {
  'use strict';
  const GL = window.GL;
  const { icon } = GL;
  const V = GL.views;
  const COLORS = ['#FFFFFF', '#FFE7A3', '#FFC2E2', '#C9B2FF', '#A8E6FF', '#B8F5C8', '#1C1230', '#000000'];

  GL.SHEETS.style = {
    full: true,
    title: () => 'עיצוב המשפט על הרקע',
    render: () => {
      const s = GL.state.style, q = V.curQuote(), img = V.wallOn('lock') || (GL.rotImages(GL.rot('both'))[0] || {}).id;
      let h = '<p class="fine" style="font-size:14px">כך נראה המשפט כשהוא מודפס על רקע הנעילה של Glow, ובתמונות ששולחים בשיתוף.</p><div class="style-preview">' + V.phone(img, q ? q.id : '', true, true, '', 'big') + '</div>';
      h += '<div class="field"><span class="label">מיקום</span>' + V.seg('style-set', [{ v: 'top', l: 'למעלה' }, { v: 'middle', l: 'באמצע' }, { v: 'bottom', l: 'למטה' }], s.pos, 'מיקום', ' data-k="pos"') + '</div>';
      h += '<div class="field"><span class="label">גודל</span>' + V.seg('style-set', [{ v: 's', l: 'קטן' }, { v: 'm', l: 'רגיל' }, { v: 'l', l: 'גדול' }, { v: 'xl', l: 'ענק' }], s.size, 'גודל', ' data-k="size"') + '</div>';
      h += '<div class="field"><span class="label">צבע</span><div class="swatches">' + COLORS.map((c2) => '<button type="button" class="swatch" style="--c:' + c2 + '" data-action="style-set" data-k="color" data-v="' + c2 + '" aria-pressed="' + (s.color.toUpperCase() === c2) + '" aria-label="צבע ' + c2 + '"></button>').join('') + '</div></div>';
      h += '<div class="field"><span class="label">גופן</span>' + V.seg('style-set', [{ v: 'rubik', l: 'מודרני' }, { v: 'sans', l: 'פשוט' }, { v: 'serif', l: 'קלאסי' }], s.font, 'גופן', ' data-k="font"') + '</div>';
      h += '<div class="field"><span class="label">רקע מאחורי המשפט</span>' + V.seg('style-set', [{ v: 'dark', l: 'פס כהה' }, { v: 'light', l: 'פס בהיר' }, { v: 'none', l: 'בלי' }], s.band, 'רקע למשפט', ' data-k="band"') + '</div>';
      h += '<div class="card list">' + V.sw('style-toggle', 'bold', 'כתב מודגש', '', s.bold, 'type') + (s.band === 'none' ? V.sw('style-toggle', 'shadow', 'צל לכתב', 'עוזר לקרוא על תמונה בהירה', s.shadow, 'layers') : '') + '</div>';
      h += '<button type="button" class="btn" data-action="style-apply">' + icon('check') + 'לשים על הרקע עכשיו</button>';
      return h;
    }
  };
})();
