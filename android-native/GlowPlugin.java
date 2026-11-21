package com.luachsport.glow;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import org.json.JSONArray;
import org.json.JSONObject;

/** The web app's door to the wallpaper engine (www/js/engine/bridge.js). */
@CapacitorPlugin(name = "GlowWall", permissions = { @Permission(alias = "notifications", strings = { Manifest.permission.POST_NOTIFICATIONS }) })
public class GlowPlugin extends Plugin {

    private Context ctx() { return getContext().getApplicationContext(); }

    private JSObject status() {
        Context c = ctx();
        JSObject o = new JSObject();
        try {
            JSONObject rots = new JSONObject();
            JSONArray a = Store.rotations(c);
            for (int i = 0; i < a.length(); i++) {
                JSONObject r = a.optJSONObject(i);
                if (r == null) continue;
                JSONObject st = Store.state(c, r.optString("key"));
                JSONObject s = new JSONObject();
                s.put("img", st.optString("img", "")).put("quote", st.optString("quote", "")).put("imgAt", st.optLong("imgAt", 0)).put("quoteAt", st.optLong("quoteAt", 0));
                rots.put(r.optString("key"), s);
            }
            o.put("rotations", rots);
            o.put("history", Store.history(c));
            o.put("screenService", ScreenService.running);
            o.put("nextAt", Engine.nextDue(c));
            o.put("part", Engine.partNow(c));
            o.put("sdk", Build.VERSION.SDK_INT);
            o.put("canLock", Build.VERSION.SDK_INT >= 24);
            o.put("maker", Build.MANUFACTURER);
            int[] sz = Composer.screen(c);
            o.put("w", sz[0]).put("h", sz[1]);
            PowerManager pm = (PowerManager) c.getSystemService(Context.POWER_SERVICE);
            o.put("batteryFree", pm != null && pm.isIgnoringBatteryOptimizations(c.getPackageName()));
            o.put("notifications", Build.VERSION.SDK_INT < 33 || getPermissionState("notifications") == PermissionState.GRANTED);
        } catch (Exception ignored) { }
        return o;
    }

    @PluginMethod
    public void status(PluginCall call) { call.resolve(status()); }

    /** New settings from the app. Sets a first wallpaper if nothing was set yet. */
    @PluginMethod
    public void sync(PluginCall call) {
        JSObject cfg = call.getObject("config");
        if (cfg == null) { call.reject("no config"); return; }
        final boolean applyNow = call.getBoolean("apply", false);
        Engine.WORK.execute(() -> {
            try {
                Context c = ctx();
                Store.saveConfig(c, new JSONObject(cfg.toString()));
                JSONArray rots = Store.rotations(c);
                for (int i = 0; i < rots.length(); i++) {
                    JSONObject r = rots.optJSONObject(i);
                    if (r == null || !r.optBoolean("on", true)) continue;
                    String key = r.optString("key");
                    boolean fresh = !Store.state(c, key).has("img");
                    if (applyNow || fresh) Engine.apply(c, key, false, false, null, null, "settings");
                }
                Scheduler.refresh(c);
                GlowWidget.refreshAll(c);
                call.resolve(status());
            } catch (Throwable t) {
                call.reject("sync failed: " + t.getMessage());
            }
        });
    }

    /** "Change now": a new picture and/or sentence on one rotation (or all of them). */
    @PluginMethod
    public void change(PluginCall call) {
        final String key = call.getString("key", null);
        final boolean img = call.getBoolean("image", true), quote = call.getBoolean("quote", true);
        Engine.WORK.execute(() -> {
            Context c = ctx();
            boolean ok = false;
            JSONArray rots = Store.rotations(c);
            for (int i = 0; i < rots.length(); i++) {
                JSONObject r = rots.optJSONObject(i);
                if (r == null) continue;
                String k = r.optString("key");
                if (key != null && !key.equals(k)) continue;
                ok |= Engine.apply(c, k, img, quote, null, null, "manual");
            }
            Scheduler.scheduleNext(c);
            JSObject s = status();
            s.put("ok", ok);
            call.resolve(s);
        });
    }

