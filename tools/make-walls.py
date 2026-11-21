# Draws Glow's 50 built-in wallpapers (nature and colour, no people), their thumbnails and the list
# the app reads (www/js/data/walls.js). Every picture is drawn from code, so nothing here needs a licence.
# Run: python3 tools/make-walls.py   (needs numpy and Pillow; the outputs are committed, CI does not need it)
import json, math, os, random
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'www', 'img', 'walls')
THUMB = os.path.join(ROOT, 'www', 'img', 'thumbs')
W, H = 1080, 2160
os.makedirs(OUT, exist_ok=True); os.makedirs(THUMB, exist_ok=True)

def hexc(h):
    h = h.lstrip('#'); return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], dtype=np.float32)

def vgrad(stops, h=H, w=W):
    """Vertical gradient from [(pos 0..1, '#hex'), ...]."""
    ys = np.linspace(0, 1, h, dtype=np.float32)
    pos = np.array([p for p, _ in stops], dtype=np.float32)
    cols = np.stack([hexc(c) for _, c in stops])
    out = np.stack([np.interp(ys, pos, cols[:, k]) for k in range(3)], axis=1)
    return np.repeat(out[:, None, :], w, axis=1)

def ridge(rng, base, amp, freqs, w=W):
    x = np.arange(w, dtype=np.float32)
    y = np.full(w, base, dtype=np.float32)
    for f, a in freqs:
        y += amp * a * np.sin(x / w * math.pi * 2 * f + rng.uniform(0, 6.28))
    # sharper peaks
    y += amp * 0.35 * np.abs(np.sin(x / w * math.pi * rng.uniform(3, 7) + rng.uniform(0, 6.28)))
    return y

def fill_below(img, ys, color, alpha=1.0, fade=None):
    h, w, _ = img.shape
    rows = np.arange(h, dtype=np.float32)[:, None]
    mask = (rows >= ys[None, :]).astype(np.float32)
    # soft edge
    edge = np.clip(rows - ys[None, :] + 1.5, 0, 1)
    mask = np.minimum(mask + 0, edge)
    c = np.broadcast_to(hexc(color), img.shape).copy()
    if fade is not None:  # darker toward the bottom
        t = np.clip((rows - ys.min()) / max(1, h - ys.min()), 0, 1)[..., None]
        c = c * (1 - fade * t)
    m = (mask * alpha)[..., None]
    return img * (1 - m) + c * m

def glow(img, cx, cy, r, color, strength=1.0, core=None):
    h, w, _ = img.shape
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
    halo = np.exp(-(d / (r * 3.2)) ** 2) * 0.55 * strength
    img = img + (hexc(color) - img) * halo[..., None] * 0.9
    if core:
        disc = np.clip((r - d) / 2.0 + 0.5, 0, 1)[..., None]
        img = img * (1 - disc) + hexc(core) * disc
    return img

def stars(img, rng, n, top=0.0, bottom=0.7):
    h, w, _ = img.shape
    for _ in range(n):
        x, y = rng.randint(0, w - 1), rng.randint(int(h * top), int(h * bottom))
        b = rng.uniform(0.35, 1.0) * (1 - (y / h) / bottom * 0.5)
        s = 1 if rng.random() < 0.85 else 2
        img[max(0, y - s + 1):y + s, max(0, x - s + 1):x + s] = img[max(0, y - s + 1):y + s, max(0, x - s + 1):x + s] * (1 - b) + 255 * b
    return img

def finish(img, rng, blur=0):
    img = img + rng_np(rng).normal(0, 1.6, img.shape)  # fine grain against banding
    im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))
    if blur: im = im.filter(ImageFilter.GaussianBlur(blur))
    return im

def rng_np(rng):
    return np.random.default_rng(rng.randint(0, 1 << 30))

def mountains(rng, sky, layers, sun=None, mist=None):
    img = vgrad(sky)
    if sun: img = glow(img, sun[0] * W, sun[1] * H, sun[2], sun[3], 1.0, sun[4])
    n = len(layers)
    for i, col in enumerate(layers):
        base = H * (0.48 + 0.42 * i / max(1, n - 1)) - 40
        ys = ridge(rng, base, 90 - i * 8, [(1, 1), (2.3, 0.5), (5.1, 0.22), (11, 0.08)])
        img = fill_below(img, ys, col, 1.0, fade=0.18)
        if mist and i < n - 1:
            rows = np.arange(H, dtype=np.float32)[:, None, None]
            m = np.exp(-((rows - base - 160) / 140) ** 2) * mist
            img = img + (hexc(sky[-1][1]) - img) * m
    return img

