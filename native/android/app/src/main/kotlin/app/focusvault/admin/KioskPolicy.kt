package app.focusvault.admin

import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.os.UserManager
import android.util.Log
import app.focusvault.ui.KioskActivity

/** Centralised Device Owner policy. Idempotent — safe to call repeatedly. */
object KioskPolicy {
    private const val TAG = "KioskPolicy"

    fun apply(context: Context, admin: ComponentName) {
        val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        if (!dpm.isDeviceOwnerApp(context.packageName)) {
            Log.w(TAG, "Not Device Owner yet — run: adb shell dpm set-device-owner ${context.packageName}/${VaultDeviceAdminReceiver::class.java.name}")
            return
        }

        // 1. Whitelist self for Lock Task Mode (kiosk).
        dpm.setLockTaskPackages(admin, arrayOf(context.packageName))

        // 2. Become the persistent HOME launcher so the kiosk draws on boot
        //    BEFORE the user can reach any other app.
        val home = IntentFilter(Intent.ACTION_MAIN).apply {
            addCategory(Intent.CATEGORY_HOME)
            addCategory(Intent.CATEGORY_DEFAULT)
        }
        val activity = ComponentName(context, KioskActivity::class.java)
        dpm.addPersistentPreferredActivity(admin, home, activity)

        // 3. Hard restrictions — these survive reboot & cannot be toggled in Settings.
        listOf(
            UserManager.DISALLOW_FACTORY_RESET,
            UserManager.DISALLOW_SAFE_BOOT,
            UserManager.DISALLOW_ADD_USER,
            UserManager.DISALLOW_INSTALL_APPS,
            UserManager.DISALLOW_UNINSTALL_APPS,
            UserManager.DISALLOW_ADJUST_VOLUME,
            UserManager.DISALLOW_MOUNT_PHYSICAL_MEDIA,
            UserManager.DISALLOW_DEBUGGING_FEATURES,
        ).forEach { dpm.addUserRestriction(admin, it) }

        // 4. Kiosk feature mask — what's allowed to render during lock task.
        dpm.setLockTaskFeatures(
            admin,
            DevicePolicyManager.LOCK_TASK_FEATURE_KEYGUARD or
                DevicePolicyManager.LOCK_TASK_FEATURE_HOME or
                DevicePolicyManager.LOCK_TASK_FEATURE_NOTIFICATIONS.inv() and 0
        )

        // 5. Make uninstall impossible.
        dpm.setUninstallBlocked(admin, context.packageName, true)

        // 6. Disable the device camera & Bluetooth pairing flows.
        dpm.setCameraDisabled(admin, true)
        dpm.setKeyguardDisabledFeatures(
            admin,
            DevicePolicyManager.KEYGUARD_DISABLE_FEATURES_ALL
        )

        // 7. Pin the launcher activity so HOME-press has nowhere else to go.
        context.packageManager.setComponentEnabledSetting(
            activity,
            PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
            PackageManager.DONT_KILL_APP
        )

        Log.i(TAG, "Kiosk policy applied")
    }

    fun release(context: Context, admin: ComponentName) {
        val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        dpm.clearPackagePersistentPreferredActivities(admin, context.packageName)
        dpm.setLockTaskPackages(admin, emptyArray())
        Log.i(TAG, "Kiosk policy released")
    }
}
