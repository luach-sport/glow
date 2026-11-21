package com.luachsport.glow;

import android.app.WallpaperManager;
import android.content.Context;
import android.graphics.Bitmap;
import android.os.Build;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.List;
import java.util.Random;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * The heart of Glow: picks the next picture and sentence for each "rotation" and sets the wallpaper.
 * A rotation is one set of settings: "both" (home and lock together), or "home" and "lock" separately.
 * Pictures and sentences are drawn from a shuffled bag, so nothing repeats until everything was shown.
 */
final class Engine {
    static final ExecutorService WORK = Executors.newSingleThreadExecutor();
    private static final Random RND = new Random();
    private static long lastScreenRun = 0;

    private Engine() { }

    // ---------- time of day ----------
    static String partNow(Context c) { return partAt(c, System.currentTimeMillis()); }

    static String partAt(Context c, long ts) {
        JSONObject p = Store.config(c).optJSONObject("parts");
        int m = p == null ? 5 : p.optInt("morning", 5), n = p == null ? 11 : p.optInt("noon", 11);
        int e = p == null ? 16 : p.optInt("evening", 16), ni = p == null ? 20 : p.optInt("night", 20);
        Calendar cal = Calendar.getInstance();
        cal.setTimeInMillis(ts);
        int hr = cal.get(Calendar.HOUR_OF_DAY);
        if (hr >= ni || hr < m) return "night";
        if (hr >= e) return "evening";
        if (hr >= n) return "noon";
        return "morning";
    }

    /** Next moment the part of the day changes. */
    static long nextPartChange(Context c, long now) {
        JSONObject p = Store.config(c).optJSONObject("parts");
        int[] hours = { p == null ? 5 : p.optInt("morning", 5), p == null ? 11 : p.optInt("noon", 11), p == null ? 16 : p.optInt("evening", 16), p == null ? 20 : p.optInt("night", 20) };
        long best = Long.MAX_VALUE;
        for (int d = 0; d < 2; d++) {
            for (int hr : hours) {
                Calendar cal = Calendar.getInstance();
                cal.setTimeInMillis(now);
                cal.add(Calendar.DAY_OF_YEAR, d);
                cal.set(Calendar.HOUR_OF_DAY, hr);
                cal.set(Calendar.MINUTE, 0);
                cal.set(Calendar.SECOND, 5);
                cal.set(Calendar.MILLISECOND, 0);
                long t = cal.getTimeInMillis();
                if (t > now + 1000 && t < best) best = t;
            }
        }
        return best;
    }

    // ---------- picking ----------
    private static String pick(Context c, JSONObject st, String bagKey, List<String> pool, String current) {
        if (pool.isEmpty()) return null;
        if (pool.size() == 1) return pool.get(0);
        List<String> bag = new ArrayList<>();
        JSONArray saved = st.optJSONArray(bagKey);
        if (saved != null) for (int i = 0; i < saved.length(); i++) { String id = saved.optString(i); if (pool.contains(id)) bag.add(id); }
        if (bag.isEmpty() || (bag.size() == 1 && bag.get(0).equals(current))) {
            bag = new ArrayList<>(pool);
            Collections.shuffle(bag, RND);
        }
        String next = bag.remove(0);
        if (next.equals(current) && !bag.isEmpty()) { bag.add(next); next = bag.remove(0); }
        try { st.put(bagKey, new JSONArray(bag)); } catch (Exception ignored) { }
        return next;
    }

    private static List<String> imagePool(Context c, JSONObject rot) {
        JSONArray imgs = rot.optJSONArray("images");
        List<String> all = new ArrayList<>(), part = new ArrayList<>();
        if (imgs == null) return all;
        boolean byPart = "parts".equals(rot.optJSONObject("img") == null ? "" : rot.optJSONObject("img").optString("mode"));
        String now = partNow(c);
        for (int i = 0; i < imgs.length(); i++) {
            JSONObject o = imgs.optJSONObject(i);
            if (o == null) continue;
            all.add(o.optString("id"));
            JSONArray p = o.optJSONArray("p");
            if (byPart && p != null) for (int k = 0; k < p.length(); k++) if (now.equals(p.optString(k))) { part.add(o.optString("id")); break; }
        }
        return byPart && !part.isEmpty() ? part : all;
    }

    private static List<String> quotePool(JSONObject rot) {
        List<String> out = new ArrayList<>();
        JSONArray q = rot.optJSONArray("quotes");
        if (q != null) for (int i = 0; i < q.length(); i++) { JSONObject o = q.optJSONObject(i); if (o != null) out.add(o.optString("id")); }
        return out;
    }

