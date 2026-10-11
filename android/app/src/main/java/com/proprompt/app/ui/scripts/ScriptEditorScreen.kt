package com.proprompt.app.ui.scripts

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.proprompt.app.data.local.ScriptEntity

@Composable
fun ScriptEditorScreen(
    initialScript: ScriptEntity?,
    onSave: (ScriptEntity) -> Unit,
    onBack: () -> Unit
) {
    var title by remember { mutableStateOf(initialScript?.title ?: "New Presentation") }
    var category by remember { mutableStateOf(initialScript?.category ?: "Speech") }
    var content by remember { mutableStateOf(initialScript?.content ?: "") }

    val wordCount = remember(content) {
        content.trim().split("\\s+".toRegex()).filter { it.isNotBlank() }.size
    }
    val estMinutes = remember(wordCount) {
        maxOf(1, (wordCount / 135))
    }

    Scaffold(
        containerColor = Color.Black,
        topBar = {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onBack) {
                    Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
                }

                Button(
                    onClick = {
                        val entity = ScriptEntity(
                            id = initialScript?.id ?: "script-${System.currentTimeMillis()}",
                            title = title.ifBlank { "Untitled Script" },
                            category = category.ifBlank { "General" },
                            content = content
                        )
                        onSave(entity)
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF38BDF8)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(Icons.Default.Save, contentDescription = null, tint = Color.Black)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Save Script", color = Color.Black, fontWeight = FontWeight.Bold)
                }
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            OutlinedTextField(
                value = title,
                onValueChange = { title = it },
                label = { Text("Script Title") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White,
                    focusedBorderColor = Color(0xFF38BDF8),
                    unfocusedBorderColor = Color.DarkGray
                )
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "$wordCount words · ~$estMinutes min read (135 WPM)",
                    fontSize = 12.sp,
                    color = Color.Gray
                )

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilledTonalButton(
                        onClick = { content += "\n[[CUE: SECTION]]\n" },
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("+ CUE", fontSize = 11.sp)
                    }
                    FilledTonalButton(
                        onClick = { content += " [PAUSE 2s] " },
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("+ PAUSE", fontSize = 11.sp)
                    }
                }
            }

            OutlinedTextField(
                value = content,
                onValueChange = { content = it },
                placeholder = {
                    Text(
                        "Enter script text... Preserves Unicode, Hindi (हिंदी), Sanskrit (संस्कृतम्), English paragraphs, and punctuation.",
                        color = Color.DarkGray
                    )
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                shape = RoundedCornerShape(14.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White,
                    focusedBorderColor = Color(0xFF38BDF8),
                    unfocusedBorderColor = Color.DarkGray
                )
            )
        }
    }
}
