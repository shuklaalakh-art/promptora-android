package com.proprompt.app.ui.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.proprompt.app.data.local.ScriptEntity

@Composable
fun DashboardScreen(
    recentScripts: List<ScriptEntity>,
    lastScript: ScriptEntity?,
    onStartPrompter: (ScriptEntity) -> Unit,
    onRecordVideo: (ScriptEntity) -> Unit,
    onNewScript: () -> Unit,
    onMyScripts: () -> Unit,
    onExternalDisplay: () -> Unit,
    onRemoteSetup: () -> Unit
) {
    var searchQuery by remember { mutableStateOf("") }

    val filteredScripts = remember(recentScripts, searchQuery) {
        if (searchQuery.isBlank()) recentScripts
        else recentScripts.filter {
            it.title.contains(searchQuery, ignoreCase = true) ||
            it.content.contains(searchQuery, ignoreCase = true)
        }
    }

    Scaffold(
        containerColor = Color.Black
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 20.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // App Bar Title
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "Promptora",
                            fontSize = 28.sp,
                            fontWeight = FontWeight.Black,
                            color = Color.White
                        )
                        Text(
                            text = "Read Naturally. Record Confidently. · Created by Alakh",
                            fontSize = 12.sp,
                            color = Color(0xFF38BDF8)
                        )
                    }

                    IconButton(onClick = onRemoteSetup) {
                        Icon(
                            imageVector = Icons.Default.SettingsRemote,
                            contentDescription = "Remote Control",
                            tint = Color(0xFF38BDF8)
                        )
                    }
                }
            }

            // Quick-Start Prominent Hero Card
            if (lastScript != null) {
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(24.dp),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A))
                    ) {
                        Column(
                            modifier = Modifier.padding(20.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Text(
                                text = "READY TO PROMPT · LAST SCRIPT",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF38BDF8)
                            )

                            Text(
                                text = lastScript.title,
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Button(
                                    onClick = { onStartPrompter(lastScript) },
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF38BDF8)),
                                    shape = RoundedCornerShape(16.dp),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Icon(Icons.Default.PlayArrow, contentDescription = null, tint = Color.Black)
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("Start Prompter", color = Color.Black, fontWeight = FontWeight.Bold)
                                }

                                OutlinedButton(
                                    onClick = { onRecordVideo(lastScript) },
                                    shape = RoundedCornerShape(16.dp),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Icon(Icons.Default.Videocam, contentDescription = null, tint = Color(0xFF10B981))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("Record Video", color = Color.White)
                                }
                            }
                        }
                    }
                }
            }

            // Core Actions Grid
            item {
                Text(
                    text = "STUDIO MODULES",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.Gray
                )

                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    ActionTile("New Script", Icons.Default.Add, Color(0xFF38BDF8), onNewScript, Modifier.weight(1f))
                    ActionTile("My Scripts", Icons.Default.Description, Color(0xFF818CF8), onMyScripts, Modifier.weight(1f))
                    ActionTile("External Display", Icons.Default.Tv, Color(0xFFA855F7), onExternalDisplay, Modifier.weight(1f))
                }
            }

            // Recent Scripts List
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Recent Scripts (${filteredScripts.size})",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text("Search scripts...", color = Color.Gray) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = Color(0xFF38BDF8),
                        unfocusedBorderColor = Color.DarkGray
                    ),
                    singleLine = true
                )
            }

            items(filteredScripts) { script ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onStartPrompter(script) },
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B))
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = script.title,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Color.White
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = script.content.take(80) + "...",
                            fontSize = 12.sp,
                            color = Color.LightGray
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun ActionTile(
    label: String,
    icon: ImageVector,
    tint: Color,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .height(96.dp)
            .clickable { onClick() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B))
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(8.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(imageVector = icon, contentDescription = label, tint = tint, modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.height(6.dp))
            Text(text = label, fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
        }
    }
}