def sea(rng, sky, water, sun, horizon=0.56):
    img = vgrad(sky)
    hy = int(H * horizon)
    img = glow(img, sun[0] * W, sun[1] * H, sun[2], sun[3], 1.0, sun[4])
    w = vgrad(water, H - hy)
    img[hy:] = w
    gen = rng_np(rng)
    # light path on the water
    xs = np.arange(W, dtype=np.float32)
    for row in range(hy, H, 3):
        t = (row - hy) / (H - hy)
        width = 40 + 360 * t
        streak = np.exp(-((xs - sun[0] * W) / width) ** 2)
        flick = (gen.random(W) < 0.35 + 0.3 * (1 - t)).astype(np.float32)
        img[row:row + 2] += (hexc(sun[3]) - img[row:row + 2]) * (streak * flick * (0.55 - 0.35 * t))[None, :, None]
    return img

def dunes(rng, sky, cols, sun):
    img = vgrad(sky)
    img = glow(img, sun[0] * W, sun[1] * H, sun[2], sun[3], 1.0, sun[4])
    x = np.arange(W, dtype=np.float32)
    for i, (lit, shade) in enumerate(cols):
        base = H * (0.55 + 0.13 * i)
        ph, f = rng.uniform(0, 6.28), rng.uniform(0.6, 1.4)
        ys = base + 120 * np.sin(x / W * math.pi * f + ph) + 40 * np.sin(x / W * math.pi * 3.1 * f + ph * 2)
        img = fill_below(img, ys, lit, 1.0, fade=0.1)
        slope = np.gradient(ys)
        sh = np.clip(slope / 2.5, 0, 1)
        rows = np.arange(H, dtype=np.float32)[:, None]
        band = ((rows >= ys[None, :]) & (rows < ys[None, :] + 260)).astype(np.float32) * sh[None, :] * 0.6
        img = img + (hexc(shade) - img) * band[..., None]
    return img

def forest(rng, sky, layers, fog):
    img = vgrad(sky)
    n = len(layers)
    for i, col in enumerate(layers):
        base = H * (0.5 + 0.38 * i / max(1, n - 1))
        ys = np.full(W, base + 400, dtype=np.float32)
        x = 0
        while x < W + 60:
            tw = rng.randint(50, 110) * (1 + i * 0.35)
            th = tw * rng.uniform(2.4, 3.6)
            top = base - th + rng.uniform(-40, 40)
            xs = np.arange(max(0, int(x - tw / 2)), min(W, int(x + tw / 2)))
            if len(xs):
                prof = top + th * np.abs(xs - x) / (tw / 2)
                ys[xs] = np.minimum(ys[xs], prof)
            x += tw * rng.uniform(0.45, 0.8)
        img = fill_below(img, ys, col, 1.0)
        if i < n - 1:
            rows = np.arange(H, dtype=np.float32)[:, None, None]
            m = np.clip((rows - (base - 200)) / 500, 0, 1) * np.clip(1 - (rows - base) / 700, 0, 1) * fog
            img = img + (hexc(sky[-1][1]) - img) * m
    return img

def waves(rng, cols, bg):
    img = vgrad(bg)
    x = np.arange(W, dtype=np.float32)
    rows = np.arange(H, dtype=np.float32)[:, None]
    for i, c in enumerate(cols):
        base = H * (0.25 + 0.6 * i / len(cols))
        ys = base + 140 * np.sin(x / W * math.pi * rng.uniform(0.8, 1.6) + rng.uniform(0, 6.28)) + 50 * np.sin(x / W * math.pi * 3.3 + rng.uniform(0, 6.28))
        soft = np.clip((rows - ys[None, :]) / 3 + 0.5, 0, 1)
        img = img * (1 - soft[..., None] * 0.85) + hexc(c) * soft[..., None] * 0.85
        shade = np.exp(-((rows - ys[None, :]) / 60) ** 2) * 0.25
        img = img + (255 - img) * shade[..., None] * 0.5
    return img

def bokeh(rng, bg, cols, n=26):
    img = vgrad(bg)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    for _ in range(n):
        cx, cy, r = rng.uniform(0, W), rng.uniform(0, H), rng.uniform(40, 190)
        d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
        a = np.clip((r - d) / 6 + 0.5, 0, 1) * rng.uniform(0.12, 0.35)
        img = img + (hexc(rng.choice(cols)) - img) * a[..., None]
    return img

