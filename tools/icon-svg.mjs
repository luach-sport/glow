// Glow's icon: a glowing sun-circle with a sparkle, on a violet-to-pink background.
export const COLORS = { bg: '#7A2FD8', bg2: '#E0409A', glow: '#FFE3F3', ink: '#FFFFFF' };

// shape: 'square' (rounded app icon), 'circle', or 'none' (glyph only, for the adaptive foreground)
export function iconSvg({ size = 512, shape = 'square', scale = 1 } = {}) {
  const s = 120;
  const bg = shape === 'none' ? '' :
    shape === 'circle' ? `<circle cx="60" cy="60" r="60" fill="url(#g)"/>` : `<rect width="120" height="120" rx="28" fill="url(#g)"/>`;
  const k = scale, t = (60 - 60 * k).toFixed(2);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${s} ${s}">
<defs>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${COLORS.bg}"/><stop offset="1" stop-color="${COLORS.bg2}"/></linearGradient>
<radialGradient id="h" cx="0.5" cy="0.5" r="0.5"><stop offset="0.55" stop-color="#FFFFFF" stop-opacity="0.55"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
</defs>
${bg}
<g transform="translate(${t} ${t}) scale(${k})">
<circle cx="56" cy="64" r="34" fill="url(#h)"/>
<circle cx="56" cy="64" r="22" fill="${COLORS.ink}"/>
<path d="M56 50a14 14 0 0 1 14 14" fill="none" stroke="${COLORS.bg2}" stroke-width="4.5" stroke-linecap="round" opacity="0.55"/>
<path d="M88 22c1.6 7.2 3.8 9.4 11 11-7.2 1.6-9.4 3.8-11 11-1.6-7.2-3.8-9.4-11-11 7.2-1.6 9.4-3.8 11-11Z" fill="${COLORS.ink}"/>
<path d="M95 52c.8 3.4 1.8 4.4 5.2 5.2-3.4.8-4.4 1.8-5.2 5.2-.8-3.4-1.8-4.4-5.2-5.2 3.4-.8 4.4-1.8 5.2-5.2Z" fill="${COLORS.glow}"/>
</g>
</svg>`;
}

// Notification icon (white on transparent, Android tints it).
export function statSvg() {
  return `<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="24dp" android:height="24dp" android:viewportWidth="24" android:viewportHeight="24">
    <path android:fillColor="#FFFFFFFF" android:pathData="M6,13a5,5 0,1 0,10 0a5,5 0,1 0,-10 0Z M18,2c0.4,1.8 0.9,2.3 2.7,2.7c-1.8,0.4 -2.3,0.9 -2.7,2.7c-0.4,-1.8 -0.9,-2.3 -2.7,-2.7c1.8,-0.4 2.3,-0.9 2.7,-2.7Z"/>
</vector>
`;
}
