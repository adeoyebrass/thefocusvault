package app.focusvault.boot

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import app.focusvault.schedule.WindowScheduler
import app.focusvault.ui.KioskActivity

/** Re-arms the focus window and re-launches the kiosk after every boot. */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        WindowScheduler.scheduleDaily(context)

        // If we're inside the window right now, jump straight to the kiosk.
        if (WindowScheduler.isWithinWindow(context)) {
            val i = Intent(context, KioskActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            }
            context.startActivity(i)
        }
    }
}
