# Focus Vault — Android Kiosk (Device Owner)

A minimal, **buildable** Android Studio project that turns a phone into a
hard-locked Focus Vault between 09:00 and 17:00 using **Device Owner** +
**Lock Task Mode** (true kiosk). Survives reboot, blocks Home / Back / Recents,
and refuses uninstall.

> ⚠ Device Owner can only be provisioned on a **factory-reset** device with
> **no Google account**. Once set, the only ways to remove it are this app's
> own `clearDeviceOwnerApp` call or another factory reset.

## 1. Build

Open `native/android/` in Android Studio Hedgehog+ (AGP 8.2, Kotlin 1.9, JDK 17).
Run `./gradlew assembleDebug` — APK lands in `app/build/outputs/apk/debug/`.

## 2. Provision as Device Owner

Factory-reset the target device, skip Google sign-in, enable USB debugging, then:

```bash
adb install app/build/outputs/apk/debug/app-debug.apk
adb shell dpm set-device-owner app.focusvault/.admin.VaultDeviceAdminReceiver
```

Expected output: `Success: Device owner set to ...`

## 3. Arm the vault

Open the app. It will:

1. Whitelist itself for Lock Task Mode.
2. Pin itself as the **persistent home / launcher** (`BOOT_COMPLETED` + HOME intent filter).
3. Disable Safe Boot, factory reset, keyguard features, status-bar expansion.
4. Schedule daily kiosk window via `AlarmManager` (default 09:00 → 17:00).
5. Enter `startLockTask()` when the window opens.

## 4. Break-glass

The in-app Override button calls the Lovable web `/break-glass` flow over HTTPS.
On a verified `200 { "released": true }` the app calls `stopLockTask()`.

## 5. Tear down (testing)

```bash
adb shell dpm remove-active-admin app.focusvault/.admin.VaultDeviceAdminReceiver
```

Or hit the hidden 7-tap "Engineering Exit" in `SettingsActivity` (debug builds only).

## File map

```
app/
├── build.gradle.kts
├── src/main/
│   ├── AndroidManifest.xml
│   ├── kotlin/app/focusvault/
│   │   ├── VaultApp.kt
│   │   ├── ui/KioskActivity.kt
│   │   ├── admin/VaultDeviceAdminReceiver.kt
│   │   ├── admin/KioskPolicy.kt
│   │   ├── boot/BootReceiver.kt
│   │   └── schedule/WindowScheduler.kt
│   └── res/
│       ├── xml/device_admin.xml
│       ├── layout/activity_kiosk.xml
│       └── values/{strings,themes}.xml
```
