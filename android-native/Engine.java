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
 * Glow's wallpapers (optional – only on the screens the user turned on). A rotation is one set of settings:
 * "both" (home and lock together), or "home" and "lock" separately. Pictures come from a shuffled bag, so nothing
 * repeats until everything was shown. The sentence is NOT part of this: it lives in Quotes (widget, lock-screen
 * notification), and is printed on the lock wallpaper only when the user asks for that ("bake").
 */
final class Engine {
    static final ExecutorService WORK = Executors.newSingleThreadExecutor();
    static final Random RND = new Random();
    private static long lastScreenRun = 0;

    private Engine() { }

    // ---------- time of day ----------
    static String partNow(Context c) { return partAt(c, System.currentTimeMillis()); }

    private static int[] hours(Context c) {
        JSONObject p = Store.config(c).optJSONObject("parts");
        return new int[] { p == null ? 5 : p.optInt("morning", 5), p == null ? 11 : p.optInt("noon", 11), p == null ? 16 : p.optInt("evening", 16), p == null ? 20 : p.optInt("night", 20) };
    }

    static String partAt(Context c, long ts) {
        int[] h = hours(c);
        Calendar cal = Calendar.getInstance();
        cal.setTimeInMillis(ts);
        int hr = cal.get(Calendar.HOUR_OF_DAY);
        if (hr >= h[3] || hr < h[0]) return "night";
        if (hr >= h[2]) return "evening";
        if (hr >= h[1]) return "noon";
        return "morning";
    }

