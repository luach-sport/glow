/* One picture: big preview with the sentence, put it now, favourite, in or out of the rotation,
   which times of day it suits, and delete (your own pictures). */
(function () {
  'use strict';
  const GL = window.GL;
  const { esc, icon } = GL;
  const V = GL.views;

  GL.SHEETS.image = {
    full: true,
    title: (d) => { const i = GL.imageById(d.id); return i ? i.name : 'תמונה'; },
    render: (d) => {
      const i = GL.imageById(d.id);
      if (!i) return '<p class="fine">התמונה כבר לא קיימת.</p>';
      let h = '<div class="style-preview">' + V.phone(i.id, '', false, false, '', 'big') + '</div>';
      h += '<div class="btn-row"><button type="button" class="btn" data-action="image-now" data-id="' + esc(i.id) + '">' + icon('check') + 'לשים עכשיו</button>' +
        '<button type="button" class="btn secondary' + (i.fav ? ' on' : '') + '" data-action="fav-image" data-id="' + esc(i.id) + '" aria-pressed="' + i.fav + '">' + icon(i.fav ? 'heartFill' : 'heart') + (i.fav ? 'במועדפים' : 'למועדפים') + '</button></div>';
      if (!GL.wallsOn()) h += '<p class="fine" style="text-align:center">"לשים עכשיו" ידליק את הרקעים של Glow במסך הבית.</p>';
      if (GL.activeKeys().length > 1) {
        h += '<div class="btn-row"><button type="button" class="btn small secondary" data-action="image-now" data-key="lock" data-id="' + esc(i.id) + '">' + icon('lock', 'sm') + 'רק בנעילה</button>' +
          '<button type="button" class="btn small secondary" data-action="image-now" data-key="home" data-id="' + esc(i.id) + '">' + icon('home', 'sm') + 'רק בבית</button></div>';
      }
      h += '<div class="card list">' + V.sw('toggle-image-off', i.id, 'בסבב ההחלפות', i.off ? 'התמונה לא תופיע עד שתחזיר אותה' : 'התמונה יכולה להופיע כרקע', !i.off, 'repeat') + '</div>';
      h += '<div class="field"><span class="label">מתאימה ל… (בהחלפה לפי שעות היום)</span><div class="chips">' +
        GL.PARTS.map((p) => '<button type="button" class="chip accent" data-action="image-part" data-id="' + esc(i.id) + '" data-v="' + p.v + '" aria-pressed="' + (i.parts || []).includes(p.v) + '">' + p.l + '</button>').join('') + '</div>' +
        '<span class="hint">' + ((i.parts || []).length ? '' : 'בלי סימון: מתאימה לכל שעה.') + '</span></div>';
      h += '<button type="button" class="btn secondary" data-action="share-image" data-id="' + esc(i.id) + '">' + icon('share') + 'שיתוף עם המשפט</button>';
      if (i.kind === 'mine') h += '<button type="button" class="btn danger" data-action="delete-image" data-id="' + esc(i.id) + '">' + icon('trash') + 'מחיקת התמונה</button>';
      else if (i.kind === 'pack') h += '<p class="fine">מהחבילה "' + esc(i.packName) + '".</p>';
      return h;
    }
  };
})();
