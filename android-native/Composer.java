package com.luachsport.glow;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.Shader;
import android.graphics.Typeface;
import android.os.Build;
import android.text.Layout;
import android.text.StaticLayout;
import android.text.TextDirectionHeuristics;
import android.text.TextPaint;
import android.util.DisplayMetrics;
import android.view.WindowManager;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import org.json.JSONObject;

/**
 * Draws one wallpaper: the picture cropped to the screen, and the sentence on it in the user's design.
 * The same layout rules are used by the app's preview (www/js/engine/compose.js), so what you see is what you get.
 */
final class Composer {
    private static Typeface rubik, rubikBold;

    private Composer() { }

    /** The phone's real screen size, portrait. */
    static int[] screen(Context c) {
        DisplayMetrics dm = new DisplayMetrics();
        try {
            WindowManager wm = (WindowManager) c.getSystemService(Context.WINDOW_SERVICE);
            wm.getDefaultDisplay().getRealMetrics(dm);
        } catch (Exception e) {
            dm = c.getResources().getDisplayMetrics();
        }
        int w = Math.min(dm.widthPixels, dm.heightPixels), h = Math.max(dm.widthPixels, dm.heightPixels);
        if (w < 320 || h < 480) { w = 1080; h = 2160; }
        // Very large screens: keep memory low on small phones.
        if (w > 1440) { h = h * 1440 / w; w = 1440; }
        return new int[] { w, h };
    }

    static Bitmap compose(Context c, JSONObject img, String quote, JSONObject style, int w, int h) {
        Bitmap out = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
        Canvas cv = new Canvas(out);
        Bitmap src = img == null ? null : load(c, img, w, h);
        if (src != null) {
            float sw = src.getWidth(), sh = src.getHeight();
            float scale = Math.max(w / sw, h / sh);
            float cw = w / scale, ch = h / scale;
            Rect from = new Rect(Math.round((sw - cw) / 2f), Math.round((sh - ch) / 2f), Math.round((sw + cw) / 2f), Math.round((sh + ch) / 2f));
            Paint p = new Paint(Paint.FILTER_BITMAP_FLAG | Paint.ANTI_ALIAS_FLAG);
            cv.drawBitmap(src, from, new Rect(0, 0, w, h), p);
            src.recycle();
        } else {
            Paint p = new Paint();
            p.setShader(new LinearGradient(0, 0, 0, h, 0xFF3D1B63, 0xFFD94FA8, Shader.TileMode.CLAMP));
            cv.drawRect(0, 0, w, h, p);
        }
        if (quote != null && quote.trim().length() > 0) drawQuote(c, cv, quote.trim(), style == null ? new JSONObject() : style, w, h);
        return out;
    }

    private static Bitmap load(Context c, JSONObject img, int w, int h) {
        try {
            BitmapFactory.Options o = new BitmapFactory.Options();
            o.inJustDecodeBounds = true;
            try (InputStream in = open(c, img)) { BitmapFactory.decodeStream(in, null, o); }
            if (o.outWidth <= 0 || o.outHeight <= 0) return null;
            int sample = 1;
            while (o.outWidth / (sample * 2) >= w && o.outHeight / (sample * 2) >= h) sample *= 2;
            BitmapFactory.Options d = new BitmapFactory.Options();
            d.inSampleSize = sample;
            d.inPreferredConfig = Bitmap.Config.ARGB_8888;
            try (InputStream in = open(c, img)) { return BitmapFactory.decodeStream(in, null, d); }
        } catch (Throwable t) {
            return null;
        }
    }

    private static InputStream open(Context c, JSONObject img) throws Exception {
        String a = img.optString("a", "");
        if (a.length() > 0) return c.getAssets().open(a);
        return new FileInputStream(new File(c.getFilesDir(), img.optString("f", "")));
    }

    static float sizeFactor(String s) {
        switch (s) {
            case "s": return 0.050f;
            case "l": return 0.076f;
            case "xl": return 0.092f;
            default: return 0.062f;
        }
    }

    static float centerY(String pos) {
        switch (pos) {
            case "top": return 0.30f;
            case "bottom": return 0.70f;
            default: return 0.50f;
        }
    }

    private static Typeface face(Context c, String font, boolean bold) {
        if ("serif".equals(font)) return Typeface.create(Typeface.SERIF, bold ? Typeface.BOLD : Typeface.NORMAL);
        if ("sans".equals(font)) return Typeface.create(Typeface.SANS_SERIF, bold ? Typeface.BOLD : Typeface.NORMAL);
        try {
            if (bold && rubikBold != null) return rubikBold;
            if (!bold && rubik != null) return rubik;
            Typeface t;
            if (Build.VERSION.SDK_INT >= 26) {
                t = new Typeface.Builder(c.getAssets(), "public/fonts/Rubik-var.ttf").setFontVariationSettings("'wght' " + (bold ? 700 : 450)).build();
            } else {
                t = Typeface.create(Typeface.createFromAsset(c.getAssets(), "public/fonts/Rubik-var.ttf"), bold ? Typeface.BOLD : Typeface.NORMAL);
            }
            if (bold) rubikBold = t; else rubik = t;
            return t;
        } catch (Throwable e) {
            return Typeface.create(Typeface.SANS_SERIF, bold ? Typeface.BOLD : Typeface.NORMAL);
        }
    }

    static int color(String hex, int def) {
        try { return Color.parseColor(hex); } catch (Exception e) { return def; }
    }

    private static void drawQuote(Context c, Canvas cv, String text, JSONObject st, int w, int h) {
        TextPaint tp = new TextPaint(Paint.ANTI_ALIAS_FLAG);
        boolean bold = st.optBoolean("bold", true);
        tp.setTypeface(face(c, st.optString("font", "rubik"), bold));
        float size = w * sizeFactor(st.optString("size", "m"));
        tp.setTextSize(size);
        tp.setColor(color(st.optString("color", "#FFFFFF"), Color.WHITE));
        String band = st.optString("band", "dark");
        if (st.optBoolean("shadow", true) && "none".equals(band)) tp.setShadowLayer(size * 0.18f, 0, size * 0.05f, 0xAA000000);
        int width = Math.round(w * 0.80f);
        StaticLayout lay = StaticLayout.Builder.obtain(text, 0, text.length(), tp, width)
            .setAlignment(Layout.Alignment.ALIGN_CENTER)
            .setTextDirection(TextDirectionHeuristics.FIRSTSTRONG_RTL)
            .setLineSpacing(0, 1.18f)
            .setIncludePad(false)
            .build();
        float textH = lay.getHeight();
        float maxLine = 0;
        for (int i = 0; i < lay.getLineCount(); i++) maxLine = Math.max(maxLine, lay.getLineWidth(i));
        float cy = h * centerY(st.optString("pos", "middle"));
        float top = cy - textH / 2f;
        float left = (w - width) / 2f;
        if (!"none".equals(band)) {
            float padX = size * 0.9f, padY = size * 0.65f;
            RectF r = new RectF(w / 2f - maxLine / 2f - padX, top - padY, w / 2f + maxLine / 2f + padX, top + textH + padY);
            Paint bp = new Paint(Paint.ANTI_ALIAS_FLAG);
            bp.setColor("light".equals(band) ? 0x99FFFFFF : 0x73000000);
            cv.drawRoundRect(r, size * 0.8f, size * 0.8f, bp);
        }
        cv.save();
        cv.translate(left, top);
        lay.draw(cv);
        cv.restore();
    }
}
