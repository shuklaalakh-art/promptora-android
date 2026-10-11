package com.proprompt.app.ui.prompter

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
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
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive

@Composable
fun PrompterScreen(
    scriptText: String,
    initialSpeed: Int = 5,
    initialFontSize: Int = 38,
    initialMirrorX: Boolean = false,
    initialMirrorY: Boolean = false,
    onBack: () -> Unit
) {
    var isPlaying by remember { mutableStateOf(false) }
    var speed by remember { mutableStateOf(initialSpeed) }
    var fontSize by remember { mutableStateOf(initialFontSize) }
    var mirrorX by remember { mutableStateOf(initialMirrorX) }
    var mirrorY by remember { mutableStateOf(initialMirrorY) }
    var showGuide by remember { mutableStateOf(true) }
    var guidePositionRatio by remember { mutableStateOf(0.35f) } // 35% from top

    val scrollState = rememberScrollState()

    // Smooth Subpixel Coroutine Auto-Scroller
    LaunchedEffect(isPlaying, speed) {
        if (isPlaying) {
            while (isActive && isPlaying) {
                // Scroll step proportional to speed
                val scrollStep = (speed * 1.5f).toInt()
                if (scrollState.value < scrollState.maxValue) {
                    scrollState.scrollBy(scrollStep.toFloat())
                } else {
                    isPlaying = false
                }
                delay(16L) // ~60 FPS frame interval
            }
        }
    }

    Scaffold(
        containerColor = Color.Black
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .clickable(
                    interactionSource = remember { MutableInteractionSource() },
                    indication = null
                ) {
                    isPlaying = !isPlaying
                }
        ) {
            // Main Scrolling Prompter Content (with Hardware Transform Mirroring)
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(scrollState)
                    .graphicsLayer {
                        scaleX = if (mirrorX) -1f else 1f
                        scaleY = if (mirrorY) -1f else 1f
                    }
                    .padding(horizontal = 32.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Top Spacer so text begins at reading guide
                Spacer(modifier = Modifier.height(280.dp))

                Text(
                    text = scriptText,
                    color = Color.White,
                    fontSize = fontSize.sp,
                    lineHeight = (fontSize * 1.6f).sp,
                    fontWeight = FontWeight.Normal,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )

                // Bottom Spacer so presenter can finish reading
                Spacer(modifier = Modifier.height(400.dp))
            }

            // Eye-Line Reading Guide (Unmirrored for accurate camera alignment)
            if (showGuide) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .align(Alignment.TopCenter)
                        .padding(top = (800 * guidePositionRatio).dp)
                        .height(2.dp)
                        .background(Color(0xFF38BDF8).copy(alpha = 0.8f))
                )
            }

            // Top HUD Control Bar
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

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    // Mirror X Toggle (Beam-Splitter Glass)
                    IconButton(
                        onClick = { mirrorX = !mirrorX },
                        modifier = Modifier.background(
                            if (mirrorX) Color(0xFFF59E0B) else Color(0x99000000),
                            CircleShape
                        )
                    ) {
                        Icon(Icons.Default.Flip, contentDescription = "Flip Horizontal", tint = Color.White)
                    }

                    // Reading Guide Toggle
                    IconButton(
                        onClick = { showGuide = !showGuide },
                        modifier = Modifier.background(
                            if (showGuide) Color(0xFF38BDF8) else Color(0x99000000),
                            CircleShape
                        )
                    ) {
                        Icon(Icons.Default.Visibility, contentDescription = "Guide", tint = Color.White)
                    }
                }
            }

            // Bottom Floating Controller Deck
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
                    .align(Alignment.BottomCenter),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xDD0F172A))
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Speed and Font Steppers
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Speed
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("Speed: ", color = Color.Gray, fontSize = 12.sp)
                            IconButton(onClick = { if (speed > 1) speed-- }) {
                                Icon(Icons.Default.Remove, contentDescription = null, tint = Color.White)
                            }
                            Text("$speed", color = Color(0xFF38BDF8), fontWeight = FontWeight.Bold)
                            IconButton(onClick = { if (speed < 20) speed++ }) {
                                Icon(Icons.Default.Add, contentDescription = null, tint = Color.White)
                            }
                        }

                        // Font
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("Font: ", color = Color.Gray, fontSize = 12.sp)
                            IconButton(onClick = { if (fontSize > 18) fontSize -= 2 }) {
                                Icon(Icons.Default.Remove, contentDescription = null, tint = Color.White)
                            }
                            Text("${fontSize}sp", color = Color.White, fontWeight = FontWeight.Bold)
                            IconButton(onClick = { if (fontSize < 72) fontSize += 2 }) {
                                Icon(Icons.Default.Add, contentDescription = null, tint = Color.White)
                            }
                        }
                    }

                    // Central Play / Pause Button
                    Button(
                        onClick = { isPlaying = !isPlaying },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (isPlaying) Color(0xFFF59E0B) else Color(0xFF10B981)
                        )
                    ) {
                        Icon(
                            imageVector = if (isPlaying) Icons.Default.Pause else Icons.Default.PlayArrow,
                            contentDescription = null,
                            tint = Color.Black
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = if (isPlaying) "Pause Prompter" else "Start Prompter",
                            color = Color.Black,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}
