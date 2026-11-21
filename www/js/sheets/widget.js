/* The widget's look: glass, dark, light, see-through or Glow colours; text colour, alignment, buttons; and adding it. */
(function () {
  'use strict';
  const GL = window.GL;
  const { esc, icon } = GL;
  const V = GL.views;
  const LOOKS = [{ v: 'glass', l: 'זכוכית' }, { v: 'dark', l: 'כהה' }, { v: 'light', l: 'בהיר' }, { v: 'clear', l: 'שקוף' }, { v: 'brand', l: 'Glow' }];
  const COLORS = ['', '#FFFFFF', '#FFE7A3', '#FFC2E2', '#C9B2FF', '#A8E6FF', '#1C1230'];

  GL.SHEETS.widget = {
    full: true,
    title: () => 'הווידג\'ט',
    render: () => {
      const w = GL.state.widget, q = V.curQuote(), img = V.wallOn('home');
      const color = w.color || (w.look === 'light' ? '#2A1446' : '#FFFFFF');
      let h = '<div class="widget-demo' + (img ? '' : ' yours') + '">' + (img ? '<canvas data-pv="' + esc(img) + '||0" aria-hidden="true"></canvas>' : '') +
        '<div class="mini-widget big w-' + esc(w.look) + '" style="color:' + esc(color) + ';text-align:' + (w.align === 'right' ? 'right' : 'center') + '"><b>' + esc(q ? q.t : 'רקע חדש. כוח חדש.') + '</b>' +
        (w.buttons ? '<span class="mw-btns">' + icon('quote', 'xs') + icon('refresh', 'xs') + icon('sparkle', 'xs') + '</span>' : '') + '</div></div>';
      h += '<p class="fine" style="text-align:center">' + (GL.live.widgets ? 'הווידג\'ט כבר במסך הבית. לחיצה ארוכה עליו מגדילה ומזיזה אותו, והכתב גדל איתו.' : 'הווידג\'ט מראה את המשפט במסך הבית, מעל כל רקע.') + '</p>';
      h += '<button type="button" class="btn" data-action="pin-widget">' + icon('plus') + (GL.live.widgets ? 'להוסיף עוד אחד' : 'הוספה למסך הבית') + '</button>';
      h += '<div class="field"><span class="label">מראה</span><div class="look-grid">' + LOOKS.map((l) => '<button type="button" class="look w-' + l.v + '" data-action="w-look" data-v="' + l.v + '" aria-pressed="' + (w.look === l.v) + '"><i></i><span>' + l.l + '</span></button>').join('') + '</div></div>';
      h += '<div class="field"><span class="label">צבע הכתב</span><div class="swatches">' + COLORS.map((c) => '<button type="button" class="swatch' + (c ? '' : ' auto') + '" style="--c:' + (c || 'conic-gradient(#fff 0 50%, #2A1446 0)') + '" data-action="w-color" data-v="' + c + '" aria-pressed="' + (w.color === c) + '" aria-label="' + (c ? 'צבע ' + c : 'אוטומטי') + '">' + (c ? '' : 'A') + '</button>').join('') + '</div></div>';
      h += '<div class="field"><span class="label">יישור</span>' + V.seg('w-align', [{ v: 'center', l: 'באמצע' }, { v: 'right', l: 'לימין' }], w.align, 'יישור') + '</div>';
      h += '<div class="card list">' + V.sw('w-buttons', 'buttons', 'כפתורים קטנים', 'משפט הבא, רקע חדש ופתיחת Glow', w.buttons, 'hand') + '</div>';
      h += '<p class="fine">בווידג\'ט: לחיצה על המשפט = המשפט הבא, ולב = למועדפים.</p>';
      return h;
    }
  };
})();
