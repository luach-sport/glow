/* Store actions: refresh the list, install / update, remove, automatic updates. */
(function () {
  'use strict';
  const GL = window.GL;
  const A = GL.A;

  A['store-refresh'] = () => GL.store.refresh(true);
  A['pack-install'] = (el) => GL.store.install(el.dataset.id);
  A['pack-remove'] = (el) => GL.store.remove(el.dataset.id);
  A['toggle-store-auto'] = () => { GL.state.store.autoUpdate = !GL.state.store.autoUpdate; GL.save(); GL.render(true); if (GL.state.store.autoUpdate) GL.store.auto(); };
})();
