/* Sending feedback messages to the developer's Google Apps Script (shared with MyCar, which e-mails only the
   developer). Messages wait in an outbox and are sent when there's internet. */
(function () {
  'use strict';
  const GL = window.GL;
  let busy = false;
  const ERRORS = { 'rate-limit': 'יותר מדי פניות כרגע, ננסה שוב מאוחר יותר', invalid: 'חסר שם, מייל או תוכן', 'bad-key': 'השרת דחה את הפנייה', server: 'תקלה זמנית בשרת' };

  GL.feedbackBusy = () => busy;
  const refresh = () => { if (GL.sheetIs('feedback')) GL.renderSheet(); };

  function body(m) {
    return {
      key: GL.FEEDBACK_KEY, app: GL.FEEDBACK_APP, name: m.name, email: m.email, type: m.type, message: m.message,
      when: GL.dateFull(m.ts) + ' ' + GL.time(m.ts),
      version: 'Glow ' + GL.VERSION.version + ' (בנייה ' + GL.VERSION.build + ')',
      device: GL.isNative() ? 'אנדרואיד' : 'דפדפן'
    };
  }

  // Returns true to keep going with the next message, false to stop for now.
  async function sendOne(m) {
    m.tries = (m.tries || 0) + 1;
    try {
      const r = await GL.http(GL.FEEDBACK_URL, { method: 'POST', data: body(m), plain: true, timeout: 30000 });
      let d = r.data;
      if (typeof d === 'string') { try { d = JSON.parse(d); } catch (e) { d = {}; } }
      d = GL.isObj(d) ? d : {};
      if ((r.ok && d.ok === true) || r.status === 302 || r.status === 303) {
        m.status = 'sent'; m.sentAt = Date.now(); delete m.error; delete m.detail;
        return 'sent';
      }
      m.status = 'failed';
      m.error = ERRORS[d.error] || 'השרת לא קיבל אותה' + (r.status && !r.ok ? ' (' + r.status + ')' : '');
      m.detail = String(d.error || r.status || '').slice(0, 100);
      return d.error === 'rate-limit' ? 'stop' : 'next';
    } catch (e) {
      m.status = 'failed'; m.error = 'אין תשובה מהשרת'; m.detail = String(e && e.message || e).slice(0, 200);
      return 'stop';
    }
  }

  GL.flushOutbox = async () => {
    if (busy || !GL.online() || !GL.FEEDBACK_URL) return 0;
    const pending = GL.state.outbox.filter((m) => m.status !== 'sent');
    if (!pending.length) return 0;
    busy = true; refresh();
    let sent = 0;
    try {
      for (const m of pending) {
        const r = await sendOne(m);
        if (r === 'sent') sent++;
        if (r === 'stop') break;
      }
    } finally { busy = false; GL.save(); refresh(); }
    return sent;
  };

  GL.feedbackErrors = (f) => {
    const err = {};
    if (String(f.name || '').trim().length < 2) err.name = 'צריך לכתוב שם';
    if (!GL.isEmail(f.email)) err.email = 'צריך אימייל תקין';
    if (String(f.message || '').trim().length < 5) err.message = 'כתוב לפחות כמה מילים';
    return err;
  };

  // Opens the feedback form with the technical details of a failed picture / download, ready to send.
})();
