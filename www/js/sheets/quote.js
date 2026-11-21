/* One sentence: put it now, favourite, in or out of the rotation, share as a picture; edit or delete your own.
   Also the "new sentence" form. */
(function () {
  'use strict';
  const GL = window.GL;
  const { esc, icon } = GL;
  const V = GL.views;
  const ui = GL.ui;

  GL.SHEETS.quote = {
    full: true,
    title: (d) => (d.isNew ? 'משפט חדש' : 'משפט'),
    init: (d) => { const q = d.id ? GL.quoteById(d.id) : null; ui.form = { t: q ? q.t : '', err: '' }; },
    render: (d) => {
      const q = d.id ? GL.quoteById(d.id) : null;
      const bg = V.wallOn('lock') || V.wallOn('home') || (GL.rotImages(GL.rot('both'))[0] || {}).id;
      if (d.isNew || (q && q.mine && d.edit)) {
        return '<div class="field"><label for="qt">המשפט</label><textarea id="qt" class="input big-text" data-f="t" maxlength="300" autofocus placeholder="למשל: היום אני עושה צעד אחד קדימה">' + esc(ui.form.t) + '</textarea>' +
          (ui.form.err ? '<span class="hint bad">' + esc(ui.form.err) + '</span>' : '<span class="hint">קצר ובולט עובד הכי טוב על רקע. עד 300 תווים.</span>') + '</div>' +
          '<button type="button" class="btn" data-action="save-quote" data-id="' + esc(d.id || '') + '">' + icon('check') + 'שמירה</button>';
      }
      if (!q) return '<p class="fine">המשפט כבר לא קיים.</p>';
      let h = '<div class="style-preview">' + V.phone(bg, q.id, true, false, '', 'big') + '</div>';
      h += '<div class="btn-row"><button type="button" class="btn" data-action="quote-now" data-id="' + esc(q.id) + '">' + icon('check') + 'לשים עכשיו</button>' +
        '<button type="button" class="btn secondary" data-action="fav-quote" data-id="' + esc(q.id) + '" aria-pressed="' + q.fav + '">' + icon(q.fav ? 'heartFill' : 'heart') + (q.fav ? 'במועדפים' : 'למועדפים') + '</button></div>';
      h += '<div class="card list">' + V.sw('toggle-quote-off', q.id, 'בסבב ההחלפות', q.off ? 'המשפט לא יופיע עד שתחזיר אותו' : 'המשפט יכול להופיע על הרקע', !q.off, 'repeat') + '</div>';
      h += '<div class="btn-row"><button type="button" class="btn secondary" data-action="share-quote" data-id="' + esc(q.id) + '">' + icon('share') + 'שיתוף כתמונה</button>' +
        '<button type="button" class="btn secondary" data-action="copy-quote" data-id="' + esc(q.id) + '">' + icon('copy') + 'העתקה</button></div>' +
        '<button type="button" class="btn ghost" data-action="q-top" data-id="' + esc(q.id) + '">' + icon('arrowUp') + 'ראשון בתור</button>';
      if (q.mine) {
        h += '<div class="btn-row"><button type="button" class="btn secondary" data-action="edit-quote" data-id="' + esc(q.id) + '">' + icon('edit') + 'עריכה</button>' +
          '<button type="button" class="btn danger" data-action="delete-quote" data-id="' + esc(q.id) + '">' + icon('trash') + 'מחיקה</button></div>';
      } else h += '<p class="fine">מתוך "' + esc(q.packName) + '".</p>';
      return h;
    }
  };
})();
