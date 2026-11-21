package com.luachsport.glow;

import android.content.Context;
import android.content.SharedPreferences;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * What the engine keeps on the phone:
 *  - engine.json: the settings the web app sends (which pictures and sentences, when to change, the sentence design);
 *  - shared preferences: what is shown now on each screen, the shuffle "bags", the history and widget favourites.
 */
final class Store {
    private static final String PREFS = "glow_engine";
    private static final String CONFIG = "glow/engine.json";
    private static JSONObject cached;

    private Store() { }

    static SharedPreferences prefs(Context c) { return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE); }

    static synchronized JSONObject config(Context c) {
        if (cached != null) return cached;
        try {
            File f = new File(c.getFilesDir(), CONFIG);
            if (!f.exists()) return cached = new JSONObject();
            byte[] b = new byte[(int) f.length()];
            try (FileInputStream in = new FileInputStream(f)) {
                int off = 0;
                while (off < b.length) { int n = in.read(b, off, b.length - off); if (n < 0) break; off += n; }
            }
            cached = new JSONObject(new String(b, StandardCharsets.UTF_8));
        } catch (Exception e) {
            cached = new JSONObject();
        }
        return cached;
    }

    static synchronized void saveConfig(Context c, JSONObject cfg) throws Exception {
        File f = new File(c.getFilesDir(), CONFIG);
        File dir = f.getParentFile();
        if (dir != null && !dir.exists()) dir.mkdirs();
        File tmp = new File(f.getPath() + ".tmp");
        try (FileOutputStream out = new FileOutputStream(tmp)) { out.write(cfg.toString().getBytes(StandardCharsets.UTF_8)); }
        if (!tmp.renameTo(f)) { f.delete(); tmp.renameTo(f); }
        cached = cfg;
        prefs(c).edit().putLong("cfgVer", System.currentTimeMillis()).apply();
    }

    static JSONArray rotations(Context c) {
        JSONArray a = config(c).optJSONArray("rotations");
        return a == null ? new JSONArray() : a;
    }

    static JSONObject rotation(Context c, String key) {
        JSONArray a = rotations(c);
        for (int i = 0; i < a.length(); i++) {
            JSONObject r = a.optJSONObject(i);
            if (r != null && key.equals(r.optString("key"))) return r;
        }
        return null;
    }

    // ---------- live state per rotation ("both", "home", "lock") ----------
    static JSONObject state(Context c, String key) {
        try { return new JSONObject(prefs(c).getString("st_" + key, "{}")); } catch (Exception e) { return new JSONObject(); }
    }

    static void saveState(Context c, String key, JSONObject st) { prefs(c).edit().putString("st_" + key, st.toString()).apply(); }

    // ---------- history (newest first) ----------
    static JSONArray history(Context c) {
        try { return new JSONArray(prefs(c).getString("history", "[]")); } catch (Exception e) { return new JSONArray(); }
    }

    static void addHistory(Context c, String key, String img, String quote, String reason) {
        try {
            JSONArray old = history(c), out = new JSONArray();
            JSONObject h = new JSONObject();
            h.put("ts", System.currentTimeMillis()).put("key", key).put("img", img == null ? "" : img).put("quote", quote == null ? "" : quote).put("why", reason);
            out.put(h);
            for (int i = 0; i < old.length() && out.length() < 60; i++) out.put(old.get(i));
            prefs(c).edit().putString("history", out.toString()).apply();
        } catch (Exception ignored) { }
    }

    // ---------- favourites toggled on the widget, collected by the app ----------
    static synchronized void toggleWidgetFav(Context c, String quoteId, boolean fav) {
        try {
            JSONObject m = new JSONObject(prefs(c).getString("favs", "{}"));
            m.put(quoteId, fav);
            prefs(c).edit().putString("favs", m.toString()).apply();
        } catch (Exception ignored) { }
    }

    static synchronized JSONObject takeWidgetFavs(Context c) {
        JSONObject m;
        try { m = new JSONObject(prefs(c).getString("favs", "{}")); } catch (Exception e) { m = new JSONObject(); }
        prefs(c).edit().remove("favs").apply();
        return m;
    }

    static synchronized Boolean widgetFav(Context c, String quoteId) {
        try {
            JSONObject m = new JSONObject(prefs(c).getString("favs", "{}"));
            return m.has(quoteId) ? m.getBoolean(quoteId) : null;
        } catch (Exception e) { return null; }
    }
}
