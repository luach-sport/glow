package com.luachsport.glow;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** After a restart, an app update or a clock change: bring the alarm and the screen watcher back. */
public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        final Context c = context.getApplicationContext();
        final PendingResult pr = goAsync();
        Engine.WORK.execute(() -> {
            try { Engine.runDue(c, "time"); } catch (Throwable ignored) { }
            try { Scheduler.refresh(c); } catch (Throwable ignored) { }
            try { GlowWidget.refreshAll(c); } catch (Throwable ignored) { }
            pr.finish();
        });
    }
}
