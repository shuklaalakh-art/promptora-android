package com.proprompt.app.ui.camera

import androidx.camera.video.VideoRecordEvent
import androidx.camera.view.PreviewView
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.proprompt.app.camera.CameraXManager
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive

@Composable
fun CameraRecordScreen(
    scriptText: String,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val cameraManager = remember { CameraXManager(context) }

    var isRecording by remember { mutableStateOf(false) }
    var recordingDurationSeconds by remember { mutableStateOf(0) }
    var isPrompterScrolling by remember { mutableStateOf(false) }
    var speed by remember { mutableStateOf(5) }

    val scrollState = rememberScrollState()
    var previewViewInstance by remember { mutableStateOf<PreviewView?>(null) }

    // Prompter auto-scroll loop during recording
    LaunchedEffect(isPrompterScrolling, speed) {
        if (isPrompterScrolling) {
            while (isActive && isPrompterScrolling) {
                if (scrollState.value < scrollState.maxValue) {
                    scrollState.scrollBy((speed * 1.5f))
                }
                delay(16L)
            }
        }
    }

    // Timer for recording duration
    LaunchedEffect(isRecording) {
        if (isRecording) {
            while (isActive && isRecording) {
                delay(1000L)
                recordingDurationSeconds++
            }
        } else {
            recordingDurationSeconds = 0
        }
    }

    Scaffold(containerColor = Color.Black) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            // CameraX Live Preview Viewport
            AndroidView(
                factory = { ctx ->
                    PreviewView(ctx).also { view ->
                        previewViewInstance = view
                        cameraManager.startCamera(lifecycleOwner, view)
                    }
                },
                modifier = Modifier.fillMaxSize()
            )

            // Transparent Teleprompter Overlay directly next to Camera Notch
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp, vertical = 72.dp)
                    .height(220.dp),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xAA000000))
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp)
                        .verticalScroll(scrollState)
                ) {
                    Text(
                        text = scriptText,
                        color = Color.White,
                        fontSize = 24.sp,
                        lineHeight = 36.sp,
                        fontWeight = FontWeight.Medium
                    )
                }
            }

            // Top Camera HUD
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
                    .align(Alignment.TopCenter),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(
                    onClick = onBack,
                    modifier = Modifier.background(Color(0x99000000), CircleShape)
                ) {
                    Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
                }

                if (isRecording) {
                    val m = recordingDurationSeconds / 60
                    val s = recordingDurationSeconds % 60
                    Text(
                        text = String.format("REC %02d:%02d", m, s),
                        color = Color(0xFFE11D48),
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        modifier = Modifier
                            .background(Color(0x99000000), RoundedCornerShape(12.dp))
                            .padding(horizontal = 12.dp, vertical = 6.dp)
                    )
                }

                IconButton(
                    onClick = {
                        previewViewInstance?.let { view ->
                            cameraManager.switchCamera(lifecycleOwner, view)
                        }
                    },
                    modifier = Modifier.background(Color(0x99000000), CircleShape)
                ) {
                    Icon(Icons.Default.FlipCameraAndroid, contentDescription = "Switch Camera", tint = Color.White)
                }
            }

            // Bottom Recording Controls
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(32.dp)
                    .align(Alignment.BottomCenter),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Giant Record Button
                IconButton(
                    onClick = {
                        if (!isRecording) {
                            cameraManager.startRecording { event ->
                                if (event is VideoRecordEvent.Finalize) {
                                    isRecording = false
                                    isPrompterScrolling = false
                                }
                            }
                            isRecording = true
                            isPrompterScrolling = true
                        } else {
                            cameraManager.stopRecording()
                            isRecording = false
                            isPrompterScrolling = false
                        }
                    },
                    modifier = Modifier
                        .size(80.dp)
                        .background(
                            if (isRecording) Color(0xFFE11D48) else Color.White,
                            CircleShape
                        )
                ) {
                    Icon(
                        imageVector = if (isRecording) Icons.Default.Stop else Icons.Default.FiberManualRecord,
                        contentDescription = "Record",
                        tint = if (isRecording) Color.White else Color(0xFFE11D48),
                        modifier = Modifier.size(40.dp)
                    )
                }
            }
        }
    }
}
