# Promptora — Professional Android Teleprompter & Video Recorder
**Read Naturally. Record Confidently. · Created by Alakh**

Promptora is a production-oriented native Android application built with **Kotlin, Jetpack Compose, Material 3, CameraX, Room, DataStore, and Android Presentation APIs**. It functions as a studio teleprompter, selfie-video recorder, beam-splitter optical prompter, and external-display reader.

---

## 1. Project Architecture

- **Language:** Kotlin 2.0
- **UI Framework:** Jetpack Compose & Material 3
- **Camera Pipeline:** CameraX 1.3.4 (`VideoCapture`, `Recorder`, `PreviewView`, `MediaStoreOutputOptions`)
- **Persistence:**
  - Local Room Database (`ScriptEntity`, `ScriptDao`, `AppDatabase`)
  - Jetpack DataStore Preferences (`PrompterPreferences`)
- **Video Export:** Android MediaStore (`MediaStore.Video.Media.EXTERNAL_CONTENT_URI` in `Movies/ProPrompt`)
- **External Display:** `android.app.Presentation` & `DisplayManager` for secondary monitors / USB-C / wireless casting
- **Remote Control:** `RemoteKeyDispatcher` intercepting Bluetooth HID clickers, keyboards, and Volume Up/Down keys
- **Minimum SDK:** Android 10 (API 29)
- **Target SDK:** Android 14 / 15 (API 34)

---

## 2. Opening & Building in Android Studio

1. **Prerequisites:**
   - Android Studio Hedgehog (2023.1.1) or newer (Iguana, Jellyfish, Koala, Ladybug).
   - JDK 17 (bundled with Android Studio).
   - Android SDK Platform 34 installed via SDK Manager.

2. **Import Instructions:**
   - Launch Android Studio.
   - Click **Open** (or **File → Open...**).
   - Navigate to the `android/` directory inside this repository.
   - Click **OK**. Android Studio will automatically recognize Gradle and initialize the build.

3. **Gradle Sync & Build:**
   - Wait for Gradle sync to complete.
   - To build the APK, select **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
   - The generated debug APK will be located at:
     `android/app/build/outputs/apk/debug/app-debug.apk`

4. **Running on Physical Device or Emulator:**
   - Connect an Android device with Developer Options & USB Debugging enabled (or start an Android Virtual Device running API 29+).
   - Select your target device in the top toolbar.
   - Click the green **Run (Shift + F10)** button.

---

## 3. Core Capabilities Implemented

### A. Continuous Smooth Auto-Scroller
- Subpixel coroutine scrolling engine running at 60 FPS / 120 FPS.
- Speed slider (1 to 20) with fine +/- increment buttons.
- Font size adjustment (18sp to 72sp).
- Horizontal text margin restrictor to prevent speaker eye travel.
- Reading guide with customizable position and high-contrast beam.

### B. Optical Beam-Splitter Mirroring
- **Flip Horizontal (Mirror X):** Inverts text using GPU graphicsLayer hardware scaling (`scaleX = -1f`) for 70/30 beam-splitter glass hoods.
- **Flip Vertical (Mirror Y):** Inverts text for ceiling/periscope mounts.
- Controls and navigation remain unmirrored for natural operation.

### C. CameraX Selfie Video Recorder
- Transparent floating teleprompter directly adjacent to camera notch/punch hole.
- Front and rear camera switching with zero stutter.
- Video capture saved directly to device gallery via MediaStore.

### D. External Display Support (`android.app.Presentation`)
- Detects secondary displays via `DisplayManager`.
- Projects mirrored, clean prompter text on the external display while keeping phone unmirrored as a remote controller.

### E. Bluetooth HID Remotes & Volume Buttons
- Supports wireless presentation clickers (Logitech R400/R800, Satechi, Baseus).
- Spacebar/Media Play: Start/Pause.
- PageUp/PageDown: Speed adjustment.
- Hardware Volume Up/Down control with explicit opt-in.