def moon_night(rng, sky, moon_xy, ground=None):
    img = vgrad(sky)
    img = stars(img, rng, 900)
    img = glow(img, moon_xy[0] * W, moon_xy[1] * H, 70, '#FFF6DA', 0.8, '#FFF8E6')
    if ground:
        ys = ridge(rng, H * 0.82, 70, [(1, 1), (2.7, 0.4), (6, 0.15)])
        img = fill_below(img, ys, ground, 1.0)
    return img

# ---------------------------------------------------------------- the 50 pictures
# parts: which times of day the picture suits (morning, noon, evening, night) – used by "by time of day".
P = []
def add(name, cat, parts, fn, blur=0):
    P.append((name, cat, parts, fn, blur))

A = 'morning'; N = 'noon'; E = 'evening'; Ni = 'night'
# sunrise
add('זריחה בהרים', 'sun', [A], lambda r: mountains(r, [(0, '#2B3A67'), (0.35, '#E58C8A'), (0.55, '#F7C59F')], ['#7A5C8E', '#5B4479', '#3B2D5B', '#231A3D'], (0.62, 0.47, 70, '#FFE2B0', '#FFF3DC'), 0.25))
add('בוקר ורוד', 'sun', [A], lambda r: mountains(r, [(0, '#5E4B8B'), (0.4, '#F3A6C0'), (0.6, '#FFDCC2')], ['#B27BA6', '#8A5C8F', '#5E3F73', '#3A2752'], (0.35, 0.5, 60, '#FFE9D2', '#FFF8EE'), 0.3))
add('זריחה על הים', 'sea', [A], lambda r: sea(r, [(0, '#3A4F7A'), (0.4, '#F0A08C'), (0.56, '#FFD9A8')], [(0, '#E8A985'), (0.4, '#5F6E99'), (1, '#1E2748')], (0.5, 0.53, 64, '#FFE6B8', '#FFF4DC')))
add('אור ראשון', 'sun', [A], lambda r: mountains(r, [(0, '#1E2A4A'), (0.45, '#C9748F'), (0.6, '#F4B183')], ['#6B4A6F', '#4A3457', '#2E2140', '#1A1329'], (0.7, 0.55, 56, '#FFD49A', '#FFEBC8'), 0.2))
add('שחר כחול', 'sun', [A], lambda r: mountains(r, [(0, '#0F1C3F'), (0.5, '#5C7CB0'), (0.62, '#E9C3B5')], ['#4E6290', '#3A4B75', '#27345A', '#151E3A'], None, 0.35))
add('זריחה זהובה', 'sun', [A], lambda r: dunes(r, [(0, '#5A6FA8'), (0.42, '#F2B880'), (0.56, '#FCE3B5')], [('#D9965C', '#9A5A34'), ('#C98048', '#8A4A28'), ('#B36A38', '#6E3820')], (0.3, 0.5, 66, '#FFF0C8', '#FFFBEA')))
add('עמק בבוקר', 'mountain', [A], lambda r: mountains(r, [(0, '#87A8D9'), (0.5, '#F6D6C0'), (0.62, '#FFF0E2')], ['#9FB3C8', '#7F97B0', '#5D7690', '#3D546B', '#26384A'], (0.5, 0.42, 50, '#FFF6E5', '#FFFCF4'), 0.45))
# day / mountains / lakes
add('הרים כחולים', 'mountain', [N], lambda r: mountains(r, [(0, '#3F7CC4'), (0.55, '#A9CDEB'), (0.62, '#DCEBF7')], ['#7FA3C7', '#5D86B0', '#3F6893', '#284B70', '#173252'], None, 0.4))
add('פסגות ירוקות', 'mountain', [N], lambda r: mountains(r, [(0, '#4D8FD1'), (0.55, '#B7DAF2'), (0.62, '#E6F3FB')], ['#8FB8A8', '#5E9A7E', '#3F7A5E', '#285C43', '#16402D'], None, 0.35))
add('שלג על ההר', 'mountain', [N], lambda r: mountains(r, [(0, '#2F6FB7'), (0.6, '#BFD8EF')], ['#E8EEF5', '#C3CFDD', '#8EA1B8', '#5D7088', '#34445A'], None, 0.25))
add('גבעות', 'mountain', [N], lambda r: mountains(r, [(0, '#69A6E0'), (0.6, '#D8ECFA')], ['#A8C97F', '#86B262', '#679848', '#4C7D33', '#335C20'], (0.78, 0.18, 46, '#FFFBE8', '#FFFFFF'), 0.2))
add('אגם שקט', 'sea', [N], lambda r: sea(r, [(0, '#3D78BD'), (0.5, '#A7CDEE'), (0.6, '#E3F0FA')], [(0, '#8DB5D8'), (0.5, '#3E6E9C'), (1, '#183455')], (0.5, 0.3, 36, '#FFFFFF', '#FFFFFF'), 0.6))
add('ערפל בעמק', 'mountain', [A, N], lambda r: mountains(r, [(0, '#8FA6BF'), (0.6, '#E3E9EF')], ['#B7C3CF', '#95A4B4', '#738598', '#53667B', '#36475B'], None, 0.6))
add('רכס סגול', 'mountain', [N, E], lambda r: mountains(r, [(0, '#5A62B5'), (0.6, '#C9C3EE')], ['#9B8FD2', '#7C6EBD', '#5E50A2', '#423683', '#2A2161'], None, 0.4))
# sea
add('ים תכלת', 'sea', [N], lambda r: sea(r, [(0, '#2C83D6'), (0.55, '#BFE2FA')], [(0, '#55B3D9'), (0.5, '#1F7EAD'), (1, '#0C4366')], (0.5, 0.2, 40, '#FFFFFF', '#FFFFFF')))
add('אופק', 'sea', [N], lambda r: sea(r, [(0, '#5E9BD6'), (0.5, '#D7EBF7')], [(0, '#9CC9E2'), (0.4, '#3F84B5'), (1, '#123E66')], (0.3, 0.42, 34, '#FFFFFF', '#FFFFFF'), 0.5))
add('ים בצהריים', 'sea', [N], lambda r: sea(r, [(0, '#1E6FC2'), (0.5, '#9FD0F2')], [(0, '#3FA7C9'), (0.5, '#16709C'), (1, '#063656')], (0.65, 0.12, 44, '#FFFFFF', '#FFFFFF'), 0.62))
add('מפרץ טורקיז', 'sea', [N], lambda r: sea(r, [(0, '#2D9BD0'), (0.5, '#C2ECF5')], [(0, '#7FE0D8'), (0.4, '#22A6B0'), (1, '#0A5568')], (0.4, 0.25, 40, '#FFFFFF', '#FFFFFF'), 0.58))
add('ים סוער', 'sea', [N, E], lambda r: sea(r, [(0, '#3E4E62'), (0.5, '#93A3B3')], [(0, '#6F8294'), (0.5, '#36495D'), (1, '#152331')], (0.6, 0.4, 30, '#E6EDF3', '#F2F6F9'), 0.55))
add('ים כסוף', 'sea', [A, N], lambda r: sea(r, [(0, '#7C93B4'), (0.5, '#E4E9F0')], [(0, '#C3CCD8'), (0.4, '#7A8EA8'), (1, '#2E3E58')], (0.5, 0.45, 42, '#FFFFFF', '#FFFFFF')))
# desert
add('דיונות', 'desert', [N], lambda r: dunes(r, [(0, '#3F86CF'), (0.5, '#BFDDF3')], [('#E9B97A', '#B07B45'), ('#DDA764', '#9C6634'), ('#CE9352', '#835228')], (0.75, 0.18, 44, '#FFFCEB', '#FFFFFF')))
add('מדבר בשקיעה', 'desert', [E], lambda r: dunes(r, [(0, '#3B2A5C'), (0.4, '#E27B5B'), (0.55, '#F9C17E')], [('#C9714A', '#7E3A27'), ('#B05C3C', '#6A2E20'), ('#8F4631', '#52231A')], (0.5, 0.52, 62, '#FFD8A0', '#FFEFD0')))
add('חולות זהב', 'desert', [N, E], lambda r: dunes(r, [(0, '#6E97C9'), (0.5, '#F3DDB8')], [('#F0C987', '#B98A4C'), ('#E5B670', '#A77738'), ('#D8A15C', '#93652C')], (0.25, 0.3, 40, '#FFFDF2', '#FFFFFF')))
add('מכתש', 'desert', [N], lambda r: mountains(r, [(0, '#4A8DD0'), (0.6, '#E4EEF6')], ['#D8A983', '#C38E68', '#A9724F', '#8B583B', '#6B4029'], None, 0.3))
add('ערב במדבר', 'desert', [E], lambda r: dunes(r, [(0, '#25204A'), (0.45, '#A0577A'), (0.58, '#F1A37C')], [('#8E4E5A', '#4E2635'), ('#733E4E', '#3C1C2A'), ('#552D3D', '#2B1420')], (0.68, 0.56, 50, '#FFC69A', '#FFE3C6')))
# sunset
add('שקיעה כתומה', 'sun', [E], lambda r: sea(r, [(0, '#3A2C6B'), (0.35, '#D9586A'), (0.55, '#FFB067')], [(0, '#F08A5D'), (0.35, '#7A3E6B'), (1, '#1E1638')], (0.5, 0.52, 70, '#FFD27A', '#FFF0C2')))
add('שקיעה ורודה', 'sun', [E], lambda r: mountains(r, [(0, '#4B2A6E'), (0.4, '#E26D9A'), (0.58, '#FFC1A1')], ['#A2507F', '#7E3A6A', '#5A2753', '#371638'], (0.4, 0.54, 64, '#FFD7B0', '#FFF0DE'), 0.25))
add('שמי זהב', 'sun', [E], lambda r: mountains(r, [(0, '#5A3D7A'), (0.45, '#F09A5A'), (0.6, '#FFD98A')], ['#8E5A55', '#6E4146', '#4E2C36', '#2E1A24'], (0.62, 0.57, 60, '#FFE6A6', '#FFF6D8'), 0.2))
add('שקיעה סגולה', 'sun', [E], lambda r: sea(r, [(0, '#22184A'), (0.4, '#8E4C9E'), (0.56, '#F08FA0')], [(0, '#C0729A'), (0.4, '#4E2C6E'), (1, '#120C28')], (0.35, 0.53, 58, '#FFC3C3', '#FFE6E0')))
add('אחרי השקיעה', 'sun', [E, Ni], lambda r: mountains(r, [(0, '#141D45'), (0.45, '#5A4C8F'), (0.6, '#F09C82')], ['#3D3466', '#2C2650', '#1D1A3A', '#100F24'], None, 0.2))
add('אדמה ושמיים', 'sun', [E], lambda r: mountains(r, [(0, '#2F3F7A'), (0.45, '#E08068'), (0.6, '#FFCB8C')], ['#5C4256', '#463243', '#302230', '#1C141D'], (0.25, 0.58, 54, '#FFE0A8', '#FFF3D6'), 0.15))
add('שקיעה בים', 'sea', [E], lambda r: sea(r, [(0, '#1F2D5C'), (0.4, '#E0676B'), (0.55, '#FFC27A')], [(0, '#E88A63'), (0.3, '#6A3E66'), (1, '#0F1430')], (0.62, 0.5, 66, '#FFDA8C', '#FFF2CC')))
# night
add('ירח מלא', 'night', [Ni], lambda r: moon_night(r, [(0, '#050A1F'), (0.6, '#1C2A5A'), (1, '#2D3F78')], (0.68, 0.22), '#0A0F24'))
add('שמי כוכבים', 'night', [Ni], lambda r: moon_night(r, [(0, '#03050F'), (0.7, '#141B3D'), (1, '#262E5E')], (-1, -1), '#06081A'))
add('לילה סגול', 'night', [Ni], lambda r: moon_night(r, [(0, '#0B0620'), (0.6, '#3A1F66'), (1, '#6E3C8E')], (0.3, 0.3), '#120A26'))
add('ירח מעל הים', 'night', [Ni], lambda r: sea(r, [(0, '#040A1E'), (0.55, '#22346A')], [(0, '#2A3C70'), (0.5, '#121D40'), (1, '#050915')], (0.5, 0.25, 56, '#FFF4D6', '#FFF9EA')))
add('הרים בלילה', 'night', [Ni], lambda r: stars(mountains(r, [(0, '#060B22'), (0.6, '#24356B')], ['#1E2B55', '#162144', '#0F1733', '#090E22'], None, 0.2), r, 700, 0, 0.5))
add('זוהר כחול', 'night', [Ni, E], lambda r: stars(waves(r, ['#1B3A8A', '#2A1F7A', '#141452'], [(0, '#050818'), (1, '#10163A')]), r, 500, 0, 0.35))
add('חצות', 'night', [Ni], lambda r: moon_night(r, [(0, '#000208'), (1, '#0E1430')], (0.5, 0.15), None))
add('ליל מדבר', 'night', [Ni], lambda r: stars(dunes(r, [(0, '#05081A'), (0.6, '#1D2550')], [('#2B2848', '#14122A'), ('#221F3C', '#100E22'), ('#1A1730', '#0B0A18')], (-1, -1, 1, '#000000', None)), r, 900, 0, 0.55))
# forest
add('יער בערפל', 'forest', [A, N], lambda r: forest(r, [(0, '#9FB4B8'), (0.6, '#E2EAE8')], ['#8AA39C', '#64847B', '#43665C', '#284A40'], 0.55))
add('יער ירוק', 'forest', [N], lambda r: forest(r, [(0, '#7FB2D9'), (0.6, '#DDEFF5')], ['#7DA67E', '#56885A', '#356B3C', '#1F4F27'], 0.4))
add('אורנים בשקיעה', 'forest', [E], lambda r: forest(r, [(0, '#3E2C64'), (0.45, '#E0786E'), (0.6, '#FFC58E')], ['#6A3F5C', '#4C2C47', '#311C32', '#1A0F1D'], 0.25))
add('יער בלילה', 'forest', [Ni], lambda r: stars(forest(r, [(0, '#050A1C'), (0.6, '#1B2A52')], ['#18264A', '#111C38', '#0A1226', '#050A16'], 0.25), r, 600, 0, 0.4))
add('יער סתווי', 'forest', [A, E], lambda r: forest(r, [(0, '#D6A77A'), (0.6, '#F7E3C6')], ['#C08A5A', '#9C6A40', '#784C2C', '#52321C'], 0.45))
# colour / abstract (brand colours and soft dark ones that keep the sentence readable)
add('גלים סגולים', 'color', [E, Ni], lambda r: waves(r, ['#8E4FD6', '#C452B8', '#F06AA0', '#FF9EAE'], [(0, '#2A1446'), (1, '#3D1B63')]))
add('זוהר ורוד', 'color', [A, N, E, Ni], lambda r: bokeh(r, [(0, '#3B1666'), (0.5, '#8A2D8F'), (1, '#E0558F')], ['#FFFFFF', '#FFB3D9', '#C9A2FF']), 0)
add('גלי תכלת', 'color', [A, N], lambda r: waves(r, ['#5BB8F0', '#3C8FE0', '#2E6BC7', '#1F4C9E'], [(0, '#BFE6FB'), (1, '#7CC4EE')]))
add('אורות רכים', 'color', [E, Ni], lambda r: bokeh(r, [(0, '#0E1230'), (1, '#24204F')], ['#FFD27A', '#FF9EC6', '#9EC3FF', '#FFFFFF']), 0)
add('כהה ונקי', 'color', [A, N, E, Ni], lambda r: vgrad([(0, '#1A1530'), (0.6, '#2C1F4A'), (1, '#1C1430')]))