    static JSONObject findImage(JSONObject rot, String id) {
        JSONArray a = rot.optJSONArray("images");
        if (a == null || id == null) return null;
        for (int i = 0; i < a.length(); i++) { JSONObject o = a.optJSONObject(i); if (o != null && id.equals(o.optString("id"))) return o; }
        return null;
    }

    static JSONObject findQuote(JSONObject rot, String id) {
        JSONArray a = rot.optJSONArray("quotes");
        if (a == null || id == null) return null;
        for (int i = 0; i < a.length(); i++) { JSONObject o = a.optJSONObject(i); if (o != null && id.equals(o.optString("id"))) return o; }
        return null;
    }

    static boolean quoteOn(JSONObject rot) {
        JSONObject q = rot.optJSONObject("quote");
        return q != null && q.optBoolean("on", true);
    }

    /**
     * Change one rotation. newImg / newQuote ask for a fresh pick; forceImg / forceQuote set exact ones
     * (from the app's gallery, or going back in the history).
     */
    static synchronized boolean apply(Context c, String key, boolean newImg, boolean newQuote, String forceImg, String forceQuote, String why) {
        JSONObject rot = Store.rotation(c, key);
        if (rot == null || !rot.optBoolean("on", true)) return false;
        JSONObject st = Store.state(c, key);
        long now = System.currentTimeMillis();
        String img = st.optString("img", null), quote = st.optString("quote", null);
        boolean imgChanged = false, quoteChanged = false;
        if (forceImg != null && findImage(rot, forceImg) != null) { img = forceImg; imgChanged = true; }
        else if (newImg || findImage(rot, img) == null) { img = pick(c, st, "bagImg", imagePool(c, rot), img); imgChanged = true; }
        if (quoteOn(rot)) {
            if (forceQuote != null && findQuote(rot, forceQuote) != null) { quote = forceQuote; quoteChanged = true; }
            else if (newQuote || findQuote(rot, quote) == null) { quote = pick(c, st, "bagQuote", quotePool(rot), quote); quoteChanged = true; }
        }
        if (img == null) return false;
        boolean ok = setWallpaper(c, rot, findImage(rot, img), quoteOn(rot) ? findQuote(rot, quote) : null);
        if (!ok) return false;
        try {
            st.put("img", img);
            if (quote != null) st.put("quote", quote);
            if (imgChanged) { st.put("imgAt", now); st.put("imgPart", partAt(c, now)); }
            if (quoteChanged) { st.put("quoteAt", now); st.put("quotePart", partAt(c, now)); }
            if (!st.has("imgAt")) st.put("imgAt", now);
            if (!st.has("quoteAt")) st.put("quoteAt", now);
        } catch (Exception ignored) { }
        Store.saveState(c, key, st);
        Store.addHistory(c, key, img, quoteOn(rot) ? quote : "", why);
        GlowWidget.refreshAll(c);
        return true;
    }

    private static boolean setWallpaper(Context c, JSONObject rot, JSONObject img, JSONObject quote) {
        JSONObject style = Store.config(c).optJSONObject("style");
        JSONArray targets = rot.optJSONArray("targets");
        JSONArray qOn = rot.optJSONArray("quoteOn");
        boolean home = has(targets, "home"), lock = has(targets, "lock");
        if (!home && !lock) return false;
        String text = quote == null ? null : quote.optString("t", null);
        boolean qHome = text != null && has(qOn, "home"), qLock = text != null && has(qOn, "lock");
        int[] size = Composer.screen(c);
        WallpaperManager wm = WallpaperManager.getInstance(c);
        try {
            if (Build.VERSION.SDK_INT < 24) {
                if (!home && lock) return false; // Android 6: only the home screen can be changed
                Bitmap b = Composer.compose(c, img, qHome ? text : null, style, size[0], size[1]);
                wm.setBitmap(b);
                b.recycle();
                return true;
            }
            if (home && lock && qHome == qLock) {
                Bitmap b = Composer.compose(c, img, qHome ? text : null, style, size[0], size[1]);
                wm.setBitmap(b, null, true, WallpaperManager.FLAG_SYSTEM | WallpaperManager.FLAG_LOCK);
                b.recycle();
                return true;
            }
            if (lock) {
                Bitmap b = Composer.compose(c, img, qLock ? text : null, style, size[0], size[1]);
                wm.setBitmap(b, null, true, WallpaperManager.FLAG_LOCK);
                b.recycle();
            }
            if (home) {
                Bitmap b = Composer.compose(c, img, qHome ? text : null, style, size[0], size[1]);
                wm.setBitmap(b, null, true, WallpaperManager.FLAG_SYSTEM);
                b.recycle();
            }
            return true;
        } catch (Throwable t) {
            android.util.Log.w("Glow", "wallpaper failed", t);
            return false;
        }
    }

