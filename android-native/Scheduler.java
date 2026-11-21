package com.luachsport.glow;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

/** Sets one alarm for the next timed change, and starts or stops the screen watcher. */
final class Scheduler {
    private Scheduler() { }

    static void refresh(Context c) {
        scheduleNext(c);
        if (Engine.wantsScreen(c)) ScreenService.start(c); else ScreenService.stop(c);
    }

    static void scheduleNext(Context c) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        Intent i = new Intent(c, AlarmReceiver.class).setAction(AlarmReceiver.ACTION);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0);
        PendingIntent pi = PendingIntent.getBroadcast(c, 7, i, flags);
        long at = Engine.nextDue(c);
        am.cancel(pi);
        if (at <= 0) return;
        // Inexact on purpose (no special permission, kind to the battery); Android may delay it by a few minutes.
        if (Build.VERSION.SDK_INT >= 23) am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
        else am.set(AlarmManager.RTC_WAKEUP, at, pi);
    }
}
