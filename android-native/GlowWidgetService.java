package com.luachsport.glow;

import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.view.Gravity;
import android.widget.RemoteViews;
import android.widget.RemoteViewsService;
import java.util.ArrayList;
import java.util.List;
import org.json.JSONObject;

/** The sentences the widget shows: the whole list when it flips by itself, otherwise only the current one. */
public class GlowWidgetService extends RemoteViewsService {
    @Override
    public RemoteViewsFactory onGetViewFactory(Intent intent) { return new Factory(getApplicationContext()); }

    static final class Factory implements RemoteViewsFactory {
        private final Context c;
        private List<JSONObject> items = new ArrayList<>();
        private int color = Color.WHITE, gravity = Gravity.CENTER;

        Factory(Context c) { this.c = c; }

        @Override public void onCreate() { }
        @Override public void onDestroy() { items.clear(); }

        @Override
        public void onDataSetChanged() {
            List<JSONObject> out = new ArrayList<>();
            if (Quotes.on(c)) {
                if ("seconds".equals(Quotes.mode(c))) out = Quotes.flipList(c);
                else { JSONObject q = Quotes.current(c); if (q != null) out.add(q); }
            }
            items = out;
            JSONObject w = GlowWidget.look(c);
            String look = w.optString("look", "glass");
            color = Composer.color(w.optString("color", ""), "light".equals(look) ? 0xFF2A1446 : Color.WHITE);
            gravity = "right".equals(w.optString("align", "center")) ? (Gravity.CENTER_VERTICAL | Gravity.START) : Gravity.CENTER;
        }

        @Override public int getCount() { return items.size(); }

        @Override
        public RemoteViews getViewAt(int position) {
            RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.glow_w_item);
            if (position < 0 || position >= items.size()) return v;
            JSONObject q = items.get(position);
            v.setTextViewText(R.id.glow_w_text, q.optString("t"));
            v.setTextColor(R.id.glow_w_text, color);
            v.setInt(R.id.glow_w_text, "setGravity", gravity);
            boolean fav = GlowWidget.isFav(c, q);
            v.setImageViewResource(R.id.glow_w_fav, fav ? R.drawable.glow_w_heart_on : R.drawable.glow_w_heart);
            if (!fav) v.setInt(R.id.glow_w_fav, "setColorFilter", color);
            v.setOnClickFillInIntent(R.id.glow_w_fav, new Intent().putExtra("what", "fav").putExtra("id", q.optString("id")));
            v.setOnClickFillInIntent(R.id.glow_w_text, new Intent().putExtra("what", "next").putExtra("id", q.optString("id")));
            return v;
        }

        @Override public RemoteViews getLoadingView() { return null; }
        @Override public int getViewTypeCount() { return 1; }
        @Override public long getItemId(int position) { return position < items.size() ? items.get(position).optString("id").hashCode() : position; }
        @Override public boolean hasStableIds() { return true; }
    }
}