    static long nextPartChange(Context c, long now) {
        long best = Long.MAX_VALUE;
        for (int d = 0; d < 2; d++) {
            for (int hr : hours(c)) {
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

    // ---------- shuffled bag ----------
    static String pick(JSONObject st, String bagKey, List<String> pool, String current) {
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
        boolean byPart = "parts".equals(mode(rot, "img"));
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

    static JSONObject findImage(JSONObject rot, String id) {
        JSONArray a = rot.optJSONArray("images");
        if (a == null || id == null) return null;
        for (int i = 0; i < a.length(); i++) { JSONObject o = a.optJSONObject(i); if (o != null && id.equals(o.optString("id"))) return o; }
        return null;
    }

    static String mode(JSONObject r, String k) { JSONObject o = r.optJSONObject(k); return o == null ? "manual" : o.optString("mode", "manual"); }

    static boolean has(JSONArray a, String v) {
        if (a == null) return false;
        for (int i = 0; i < a.length(); i++) if (v.equals(a.optString(i))) return true;
        return false;
    }

    /** Change one rotation's wallpaper. newImg = a fresh picture; forceImg = exactly this one; neither = redraw (e.g. new sentence on it). */
    static synchronized boolean apply(Context c, String key, boolean newImg, String forceImg, String why) {
        JSONObject rot = Store.rotation(c, key);
        if (rot == null || !rot.optBoolean("on", true)) return false;
        JSONObject st = Store.state(c, key);
        long now = System.currentTimeMillis();
        String img = st.optString("img", null);
        boolean changed = false;
        if (forceImg != null && findImage(rot, forceImg) != null) { img = forceImg; changed = true; }
        else if (newImg || findImage(rot, img) == null) { img = pick(st, "bagImg", imagePool(c, rot), img); changed = true; }
        if (img == null) return false;
        JSONObject q = Quotes.current(c);
        String text = q == null || !Quotes.on(c) ? null : q.optString("t", null);
        if (!setWallpaper(c, rot, findImage(rot, img), text)) return false;
        try {
            st.put("img", img);
            if (changed || !st.has("imgAt")) { st.put("imgAt", now); st.put("imgPart", partAt(c, now)); }
        } catch (Exception ignored) { }
        Store.saveState(c, key, st);
        if (changed) Store.addHistory(c, key, img, has(rot.optJSONArray("bake"), "lock") && q != null ? q.optString("id") : "", why);
        return true;
    }

    private static boolean setWallpaper(Context c, JSONObject rot, JSONObject img, String text) {
        JSONObject style = Store.config(c).optJSONObject("style");
        JSONArray targets = rot.optJSONArray("targets"), bake = rot.optJSONArray("bake");
        boolean home = has(targets, "home"), lock = has(targets, "lock");
        if (!home && !lock) return false;
        String lockText = text != null && has(bake, "lock") ? text : null;
        int[] size = Composer.screen(c);
        WallpaperManager wm = WallpaperManager.getInstance(c);
        try {
            if (Build.VERSION.SDK_INT < 24) {
                if (!home) return false; // Android 6: only the home screen can be changed
                Bitmap b = Composer.compose(c, img, null, style, size[0], size[1]);
                wm.setBitmap(b);
                b.recycle();
                return true;
            }
            if (home && lock && lockText == null) {
                Bitmap b = Composer.compose(c, img, null, style, size[0], size[1]);
                wm.setBitmap(b, null, true, WallpaperManager.FLAG_SYSTEM | WallpaperManager.FLAG_LOCK);
                b.recycle();
                return true;
            }
            if (lock) {
                Bitmap b = Composer.compose(c, img, lockText, style, size[0], size[1]);
                wm.setBitmap(b, null, true, WallpaperManager.FLAG_LOCK);
                b.recycle();
            }
            if (home) {
                Bitmap b = Composer.compose(c, img, null, style, size[0], size[1]);
                wm.setBitmap(b, null, true, WallpaperManager.FLAG_SYSTEM);
                b.recycle();
            }
            return true;
        } catch (Throwable t) {
            android.util.Log.w("Glow", "wallpaper failed", t);
            return false;
        }
    }

    /** The sentence changed: redraw lock wallpapers that carry it. */
    static void redrawBaked(Context c) {
        JSONArray rots = Store.rotations(c);
        for (int i = 0; i < rots.length(); i++) {
            JSONObject r = rots.optJSONObject(i);
            if (r != null && r.optBoolean("on", true) && has(r.optJSONArray("bake"), "lock") && Store.state(c, r.optString("key")).has("img")) apply(c, r.optString("key"), false, null, "quote");
        }
    }

    private static long every(JSONObject o) { return Math.max(1, o.optLong("every", 60)) * 60_000L; }

    static boolean due(JSONObject o, long at, String atPart, long now, String part) {
        if (o == null) return false;
        String m = o.optString("mode", "manual");
        if ("interval".equals(m)) return now - at >= every(o) - 30_000L;
        if ("parts".equals(m)) return !part.equals(atPart);
        return false;
    }

    static long nextFor(Context c, JSONObject o, long at, long now) {
        if (o == null) return Long.MAX_VALUE;
        String m = o.optString("mode", "manual");
        if ("interval".equals(m)) return Math.max(now + 5_000L, at + every(o));
        if ("parts".equals(m)) return nextPartChange(c, now);
        return Long.MAX_VALUE;
    }

    /** What is due now (by time or by part of the day): wallpapers and the sentence. */
    static synchronized void runDue(Context c, String why) {
        JSONArray rots = Store.rotations(c);
        long now = System.currentTimeMillis();
        String part = partAt(c, now);
        Quotes.runDue(c, now, part);
        for (int i = 0; i < rots.length(); i++) {
            JSONObject r = rots.optJSONObject(i);
            if (r == null || !r.optBoolean("on", true)) continue;
            String key = r.optString("key");
            JSONObject st = Store.state(c, key);
            boolean di = !st.has("img") || due(r.optJSONObject("img"), st.optLong("imgAt", 0), st.optString("imgPart", ""), now, part);
            if (di) apply(c, key, true, null, why);
        }
    }

    /** The screen just went off: change what is set to "every time the screen turns on". */
    static synchronized void runScreen(Context c) {
        long now = System.currentTimeMillis();
        if (now - lastScreenRun < 8_000L) return;
        lastScreenRun = now;
        Quotes.runScreen(c);
        JSONArray rots = Store.rotations(c);
        for (int i = 0; i < rots.length(); i++) {
            JSONObject r = rots.optJSONObject(i);
            if (r != null && r.optBoolean("on", true) && "screen".equals(mode(r, "img"))) apply(c, r.optString("key"), true, null, "screen");
        }
        runDue(c, "time");
    }

    static boolean wantsScreen(Context c) {
        JSONArray rots = Store.rotations(c);
        for (int i = 0; i < rots.length(); i++) {
            JSONObject r = rots.optJSONObject(i);
            if (r != null && r.optBoolean("on", true) && "screen".equals(mode(r, "img"))) return true;
        }
        return Quotes.wantsService(c);
    }

    /** When the next timed change is due (0 = nothing timed). */
    static long nextDue(Context c) {
        JSONArray rots = Store.rotations(c);
        long now = System.currentTimeMillis(), best = Quotes.nextDue(c, now);
        for (int i = 0; i < rots.length(); i++) {
            JSONObject r = rots.optJSONObject(i);
            if (r == null || !r.optBoolean("on", true)) continue;
            JSONObject st = Store.state(c, r.optString("key"));
            best = Math.min(best, nextFor(c, r.optJSONObject("img"), st.optLong("imgAt", now), now));
        }
        return best == Long.MAX_VALUE ? 0 : best;
    }

    /** Go back to the picture shown before on this rotation. */
    static synchronized boolean undo(Context c, String key) {
        JSONArray h = Store.history(c);
        String cur = Store.state(c, key).optString("img", "");
        for (int i = 0; i < h.length(); i++) {
            JSONObject e = h.optJSONObject(i);
            if (e == null || !key.equals(e.optString("key")) || e.optString("img").equals(cur) || e.optString("img").isEmpty()) continue;
            return apply(c, key, false, e.optString("img"), "undo");
        }
        return false;
    }
}
