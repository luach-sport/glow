/* Registries the other files fill in: screens (views), bottom sheets (SHEETS) and button actions (A). */
(function () {
  'use strict';
  const GL = window.GL;
  GL.views = GL.views || {};
  GL.SHEETS = GL.SHEETS || {};
  GL.A = GL.A || {};
  GL.$ = (sel, root) => (root || document).querySelector(sel);
})();