def main():
    assert len(P) == 50, len(P)
    items = []
    for i, (name, cat, parts, fn, blur) in enumerate(P, 1):
        rng = random.Random(1000 + i)
        im = finish(fn(rng), rng, blur)
        fid = 'w%02d' % i
        im.save(os.path.join(OUT, fid + '.jpg'), quality=84, optimize=True, progressive=True)
        im.resize((270, 540), Image.LANCZOS).save(os.path.join(THUMB, fid + '.jpg'), quality=80, optimize=True)
        items.append({'id': fid, 'name': name, 'cat': cat, 'parts': parts})
        print(fid, name, os.path.getsize(os.path.join(OUT, fid + '.jpg')) // 1024, 'KB')

    CATS = {'sun': 'זריחות ושקיעות', 'mountain': 'הרים ועמקים', 'sea': 'ים ואגמים', 'desert': 'מדבר', 'night': 'לילה וכוכבים', 'forest': 'יערות', 'color': 'צבעים'}
    js = ('/* Built-in wallpapers (drawn by tools/make-walls.py – nature and colour, no people). Generated file. */\n'
          '(function () {\n  \'use strict\';\n  const GL = window.GL;\n'
          '  GL.WALL_CATS = ' + json.dumps(CATS, ensure_ascii=False) + ';\n'
          '  GL.BUILTIN_WALLS = ' + json.dumps(items, ensure_ascii=False) + ';\n})();\n')
    open(os.path.join(ROOT, 'www', 'js', 'data', 'walls.js'), 'w', encoding='utf-8').write(js)
    print('total', sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT)) // 1024, 'KB')


if __name__ == '__main__':
    main()