    /** Put a specific picture and/or sentence now (from the gallery, the list of sentences or the history). */
    @PluginMethod
    public void setNow(PluginCall call) {
        final String key = call.getString("key", null), img = call.getString("img", null), quote = call.getString("quote", null);
        final JSObject imgEntry = call.getObject("imgEntry"), quoteEntry = call.getObject("quoteEntry");
        Engine.WORK.execute(() -> {
            Context c = ctx();
            boolean ok = false;
            JSONArray rots = Store.rotations(c);
            // A picture or sentence outside the rotation's album / set: add it, so it can be shown now.
            try {
                boolean grew = false;
                for (int i = 0; i < rots.length(); i++) {
                    JSONObject r = rots.optJSONObject(i);
                    if (r == null || (key != null && !key.equals(r.optString("key")))) continue;
                    if (img != null && imgEntry != null && Engine.findImage(r, img) == null) { r.getJSONArray("images").put(new JSONObject(imgEntry.toString())); grew = true; }
                    if (quote != null && quoteEntry != null && Engine.findQuote(r, quote) == null && r.optJSONArray("quotes") != null) { r.getJSONArray("quotes").put(new JSONObject(quoteEntry.toString())); grew = true; }
                }
                if (grew) Store.saveConfig(c, Store.config(c));
            } catch (Exception ignored) { }
            for (int i = 0; i < rots.length(); i++) {
                JSONObject r = rots.optJSONObject(i);
                if (r == null) continue;
                String k = r.optString("key");
                if (key != null && !key.equals(k)) continue;
                ok |= Engine.apply(c, k, false, false, img, quote, "manual");
            }
            JSObject s = status();
            s.put("ok", ok);
            call.resolve(s);
        });
    }

    @PluginMethod
    public void undo(PluginCall call) {
        final String key = call.getString("key", "both");
        Engine.WORK.execute(() -> {
            boolean ok = Engine.undo(ctx(), key);
            JSObject s = status();
            s.put("ok", ok);
            call.resolve(s);
        });
    }

    /** Hearts pressed on the widget since the app last asked: { quoteId: true/false }. */
    @PluginMethod
    public void takeFavs(PluginCall call) {
        JSObject o = new JSObject();
        try { o.put("favs", Store.takeWidgetFavs(ctx())); } catch (Exception ignored) { }
        call.resolve(o);
    }

    @PluginMethod
    public void askNotifications(PluginCall call) {
        if (Build.VERSION.SDK_INT < 33 || getPermissionState("notifications") == PermissionState.GRANTED) { call.resolve(status()); return; }
        requestPermissionForAlias("notifications", call, "notifCallback");
    }

    @PermissionCallback
    private void notifCallback(PluginCall call) {
        if (Engine.wantsScreen(ctx())) ScreenService.start(ctx());
        call.resolve(status());
    }

    /** Let Glow run in the background without the battery saver stopping it (some phones need this). */
    @PluginMethod
    public void openBattery(PluginCall call) {
        Context c = getContext();
        try {
            Intent i = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, Uri.parse("package:" + c.getPackageName()));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            c.startActivity(i);
        } catch (Exception e) {
            try {
                Intent i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + c.getPackageName()));
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                c.startActivity(i);
            } catch (Exception ignored) { }
        }
        call.resolve();
    }

    /** Ask the launcher to add the widget (Android 8+, where the launcher supports it). */
    @PluginMethod
    public void pinWidget(PluginCall call) {
        boolean ok = false;
        try {
            if (Build.VERSION.SDK_INT >= 26) {
                android.appwidget.AppWidgetManager m = android.appwidget.AppWidgetManager.getInstance(getContext());
                if (m.isRequestPinAppWidgetSupported()) ok = m.requestPinAppWidget(new android.content.ComponentName(getContext(), GlowWidget.class), null, null);
            }
        } catch (Exception ignored) { }
        JSObject o = new JSObject();
        o.put("ok", ok);
        call.resolve(o);
    }
}
