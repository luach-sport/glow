/* Store: packs of sentences and pictures from Glow's site, free. Installed packs work without internet. */
(function () {
  'use strict';
  const GL = window.GL;
  const { esc, icon } = GL;
  const V = GL.views;
  const ST = () => GL.store;

  function card(p) {
    const inst = ST().installed(p.id), upd = ST().hasUpdate(p), busy = ST().busy === p.id;
    const kind = p.kind === 'quotes' ? 'משפטים' : 'תמונות';
    let btn;
    if (busy) btn = '<div class="pack-progress"><span>' + (p.kind === 'images' ? 'מוריד… ' + ST().progress + '%' : 'מוריד…') + '</span><div class="progress"><span style="width:' + Math.max(6, ST().progress) + '%"></span></div></div>';
    else if (upd) btn = '<button type="button" class="btn small" data-action="pack-install" data-id="' + esc(p.id) + '">' + icon('refresh', 'sm') + 'עדכון</button>';
    else if (inst) btn = '<button type="button" class="btn small secondary" data-action="pack-remove" data-id="' + esc(p.id) + '">' + icon('trash', 'sm') + 'הסרה</button>';
    else btn = '<button type="button" class="btn small" data-action="pack-install" data-id="' + esc(p.id) + '">' + icon('download', 'sm') + 'הורדה</button>';
    return '<div class="card pack">' +
      '<div class="pack-head"><span class="tile ' + (p.kind === 'quotes' ? 'violet' : 'pink') + '">' + icon(p.kind === 'quotes' ? 'quote' : 'image') + '</span>' +
      '<div class="grow"><b>' + esc(p.name) + '</b><span>' + esc((p.count || '') + ' ' + kind + (p.size ? ' · ' + p.size : '')) + (inst ? ' · <em>מותקן</em>' : '') + '</span></div></div>' +
      (p.desc ? '<p class="pack-desc">' + esc(p.desc) + '</p>' : '') +
      (p.sample ? '<p class="pack-sample">"' + esc(p.sample) + '"</p>' : '') +
      '<div class="pack-foot">' + btn + '</div></div>';
  }

  V.store = () => {
    const list = ST().list(), S = GL.state;
    let h = '<header class="top"><h1 class="h1">חנות</h1><button type="button" class="text-btn" data-action="store-refresh">' + (ST().busy === 'list' ? 'טוען…' : 'רענון') + '</button></header>';
    h += '<p class="fine" style="font-size:14px">חבילות של משפטים ותמונות, בחינם. מה שמורידים נשמר בטלפון ועובד גם בלי אינטרנט.</p>';
    h += '<div class="card list">' + V.sw('toggle-store-auto', 'auto', 'עדכון אוטומטי', 'כשיש אינטרנט, חבילות חדשות ועדכונים נכנסים לבד', S.store.autoUpdate, 'refresh') + '</div>';
    if (!list.length) {
      h += '<div class="empty"><span class="tile big">' + icon(GL.online() ? 'store' : 'offline') + '</span><b>' + (ST().busy === 'list' ? 'טוען את החנות…' : GL.online() ? 'החנות עוד לא נטענה' : 'אין חיבור לאינטרנט') + '</b>' +
        '<span>' + (GL.online() ? 'לחיצה על רענון טוענת את רשימת החבילות.' : 'כשהאינטרנט יחזור, אפשר לטעון את החבילות. כל מה שכבר הורדת עובד גם עכשיו.') + '</span>' +
        (GL.online() && ST().busy !== 'list' ? '<button type="button" class="btn small" data-action="store-refresh">' + icon('refresh', 'sm') + 'טעינת החנות</button>' : '') + '</div>';
    } else {
      const q = list.filter((p) => p.kind === 'quotes'), im = list.filter((p) => p.kind === 'images');
      if (q.length) h += '<span class="section-label">משפטים</span>' + q.map(card).join('');
      if (im.length) h += '<span class="section-label">תמונות</span>' + im.map(card).join('');
    }
    const mine = S.packs.filter((p) => !list.some((x) => x.id === p.id));
    if (mine.length) h += '<span class="section-label">מותקן אצלך</span>' + mine.map((p) => card({ id: p.id, name: p.name, kind: p.kind, version: p.version, count: p.items.length, desc: p.desc })).join('');
    if (S.store.lastCheck) h += '<p class="fine" style="text-align:center">נבדק ' + GL.ago(S.store.lastCheck) + '</p>';
    h += '<button type="button" class="btn ghost" data-action="open-sheet" data-sheet="feedback" data-type="idea">' + icon('message') + 'יש לך רעיון לחבילה? ספר לנו</button>';
    return h;
  };
})();
