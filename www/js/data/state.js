/* The app's data (GL.state), what is on screen (GL.ui), and what the wallpaper engine reports (GL.live). */
(function () {
  'use strict';
  const GL = window.GL;

  const changed = [];
  GL.onChange = (cb) => changed.push(cb);
  // Every change goes through here: saved, and the wallpaper engine gets the new settings.
  GL.save = (now) => { changed.forEach((cb) => { try { cb(); } catch (e) { console.warn(e); } }); return GL.saveState(GL.state, now); };

  GL.ui = { tab: 'home', stack: [], scroll: {}, sheet: null, form: {}, imgFilter: 'all', qFilter: 'all', q: '' };
  GL.view = () => GL.ui.stack[GL.ui.stack.length - 1] || null;

  // What is on the screens now, the history and the phone's abilities – from the engine (engine/bridge.js).
  GL.live = { rotations: {}, history: [], screenService: false, nextAt: 0, part: '', sdk: 34, canLock: true, w: 1080, h: 2160, batteryFree: true, notifications: true };

  // The rotations in use: one shared ("both"), or home and lock separately.
  GL.activeKeys = () => (GL.state.mode === 'separate' ? ['lock', 'home'] : ['both']);
  GL.rot = (key) => GL.state.rot[key];
})();
