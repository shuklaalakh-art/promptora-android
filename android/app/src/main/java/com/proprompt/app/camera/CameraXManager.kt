package com.proprompt.app.camera

import android.content.ContentValues
import android.content.Context
import android.os.Build
import android.provider.MediaStore
import androidx.camera.core.Camera
import androidx.camera.core.CameraSelector
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.video.*
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import java.text.SimpleDateFormat
import java.util.Locale

class CameraXManager(private val context: Context) {

    private var cameraProvider: ProcessCameraProvider? = null
    private var videoCapture: VideoCapture<Recorder>? = null
    private var currentRecording: Recording? = null
    private var camera: Camera? = null

    private var lensFacing: CameraSelector = CameraSelector.DEFAULT_FRONT_CAMERA

    fun startCamera(
        lifecycleOwner: LifecycleOwner,
        previewView: PreviewView,
        onCameraReady: () -> Unit = {}
    ) {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
        cameraProviderFuture.addListener({
            cameraProvider = cameraProviderFuture.get()

            val preview = Preview.Builder().build().also {
                it.setSurfaceProvider(previewView.surfaceProvider)
            }

            val recorder = Recorder.Builder()
                .setQualitySelector(QualitySelector.from(Quality.FHD, FallbackStrategy.higherQualityOrLowerThan(Quality.FHD)))
                .build()

            videoCapture = VideoCapture.withOutput(recorder)

            try {
                cameraProvider?.unbindAll()
                camera = cameraProvider?.bindToLifecycle(
                    lifecycleOwner,
                    lensFacing,
                    preview,
                    videoCapture
                )
                onCameraReady()
            } catch (exc: Exception) {
                exc.printStackTrace()
            }
        }, ContextCompat.getMainExecutor(context))
    }

    fun switchCamera(lifecycleOwner: LifecycleOwner, previewView: PreviewView) {
        lensFacing = if (lensFacing == CameraSelector.DEFAULT_FRONT_CAMERA) {
            CameraSelector.DEFAULT_BACK_CAMERA
        } else {
            CameraSelector.DEFAULT_FRONT_CAMERA
        }
        startCamera(lifecycleOwner, previewView)
    }

    fun startRecording(
        onVideoRecordEvent: (VideoRecordEvent) -> Unit
    ) {
        val videoCapture = this.videoCapture ?: return

        val name = SimpleDateFormat("yyyy-MM-dd-HH-mm-ss-SSS", Locale.US)
            .format(System.currentTimeMillis())

        val contentValues = ContentValues().apply {
            put(MediaStore.MediaColumns.DISPLAY_NAME, "ProPrompt_$name")
            put(MediaStore.MediaColumns.MIME_TYPE, "video/mp4")
            if (Build.VERSION.SDK_INT > Build.VERSION_CODES.P) {
                put(MediaStore.Video.Media.RELATIVE_PATH, "Movies/ProPrompt")
            }
        }

        val mediaStoreOutputOptions = MediaStoreOutputOptions.Builder(
            context.contentResolver,
            MediaStore.Video.Media.EXTERNAL_CONTENT_URI
        ).setContentValues(contentValues).build()

        currentRecording = videoCapture.output
            .prepareRecording(context, mediaStoreOutputOptions)
            .apply {
                // Audio recording enabled with user permission
                try {
                    withAudioEnabled()
                } catch (e: SecurityException) {
                    e.printStackTrace()
                }
            }
            .start(ContextCompat.getMainExecutor(context)) { recordEvent ->
                onVideoRecordEvent(recordEvent)
            }
    }

    fun pauseRecording() {
        currentRecording?.pause()
    }

    fun resumeRecording() {
        currentRecording?.resume()
    }

    fun stopRecording() {
        currentRecording?.stop()
        currentRecording = null
    }

    fun isFrontCamera(): Boolean {
        return lensFacing == CameraSelector.DEFAULT_FRONT_CAMERA
    }
}
