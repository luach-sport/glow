package com.luachsport.glow;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.view.View;
import android.widget.RemoteViews;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Home-screen widget: the sentence, on top of any wallpaper (Glow's or the user's own).
 * In "every few seconds" mode the launcher flips the sentences by itself (AdapterViewFlipper), so the app
 * doesn't need to wake up. Tap the sentence = next one, heart = favourite, buttons = next sentence / new wallpaper / open Glow.
 */
public class GlowWidget extends AppWidgetProvider {
    static final String NEXT_WALL = "com.luachsport.glow.W_WALL";
    static final String NEXT_QUOTE = "com.luachsport.glow.W_QUOTE";
    static final String ITEM = "com.luachsport.glow.W_ITEM";

    @Override
    public void onUpdate(Context context, AppWidgetManager mgr, int[] ids) {
        for (int id : ids) mgr.updateAppWidget(id, views(context, id));
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        final String a = intent.getAction();
        if (!NEXT_WALL.equals(a) && !NEXT_QUOTE.equals(a) && !ITEM.equals(a)) return;
        final Context c = context.getApplicationContext();
        final String what = intent.getStringExtra("what"), qid = intent.getStringExtra("id");
        final PendingResult pr = goAsync();
        Engine.WORK.execute(() -> {
            try {
                if (ITEM.equals(a) && "fav".equals(what)) {
                    JSONObject q = Quotes.find(c, qid);
                    if (q != null) Store.toggleWidgetFav(c, qid, !isFav(c, q));
                    AppWidgetManager m = AppWidgetManager.getInstance(c);
                    m.notifyAppWidgetViewDataChanged(ids(c), R.id.glow_w_flip);
                } else if (NEXT_WALL.equals(a)) {
                    JSONArray rots = Store.rotations(c);
                    for (int i = 0; i < rots.length(); i++) { JSONObject r = rots.optJSONObject(i); if (r != null) Engine.apply(c, r.optString("key"), true, null, "widget"); }
                    Scheduler.scheduleNext(c);
                } else if ("seconds".equals(Quotes.mode(c))) {
                    RemoteViews rv = new RemoteViews(c.getPackageName(), R.layout.glow_widget);
                    rv.showNext(R.id.glow_w_flip);
                    AppWidgetManager.getInstance(c).partiallyUpdateAppWidget(ids(c), rv);
                } else {
                    Quotes.next(c, null, "widget");
                    Scheduler.scheduleNext(c);
                }
            } catch (Throwable ignored) { }
            pr.finish();
        });
    }

    static boolean isFav(Context c, JSONObject q) {
        if (q == null) return false;
        Boolean w = Store.widgetFav(c, q.optString("id"));
        return w != null ? w : q.optBoolean("fav", false);
    }

    static JSONObject look(Context c) {
        JSONObject w = Store.config(c).optJSONObject("widget");
        return w == null ? new JSONObject() : w;
    }

    static int background(String look) {
        switch (look) {
            case "dark": return R.drawable.glow_w_bg_dark;
            case "light": return R.drawable.glow_w_bg_light;
            case "clear": return R.drawable.glow_w_bg_clear;
            case "brand": return R.drawable.glow_w_bg_brand;
            default: return R.drawable.glow_w_bg_glass;
        }
    }

    private static PendingIntent action(Context c, String a, int code) {
        Intent i = new Intent(c, GlowWidget.class).setAction(a);
        return PendingIntent.getBroadcast(c, code, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static RemoteViews views(Context c, int widgetId) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.glow_widget);
        JSONObject w = look(c);
        v.setInt(R.id.glow_w_root, "setBackgroundResource", background(w.optString("look", "glass")));
        Intent svc = new Intent(c, GlowWidgetService.class).putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, widgetId);
        // Different data per settings version, so the launcher doesn't reuse an old list.
        svc.setData(Uri.parse("glow://widget/" + widgetId + "/" + Store.prefs(c).getLong("cfgVer", 0)));
        v.setRemoteAdapter(R.id.glow_w_flip, svc);
        v.setEmptyView(R.id.glow_w_flip, R.id.glow_w_empty);
        v.setInt(R.id.glow_w_flip, "setFlipInterval", Math.max(2, Quotes.cfg(c).optInt("seconds", 10)) * 1000);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 31 ? PendingIntent.FLAG_MUTABLE : 0);
        v.setPendingIntentTemplate(R.id.glow_w_flip, PendingIntent.getBroadcast(c, 30, new Intent(c, GlowWidget.class).setAction(ITEM), flags));
        if ("light".equals(w.optString("look", "glass"))) {
            for (int id : new int[] { R.id.glow_w_quote, R.id.glow_w_next, R.id.glow_w_open }) v.setInt(id, "setColorFilter", 0xFF6B23C9);
            v.setTextColor(R.id.glow_w_empty, 0xFF2A1446);
        }
        boolean buttons = w.optBoolean("buttons", true);
        v.setViewVisibility(R.id.glow_w_row, buttons ? View.VISIBLE : View.GONE);
        v.setViewVisibility(R.id.glow_w_next, Store.rotations(c).length() > 0 ? View.VISIBLE : View.GONE);
        v.setOnClickPendingIntent(R.id.glow_w_next, action(c, NEXT_WALL, 21));
        v.setOnClickPendingIntent(R.id.glow_w_quote, action(c, NEXT_QUOTE, 22));
        Intent open = c.getPackageManager().getLaunchIntentForPackage(c.getPackageName());
        if (open != null) {
            PendingIntent op = PendingIntent.getActivity(c, 24, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            v.setOnClickPendingIntent(R.id.glow_w_open, op);
            v.setOnClickPendingIntent(R.id.glow_w_empty, op);
        }
        return v;
    }

    static int[] ids(Context c) {
        try { return AppWidgetManager.getInstance(c).getAppWidgetIds(new ComponentName(c, GlowWidget.class)); } catch (Throwable t) { return new int[0]; }
    }

    static void refreshAll(Context c) {
        try {
            AppWidgetManager mgr = AppWidgetManager.getInstance(c);
            int[] ids = ids(c);
            if (ids == null || ids.length == 0) return;
            for (int id : ids) mgr.updateAppWidget(id, views(c, id));
            mgr.notifyAppWidgetViewDataChanged(ids, R.id.glow_w_flip);
        } catch (Throwable ignored) { }
    }
}
