package app.focusvault

import android.app.Application
import app.focusvault.schedule.WindowScheduler

class VaultApp : Application() {
    override fun onCreate() {
        super.onCreate()
        // Re-arm the alarm window on every cold start.
        WindowScheduler.scheduleDaily(this)
    }
}
