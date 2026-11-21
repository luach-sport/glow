/* Sentence actions: filter and search, new / edit / delete your own, favourite, in/out of the rotation,
   put now, share as a picture, copy, and import / export as a file. */
(function () {
  'use strict';
  const GL = window.GL;
  const A = GL.A;
  const ui = GL.ui;

  A['q-filter'] = (el) => { ui.qFilter = el.dataset.v; GL.render(true); };
  A['clear-q'] = () => { ui.q = ''; GL.render(true); };
  GL.searchQuotes = (v) => {
    ui.q = v;
    GL.part('q-results', GL.views.quoteList());
    const w = document.querySelector('.input-wrap'); if (w) w.classList.toggle('has-q', !!v);
  };
  A['open-quote'] = (el) => GL.openSheet('quote', { id: el.dataset.id });
  A['new-quote'] = () => GL.openSheet('quote', { isNew: true });
  A['edit-quote'] = (el) => GL.openSheet('quote', { id: el.dataset.id, edit: true });
  A['save-quote'] = (el) => {
    const t = String(ui.form.t || '').replace(/\s+/g, ' ').trim();
    if (t.length < 2) { ui.form.err = 'כתוב משפט'; GL.renderSheet(); return; }
    const id = el.dataset.id;
    if (id) { const q = GL.state.myQuotes.find((x) => x.id === id); if (q) q.t = t; }
    else GL.state.myQuotes.push({ id: 'q' + GL.uid(), t, added: Date.now() });
    GL.save(); GL.closeSheet();
    GL.toast(id ? 'המשפט עודכן' : 'המשפט נוסף לסבב');
    if (!id) ui.qFilter = 'mine';
    GL.render(true);
  };
  A['delete-quote'] = (el) => {
    GL.state.myQuotes = GL.state.myQuotes.filter((x) => x.id !== el.dataset.id);
    delete GL.state.qMeta[el.dataset.id];
    GL.save(); GL.closeSheet(); GL.toast('המשפט נמחק'); GL.render(true);
  };
  A['fav-quote'] = (el) => {
    const q = GL.quoteById(el.dataset.id);
    GL.setQMeta(q.id, 'fav', !q.fav); GL.save(); GL.haptic();
    if (GL.ui.sheet) GL.renderSheet(); else if (ui.tab === 'quotes') GL.part('q-results', GL.views.quoteList()); else GL.render(true);
    if (GL.ui.sheet) GL.render(true);
  };
  A['toggle-quote-off'] = (el) => {
    const q = GL.quoteById(el.dataset.k);
    if (!q.off && GL.allQuotes().filter((x) => !x.off).length <= 1) { GL.toast('צריך לפחות משפט אחד בסבב'); return; }
    GL.setQMeta(q.id, 'off', !q.off); GL.save(); GL.rerenderAll();
  };
  A['quote-now'] = async (el) => {
    const id = el.dataset.id, q = GL.quoteById(id);
    if (q && q.off) GL.setQMeta(id, 'off', false);
    // The sentence may be outside the set a rotation uses: send it along so it can be shown now.
    GL.activeKeys().forEach((k) => { const r = GL.rot(k); if (!r.quote.on) r.quote.on = true; });
    GL.save();
    await GL.syncEngine(false, true);
    const r = await GL.engine('setNow', { quote: id, quoteEntry: { id, t: q.t, fav: !!q.fav } });
    GL.closeSheet();
    GL.toast(r && r.ok === false ? 'לא הצלחתי לשים את המשפט' : 'המשפט על הרקע', 4000);
    GL.render(true);
  };
  A['share-quote'] = async (el) => {
    const q = GL.quoteById(el.dataset.id), c = GL.views.current(GL.activeKeys()[0]);
    const b64 = await GL.renderJpeg(c.img, q.t);
    await GL.shareImage(b64, 'glow-' + Date.now() + '.jpg', q.t + '\n\nמתוך Glow: ' + GL.SITE_URL);
  };
  A['copy-quote'] = async (el) => { const q = GL.quoteById(el.dataset.id); if (await GL.writeClipboard(q.t)) GL.toast('המשפט הועתק'); };

  // Export: your own sentences and favourites, as a text file (one per line) anyone can import.
  A['export-quotes'] = () => {
    const mine = GL.state.myQuotes.map((q) => q.t);
    const favs = GL.allQuotes().filter((q) => q.fav && !q.mine).map((q) => q.t);
    const all = mine.concat(favs.filter((t) => !mine.includes(t)));
    if (!all.length) { GL.toast('אין עדיין משפטים שלך או מועדפים לייצא'); return; }
    GL.shareFile('glow-משפטים-' + GL.dateInput(Date.now()) + '.txt', all.join('\n') + '\n', 'text/plain', 'המשפטים שלי מ-Glow');
  };
  A['import-quotes'] = () => { const i = GL.$('#quotes-file'); i.value = ''; i.click(); };
  GL.importQuotesFile = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      let lines;
      try {
        const d = JSON.parse(text);
        lines = Array.isArray(d) ? d.map((x) => (typeof x === 'string' ? x : x && x.t)) : Array.isArray(d.items) ? d.items.map((x) => x && x.t) : [];
      } catch (e) { lines = text.split(/\r?\n/); }
      const have = new Set(GL.allQuotes().map((q) => q.t));
      let n = 0;
      lines.map((l) => String(l || '').replace(/^[\s\-•*\d.)]+/, '').replace(/\s+/g, ' ').trim()).filter((l) => l.length >= 2 && l.length <= 300).forEach((t) => {
        if (have.has(t)) return;
        have.add(t);
        GL.state.myQuotes.push({ id: 'q' + GL.uid(), t, added: Date.now() });
        n++;
      });
      GL.save();
      GL.toast(n ? 'נוספו ' + n + ' משפטים' : 'לא נמצאו משפטים חדשים בקובץ');
      if (n) { ui.qFilter = 'mine'; GL.render(true); }
    };
    reader.onerror = () => GL.toast('לא הצלחתי לקרוא את הקובץ');
    reader.readAsText(file);
  };
})();
