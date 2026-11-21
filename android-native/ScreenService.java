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

/**
 * Needed only for "every time the screen turns on". Android lets an app hear the screen go on and off only
 * while it runs, so this small service stays on with a quiet notification. The change happens when the
 * screen turns OFF, so the new wallpaper is already there the next time you look.
 */
public class ScreenService extends Service {
    static final String CHANNEL = "glow_screen";
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
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 26 && nm != null && nm.getNotificationChannel(CHANNEL) == null) {
            NotificationChannel ch = new NotificationChannel(CHANNEL, "החלפה בכל הדלקת מסך", NotificationManager.IMPORTANCE_MIN);
            ch.setDescription("הודעה שקטה שמאפשרת ל-Glow להחליף רקע בכל הדלקת מסך");
            ch.setShowBadge(false);
            nm.createNotificationChannel(ch);
        }
        Intent open = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent pi = open == null ? null : PendingIntent.getActivity(this, 1, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(this, CHANNEL) : new Notification.Builder(this);
        b.setSmallIcon(R.drawable.ic_stat_glow)
            .setContentTitle("Glow פועל")
            .setContentText("רקע ומשפט חדשים בכל הדלקת מסך")
            .setOngoing(true)
            .setShowWhen(false);
        if (Build.VERSION.SDK_INT < 26) b.setPriority(Notification.PRIORITY_MIN);
        if (pi != null) b.setContentIntent(pi);
        Notification n = b.build();
        try {
            if (Build.VERSION.SDK_INT >= 34) startForeground(11, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
            else startForeground(11, n);
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