    static boolean has(JSONArray a, String v) {
        if (a == null) return false;
        for (int i = 0; i < a.length(); i++) if (v.equals(a.optString(i))) return true;
        return false;
    }

    private static long every(JSONObject o) { return Math.max(5, o.optLong("every", 60)) * 60_000L; }

    /** What is due now (by time or by part of the day). */
    static synchronized void runDue(Context c, String why) {
        JSONArray rots = Store.rotations(c);
        long now = System.currentTimeMillis();
        String part = partAt(c, now);
        for (int i = 0; i < rots.length(); i++) {
            JSONObject r = rots.optJSONObject(i);
            if (r == null || !r.optBoolean("on", true)) continue;
            String key = r.optString("key");
            JSONObject st = Store.state(c, key);
            JSONObject im = r.optJSONObject("img"), q = r.optJSONObject("quote");
            boolean di = due(im, st.optLong("imgAt", 0), st.optString("imgPart", ""), now, part);
            boolean dq = quoteOn(r) && due(q, st.optLong("quoteAt", 0), st.optString("quotePart", ""), now, part);
            if (!st.has("img")) di = true;
            if (di || dq) apply(c, key, di, dq, null, null, why);
        }
    }

    private static boolean due(JSONObject o, long at, String atPart, long now, String part) {
        if (o == null) return false;
        String m = o.optString("mode", "manual");
        if ("interval".equals(m)) return now - at >= every(o) - 30_000L;
        if ("parts".equals(m)) return !part.equals(atPart);
        return false;
    }

    /** The screen just went off: change what is set to "every time the screen turns on". */
    static synchronized void runScreen(Context c) {
        long now = System.currentTimeMillis();
        if (now - lastScreenRun < 8_000L) return;
        lastScreenRun = now;
        JSONArray rots = Store.rotations(c);
        for (int i = 0; i < rots.length(); i++) {
            JSONObject r = rots.optJSONObject(i);
            if (r == null || !r.optBoolean("on", true)) continue;
            boolean si = "screen".equals(mode(r, "img")), sq = quoteOn(r) && "screen".equals(mode(r, "quote"));
            if (si || sq) apply(c, r.optString("key"), si, sq, null, null, "screen");
        }
        runDue(c, "time");
    }

    static String mode(JSONObject r, String k) { JSONObject o = r.optJSONObject(k); return o == null ? "manual" : o.optString("mode", "manual"); }

    static boolean wantsScreen(Context c) {
        JSONArray rots = Store.rotations(c);
        for (int i = 0; i < rots.length(); i++) {
            JSONObject r = rots.optJSONObject(i);
            if (r == null || !r.optBoolean("on", true)) continue;
            if ("screen".equals(mode(r, "img")) || (quoteOn(r) && "screen".equals(mode(r, "quote")))) return true;
        }
        return false;
    }

    /** When the next timed change is due (0 = nothing timed). */
    static long nextDue(Context c) {
        JSONArray rots = Store.rotations(c);
        long now = System.currentTimeMillis(), best = Long.MAX_VALUE;
        for (int i = 0; i < rots.length(); i++) {
            JSONObject r = rots.optJSONObject(i);
            if (r == null || !r.optBoolean("on", true)) continue;
            JSONObject st = Store.state(c, r.optString("key"));
            for (String k : new String[] { "img", "quote" }) {
                if ("quote".equals(k) && !quoteOn(r)) continue;
                JSONObject o = r.optJSONObject(k);
                String m = mode(r, k);
                long t = Long.MAX_VALUE;
                if ("interval".equals(m)) t = Math.max(now + 5_000L, st.optLong(k + "At", now) + every(o));
                else if ("parts".equals(m)) t = nextPartChange(c, now);
                best = Math.min(best, t);
            }
        }
        return best == Long.MAX_VALUE ? 0 : best;
    }

    /** Go back to what was shown before on this rotation. */
    static synchronized boolean undo(Context c, String key) {
        JSONArray h = Store.history(c);
        JSONObject st = Store.state(c, key);
        String curImg = st.optString("img", ""), curQ = st.optString("quote", "");
        for (int i = 0; i < h.length(); i++) {
            JSONObject e = h.optJSONObject(i);
            if (e == null || !key.equals(e.optString("key"))) continue;
            if (e.optString("img").equals(curImg) && e.optString("quote").equals(curQ)) continue;
            return apply(c, key, false, false, e.optString("img"), e.optString("quote", null), "undo");
        }
        return false;
    }
}
