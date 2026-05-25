package app.focusvault.admin

import android.app.admin.DeviceAdminReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.util.Log
import app.focusvault.schedule.WindowScheduler

/**
 * Device Owner callback surface. Once provisioned via
 *   adb shell dpm set-device-owner app.focusvault/.admin.VaultDeviceAdminReceiver
 * this receiver is the only authority that can apply kiosk policy.
 */
class VaultDeviceAdminReceiver : DeviceAdminReceiver() {

    override fun onEnabled(context: Context, intent: Intent) {
        Log.i(TAG, "Device admin enabled — applying kiosk policy")
        KioskPolicy.apply(context, componentName(context))
        WindowScheduler.scheduleDaily(context)
    }

    override fun onProfileProvisioningComplete(context: Context, intent: Intent) {
        Log.i(TAG, "Provisioning complete")
        KioskPolicy.apply(context, componentName(context))
    }

    override fun onLockTaskModeEntering(context: Context, intent: Intent, pkg: String) {
        Log.i(TAG, "Lock task ENTERING for $pkg")
    }

    override fun onLockTaskModeExiting(context: Context, intent: Intent) {
        Log.i(TAG, "Lock task EXITING")
    }

    companion object {
        private const val TAG = "VaultAdmin"
        fun componentName(ctx: Context) =
            ComponentName(ctx, VaultDeviceAdminReceiver::class.java)
    }
}
