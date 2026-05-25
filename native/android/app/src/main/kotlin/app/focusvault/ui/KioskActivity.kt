package app.focusvault.ui

import android.app.admin.DevicePolicyManager
import android.content.Context
import android.os.Bundle
import android.view.WindowManager
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import app.focusvault.R
import app.focusvault.admin.VaultDeviceAdminReceiver
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * The one and only screen the user can see during a focus block.
 *
 * - Pinned via Lock Task Mode (kiosk)
 * - Registered as HOME — survives reboot, defeats HOME-press
 * - SHOW_WHEN_LOCKED + KEEP_SCREEN_ON so it draws above the keyguard
 */
class KioskActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_kiosk)

        // Draw above the keyguard, never sleep, immersive.
        window.addFlags(
            WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
        )

        findViewById<TextView>(R.id.contractText).text =
            "Ship v0 of the auth flow. Nothing else exists today."

        startKioskIfAllowed()
        tick()
    }

    override fun onResume() {
        super.onResume()
        startKioskIfAllowed()
    }

    /** Refuses to release control on back-press during the window. */
    override fun onBackPressed() { /* swallow */ }

    private fun startKioskIfAllowed() {
        val dpm = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        val admin = VaultDeviceAdminReceiver.componentName(this)
        if (dpm.isDeviceOwnerApp(packageName) && dpm.isLockTaskPermitted(packageName)) {
            startLockTask()
        }
    }

    fun releaseKioskAfterBreakGlass() {
        // Called from the BreakGlassController on a verified server response.
        stopLockTask()
        finish()
    }

    private fun tick() {
        val fmt = SimpleDateFormat("HH:mm:ss", Locale.US)
        val tv = findViewById<TextView>(R.id.clockText)
        val handler = window.decorView.handler
        val r = object : Runnable {
            override fun run() {
                tv.text = fmt.format(Date())
                handler.postDelayed(this, 1000)
            }
        }
        handler.post(r)
    }
}
