package com.luachsport.glow;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** The timed alarm: change what is due, then set the next alarm. */
public class AlarmReceiver extends BroadcastReceiver {
    static final String ACTION = "com.luachsport.glow.TICK";

    @Override
    public void onReceive(Context context, Intent intent) {
        final Context c = context.getApplicationContext();
        final PendingResult pr = goAsync();
        Engine.WORK.execute(() -> {
            try { Engine.runDue(c, "time"); } catch (Throwable ignored) { }
            try { Scheduler.refresh(c); } catch (Throwable ignored) { }
            pr.finish();
        });
    }
}
