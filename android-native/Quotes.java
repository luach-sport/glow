package com.luachsport.glow;

import android.content.Context;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * The sentence, separate from the wallpapers: it shows in the home-screen widget, optionally in a quiet
 * notification on the lock screen, and optionally printed on Glow's lock wallpaper.
 * Modes: "seconds" (the widget itself flips every few seconds), "interval", "screen", "parts", "manual".
 * Order: "random" (shuffled bag) or "list" (the user's order, one after another).
 */
final class Quotes {
    private Quotes() { }

    static JSONObject cfg(Context c) {
        JSONObject q = Store.config(c).optJSONObject("quotes");
        return q == null ? new JSONObject() : q;
    }

    static boolean on(Context c) { return cfg(c).optBoolean("on", true) && list(c).length() > 0; }
    static String mode(Context c) { return cfg(c).optString("mode", "seconds"); }
    static String lock(Context c) { return cfg(c).optString("lock", "off"); }
    static boolean random(Context c) { return !"list".equals(cfg(c).optString("order", "random")); }

    static JSONArray list(Context c) {
        JSONArray a = cfg(c).optJSONArray("list");
        return a == null ? new JSONArray() : a;
    }

    static JSONObject find(Context c, String id) {
        if (id == null) return null;
        JSONArray a = list(c);
        for (int i = 0; i < a.length(); i++) { JSONObject o = a.optJSONObject(i); if (o != null && id.equals(o.optString("id"))) return o; }
        return null;
    }

    static int indexOf(Context c, String id) {
        JSONArray a = list(c);
        for (int i = 0; i < a.length(); i++) { JSONObject o = a.optJSONObject(i); if (o != null && o.optString("id").equals(id)) return i; }
        return -1;
    }

    static JSONObject state(Context c) { return Store.state(c, "quote"); }

    /** The sentence shown now (the first one before any change). */
    static JSONObject current(Context c) {
        JSONObject q = find(c, state(c).optString("id", null));
        if (q != null) return q;
        JSONArray a = list(c);
        return a.length() > 0 ? a.optJSONObject(0) : null;
    }

    /** The widget's flipping list: the user's order, or a shuffle that stays the same until the next change of settings. */
    static List<JSONObject> flipList(Context c) {
        JSONArray a = list(c);
        List<JSONObject> out = new ArrayList<>();
        for (int i = 0; i < a.length(); i++) { JSONObject o = a.optJSONObject(i); if (o != null) out.add(o); }
        if (random(c)) Collections.shuffle(out, new Random(state(c).optLong("seed", 7)));
        // Start from the sentence shown now.
        JSONObject cur = current(c);
        if (cur != null) {
            for (int i = 0; i < out.size(); i++) if (out.get(i).optString("id").equals(cur.optString("id"))) { Collections.rotate(out, -i); break; }
        }
        return out;
    }

    /** A new sentence (or exactly forceId). Updates the widget, the lock-screen notification and a lock wallpaper that carries it. */
    static boolean next(Context c, String forceId, String why) {
        JSONArray a = list(c);
        if (a.length() == 0) return false;
        JSONObject st = state(c);
        String cur = st.optString("id", null), id;
        if (forceId != null && find(c, forceId) != null) id = forceId;
        else if (!random(c)) {
            int i = indexOf(c, cur);
            id = a.optJSONObject((i + 1) % a.length()).optString("id");
        } else {
            List<String> pool = new ArrayList<>();
            for (int i = 0; i < a.length(); i++) pool.add(a.optJSONObject(i).optString("id"));
            id = Engine.pick(st, "bag", pool, cur);
        }
        long now = System.currentTimeMillis();
        try { st.put("id", id).put("at", now).put("part", Engine.partAt(c, now)); } catch (Exception ignored) { }
        Store.saveState(c, "quote", st);
        Store.addHistory(c, "quote", "", id, why);
        afterChange(c);
        return true;
    }

    static void afterChange(Context c) {
        GlowWidget.refreshAll(c);
        ScreenService.refreshNotification(c);
        Engine.redrawBaked(c);
    }

    /** New settings: new shuffle for the widget, and start counting time from now. */
    static void resetSeed(Context c) {
        JSONObject st = state(c);
        try { st.put("seed", Engine.RND.nextLong()); if (!st.has("at")) st.put("at", System.currentTimeMillis()).put("part", Engine.partNow(c)); } catch (Exception ignored) { }
        Store.saveState(c, "quote", st);
    }

    static void runDue(Context c, long now, String part) {
        if (!on(c)) return;
        JSONObject st = state(c);
        if (Engine.due(cfg(c), st.optLong("at", 0), st.optString("part", ""), now, part)) next(c, null, "time");
    }

    static void runScreen(Context c) {
        if (!on(c)) return;
        String m = mode(c);
        // "Every few seconds" is done by the widget itself; the lock screen still gets a new one each time.
        if ("screen".equals(m) || ("seconds".equals(m) && !"off".equals(lock(c)))) next(c, null, "screen");
    }

    static boolean wantsService(Context c) {
        if (!on(c)) return false;
        String m = mode(c), l = lock(c);
        return "screen".equals(m) || "notification".equals(l) || ("seconds".equals(m) && "wallpaper".equals(l));
    }

    static long nextDue(Context c, long now) {
        if (!on(c)) return Long.MAX_VALUE;
        return Engine.nextFor(c, cfg(c), state(c).optLong("at", now), now);
    }
}
