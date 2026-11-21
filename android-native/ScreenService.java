package com.luachsport.glow;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;
import org.json.JSONObject;

/**
 * Runs only when needed: "every time the screen turns on" (the change happens when the screen turns OFF, so the
 * new one is waiting next time), and the sentence on the lock screen as a quiet notification.
 * Android lets an app hear the screen go on and off only while it runs, with a notification – so when the user
 * chose the lock-screen sentence, that notification IS the sentence.
 */
public class ScreenService extends Service {
    static final String CH_QUIET = "glow_screen";
    static final String CH_QUOTE = "glow_quote";
    static final int ID = 11;
    static volatile boolean running = false;
    private BroadcastReceiver receiver;

    static void start(Context c) {
        Intent i = new Intent(c, ScreenService.class);
        try {
            if (Build.VERSION.SDK_INT >= 26) c.startForegroundService(i); else c.startService(i);
        } catch (Throwable t) {
            android.util.Log.w("Glow", "screen service not started", t);
        }
    }

    static void stop(Context c) {
        if (!running) return;
        try { c.stopService(new Intent(c, ScreenService.class)); } catch (Throwable ignored) { }
    }

    /** The sentence changed: show the new one in the notification. */
    static void refreshNotification(Context c) {
        if (!running) return;
        try {
            NotificationManager nm = (NotificationManager) c.getSystemService(NOTIFICATION_SERVICE);
            if (nm != null) nm.notify(ID, build(c));
        } catch (Throwable ignored) { }
    }

    private static void channels(Context c) {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager nm = (NotificationManager) c.getSystemService(NOTIFICATION_SERVICE);
        if (nm == null) return;
        if (nm.getNotificationChannel(CH_QUIET) == null) {
            NotificationChannel ch = new NotificationChannel(CH_QUIET, "Glow ברקע", NotificationManager.IMPORTANCE_MIN);
            ch.setDescription("הודעה שקטה שמאפשרת ל-Glow להחליף בכל הדלקת מסך");
            ch.setShowBadge(false);
            nm.createNotificationChannel(ch);
        }
        if (nm.getNotificationChannel(CH_QUOTE) == null) {
            NotificationChannel ch = new NotificationChannel(CH_QUOTE, "המשפט במסך הנעילה", NotificationManager.IMPORTANCE_LOW);
            ch.setDescription("המשפט של Glow, כדי שיופיע במסך הנעילה. בלי צליל ובלי רטט");
            ch.setShowBadge(false);
            ch.setSound(null, null);
            ch.enableVibration(false);
            ch.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            nm.createNotificationChannel(ch);
        }
    }

    static Notification build(Context c) {
        channels(c);
        boolean quote = Quotes.on(c) && "notification".equals(Quotes.lock(c));
        JSONObject q = quote ? Quotes.current(c) : null;
        String ch = q != null ? CH_QUOTE : CH_QUIET;
        Intent open = c.getPackageManager().getLaunchIntentForPackage(c.getPackageName());
        PendingIntent pi = open == null ? null : PendingIntent.getActivity(c, 1, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(c, ch) : new Notification.Builder(c);
        b.setSmallIcon(R.drawable.ic_stat_glow).setOngoing(true).setShowWhen(false).setOnlyAlertOnce(true);
        if (q != null) {
            String t = q.optString("t");
            b.setContentTitle(t).setContentText("Glow ✨").setStyle(new Notification.BigTextStyle().bigText(t)).setVisibility(Notification.VISIBILITY_PUBLIC);
            if (Build.VERSION.SDK_INT >= 21) b.setColor(0xFF7A2FD8);
            if (Build.VERSION.SDK_INT < 26) b.setPriority(Notification.PRIORITY_LOW);
        } else {
            b.setContentTitle("Glow פועל").setContentText("רקע ומשפט חדשים בכל הדלקת מסך");
            if (Build.VERSION.SDK_INT < 26) b.setPriority(Notification.PRIORITY_MIN);
        }
        if (pi != null) b.setContentIntent(pi);
        return b.build();
    }

    @Override
    public void onCreate() {
        super.onCreate();
        running = true;
        goForeground();
        receiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                final Context c = context.getApplicationContext();
                Engine.WORK.execute(() -> {
                    try { Engine.runScreen(c); } catch (Throwable ignored) { }
                    try { Scheduler.scheduleNext(c); } catch (Throwable ignored) { }
                });
            }
        };
        IntentFilter f = new IntentFilter(Intent.ACTION_SCREEN_OFF);
        if (Build.VERSION.SDK_INT >= 33) registerReceiver(receiver, f, Context.RECEIVER_NOT_EXPORTED);
        else registerReceiver(receiver, f);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        goForeground();
        if (!Engine.wantsScreen(getApplicationContext())) { stopSelf(); return START_NOT_STICKY; }
        return START_STICKY;
    }

    private void goForeground() {
        Notification n = build(this);
        try {
            if (Build.VERSION.SDK_INT >= 34) startForeground(ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
            else startForeground(ID, n);
        } catch (Throwable t) {
            android.util.Log.w("Glow", "foreground failed", t);
        }
    }

    @Override
    public void onDestroy() {
        running = false;
        try { if (receiver != null) unregisterReceiver(receiver); } catch (Throwable ignored) { }
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }
}
