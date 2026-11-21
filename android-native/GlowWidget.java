package com.luachsport.glow;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.widget.RemoteViews;
import org.json.JSONArray;
import org.json.JSONObject;

/** Home-screen widget: today's sentence, and buttons for a new wallpaper, a new sentence and a heart. */
public class GlowWidget extends AppWidgetProvider {
    static final String NEXT_ALL = "com.luachsport.glow.W_NEXT";
    static final String NEXT_QUOTE = "com.luachsport.glow.W_QUOTE";
    static final String FAV = "com.luachsport.glow.W_FAV";

    @Override
    public void onUpdate(Context context, AppWidgetManager mgr, int[] ids) {
        for (int id : ids) mgr.updateAppWidget(id, views(context));
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        final String a = intent.getAction();
        if (!NEXT_ALL.equals(a) && !NEXT_QUOTE.equals(a) && !FAV.equals(a)) return;
        final Context c = context.getApplicationContext();
        final PendingResult pr = goAsync();
        Engine.WORK.execute(() -> {
            try {
                if (FAV.equals(a)) toggleFav(c);
                else {
                    JSONArray rots = Store.rotations(c);
                    for (int i = 0; i < rots.length(); i++) {
                        JSONObject r = rots.optJSONObject(i);
                        if (r == null) continue;
                        Engine.apply(c, r.optString("key"), NEXT_ALL.equals(a), true, null, null, "widget");
                    }
                    Scheduler.scheduleNext(c);
                }
                refreshAll(c);
            } catch (Throwable ignored) { }
            pr.finish();
        });
    }

    /** The rotation the widget shows: the shared one, or the lock screen's when they are separate. */
    static String mainKey(Context c) {
        JSONArray rots = Store.rotations(c);
        String first = null;
        for (int i = 0; i < rots.length(); i++) {
            JSONObject r = rots.optJSONObject(i);
            if (r == null) continue;
            if (first == null) first = r.optString("key");
            if (Engine.quoteOn(r) && "lock".equals(r.optString("key"))) return "lock";
        }
        return first == null ? "both" : first;
    }

    static JSONObject currentQuote(Context c) {
        String key = mainKey(c);
        JSONObject rot = Store.rotation(c, key);
        if (rot == null) return null;
        return Engine.findQuote(rot, Store.state(c, key).optString("quote", null));
    }

    static boolean isFav(Context c, JSONObject q) {
        if (q == null) return false;
        Boolean w = Store.widgetFav(c, q.optString("id"));
        return w != null ? w : q.optBoolean("fav", false);
    }

    private static void toggleFav(Context c) {
        JSONObject q = currentQuote(c);
        if (q == null) return;
        Store.toggleWidgetFav(c, q.optString("id"), !isFav(c, q));
    }

    private static PendingIntent action(Context c, String a, int code) {
        Intent i = new Intent(c, GlowWidget.class).setAction(a);
        return PendingIntent.getBroadcast(c, code, i, PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0));
    }

    static RemoteViews views(Context c) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.glow_widget);
        JSONObject q = currentQuote(c);
        v.setTextViewText(R.id.glow_w_text, q == null ? "רקע חדש. כוח חדש." : q.optString("t"));
        v.setImageViewResource(R.id.glow_w_fav, isFav(c, q) ? R.drawable.glow_w_heart_on : R.drawable.glow_w_heart);
        v.setOnClickPendingIntent(R.id.glow_w_next, action(c, NEXT_ALL, 21));
        v.setOnClickPendingIntent(R.id.glow_w_quote, action(c, NEXT_QUOTE, 22));
        v.setOnClickPendingIntent(R.id.glow_w_fav, action(c, FAV, 23));
        Intent open = c.getPackageManager().getLaunchIntentForPackage(c.getPackageName());
        if (open != null) v.setOnClickPendingIntent(R.id.glow_w_text, PendingIntent.getActivity(c, 24, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
        return v;
    }

    static void refreshAll(Context c) {
        try {
            AppWidgetManager mgr = AppWidgetManager.getInstance(c);
            int[] ids = mgr.getAppWidgetIds(new ComponentName(c, GlowWidget.class));
            if (ids == null || ids.length == 0) return;
            RemoteViews v = views(c);
            for (int id : ids) mgr.updateAppWidget(id, v);
        } catch (Throwable ignored) { }
    }
}
