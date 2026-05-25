package app.focusvault.schedule

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import app.focusvault.ui.KioskActivity
import java.util.Calendar

/**
 * Daily exact-alarm scheduler for the focus window (default 09:00 → 17:00).
 * Times are loaded from SharedPreferences so the team-lead's web config
 * can be pushed via FCM and persisted here.
 */
object WindowScheduler {
    private const val PREFS = "vault_window"
    private const val K_START_HOUR = "start_h"
    private const val K_START_MIN = "start_m"
    private const val K_END_HOUR = "end_h"
    private const val K_END_MIN = "end_m"

    private const val REQ_START = 1001
    private const val REQ_END = 1002

    fun setWindow(ctx: Context, startH: Int, startM: Int, endH: Int, endM: Int) {
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().apply {
            putInt(K_START_HOUR, startH); putInt(K_START_MIN, startM)
            putInt(K_END_HOUR, endH); putInt(K_END_MIN, endM)
        }.apply()
        scheduleDaily(ctx)
    }

    fun scheduleDaily(ctx: Context) {
        val (sh, sm, eh, em) = window(ctx)
        val am = ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        am.setInexactRepeating(
            AlarmManager.RTC_WAKEUP,
            nextOccurrence(sh, sm),
            AlarmManager.INTERVAL_DAY,
            kioskIntent(ctx, REQ_START)
        )
        am.setInexactRepeating(
            AlarmManager.RTC_WAKEUP,
            nextOccurrence(eh, em),
            AlarmManager.INTERVAL_DAY,
            releaseIntent(ctx, REQ_END)
        )
    }

    fun isWithinWindow(ctx: Context): Boolean {
        val (sh, sm, eh, em) = window(ctx)
        val now = Calendar.getInstance()
        val mins = now.get(Calendar.HOUR_OF_DAY) * 60 + now.get(Calendar.MINUTE)
        return mins in (sh * 60 + sm)..(eh * 60 + em)
    }

    private fun window(ctx: Context): IntArray {
        val p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        return intArrayOf(
            p.getInt(K_START_HOUR, 9), p.getInt(K_START_MIN, 0),
            p.getInt(K_END_HOUR, 17), p.getInt(K_END_MIN, 0),
        )
    }

    private fun nextOccurrence(h: Int, m: Int): Long {
        val c = Calendar.getInstance()
        c.set(Calendar.HOUR_OF_DAY, h)
        c.set(Calendar.MINUTE, m)
        c.set(Calendar.SECOND, 0)
        if (c.timeInMillis <= System.currentTimeMillis()) {
            c.add(Calendar.DAY_OF_YEAR, 1)
        }
        return c.timeInMillis
    }

    private fun kioskIntent(ctx: Context, req: Int): PendingIntent {
        val i = Intent(ctx, KioskActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            action = "app.focusvault.ACTION_START_KIOSK"
        }
        return PendingIntent.getActivity(
            ctx, req, i,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }

    private fun releaseIntent(ctx: Context, req: Int): PendingIntent {
        val i = Intent("app.focusvault.ACTION_RELEASE").setPackage(ctx.packageName)
        return PendingIntent.getBroadcast(
            ctx, req, i,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }
}
