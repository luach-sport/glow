/* Feedback form actions: type, send, try again. */
(function () {
  'use strict';
  const GL = window.GL;
  const A = GL.A;
  const ui = GL.ui;

  A['fb-type'] = (el) => { ui.form.type = el.dataset.v; GL.renderSheet(); };
  A['feedback-retry'] = async () => {
    if (!GL.online()) { GL.toast('אין חיבור כרגע'); return; }
    const n = await GL.flushOutbox();
    GL.toast(n ? 'נשלח. תודה!' : 'עדיין לא הצלחתי לשלוח. ננסה שוב לבד.');
  };
  A['send-feedback'] = async () => {
    if (GL.feedbackBusy()) return;
    const f = ui.form, err = GL.feedbackErrors(f);
    f.err = err;
    if (Object.keys(err).length) { GL.renderSheet(); return; }
    GL.state.profile = { name: f.name.trim(), email: f.email.trim() };
    GL.state.outbox.push({ id: GL.uid(), ts: Date.now(), type: f.type, name: f.name.trim(), email: f.email.trim(), message: f.message.trim(), status: 'pending' });
    GL.state.outbox = GL.state.outbox.slice(-30);
    GL.save();
    f.message = ''; f.err = {};
    GL.renderSheet();
    if (!GL.online()) { GL.toast('נשמר. הפנייה תישלח כשיחזור האינטרנט'); return; }
    GL.toast('שולח…', 8000);
    const n = await GL.flushOutbox();
    GL.toast(n ? 'תודה! הפנייה נשלחה' : 'לא הצלחתי לשלוח כרגע. ננסה שוב לבד.');
  };
})();
