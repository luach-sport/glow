/* App identity, version, where the store lives and where feedback messages go. */
(function () {
  'use strict';
  const GL = (window.GL = window.GL || {});

  GL.VERSION = window.GLOW_VERSION || { version: '1.0', build: 'dev' };
  GL.APP_ID = 'com.luachsport.glow';
  GL.REPO = 'luach-sport/glow';
  GL.SITE_URL = 'https://luach-sport.github.io/glow/';
  // The packs store: a list of sentence and picture packs on the app's site (free, GitHub Pages).
  GL.STORE_URL = GL.SITE_URL + 'packs/';
  // Feedback goes to the developer's own Google Apps Script (shared with the other Itzko apps), which
  // e-mails only the developer and says which app the message came from. No e-mail address ships in the app.
  GL.FEEDBACK_URL = 'https://script.google.com/macros/s/AKfycbwuxeoRQSIFoCfTrJqJ_QUeF1JANm0H4PY5Mc00Ns8hBm9K8lvJ2S5hBYQOVtA3lZX1lw/exec';
  GL.FEEDBACK_KEY = 'mc_9-ATPT_LPmYj188PGtCksaLh';
  GL.FEEDBACK_APP = 'glow';
})();
