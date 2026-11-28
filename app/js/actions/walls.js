/* Glow's wallpapers on/off per screen, same or different picture, when, from which pictures. Saved and sent at once. */
(function () {
  'use strict';
  const GL = window.GL;
  const A = GL.A;
  const done = (apply) => { GL.save(); GL.syncEngine(apply); if (GL.ui.sheet) GL.renderSheet(); GL.render(true); };

  A['toggle-walls'] = () => {
    const w = GL.state.walls;
    if (GL.wallsOn()) {
      GL.state.walls = { home: false, lock: false };
      done(false);
      GL.openSheet('walls');
      GL.toast('הרקעים של Glow כבויים');
    } else {
      GL.state.walls = { home: true, lock: GL.live.canLock !== false };
      done(true);
      GL.toast('הרקע של Glow על המסך ✨ אפשר לבחור מסכים בהגדרות', 4000);
    }
    return w;
  };
  A['wall-screen'] = (el) => {
    const s = el.dataset.v, w = GL.state.walls;
    w[s] = !w[s];
    done(w[s]);
    GL.toast(w[s] ? (s === 'home' ? 'מסך הבית: רקע של Glow' : 'מסך הנעילה: רקע של Glow') : (s === 'home' ? 'מסך הבית חוזר להיות שלך' : 'מסך הנעילה חוזר להיות שלך'));
  };
  A['wall-same'] = (el) => { GL.state.mode = el.dataset.v; done(true); };
  A['wall-mode'] = async (el) => {
    GL.rot(el.dataset.key).img.mode = el.dataset.v;
    done(false);
    if (el.dataset.v === 'screen' && GL.isNative() && GL.live.sdk >= 33 && !GL.live.notifications) await GL.engine('askNotifications');
  };
  A['wall-every'] = (el) => { GL.rot(el.dataset.key).img.every = +el.dataset.v; done(false); };
  A['wall-album'] = (el) => { GL.rot(el.dataset.key).album = el.dataset.v; done(true); };
  A['open-wall-picker'] = () => GL.engine('openWallpaperPicker');
})();
