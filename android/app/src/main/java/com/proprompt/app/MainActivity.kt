package com.proprompt.app

import android.os.Bundle
import android.view.KeyEvent
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.*
import androidx.lifecycle.lifecycleScope
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.proprompt.app.data.local.ScriptEntity
import com.proprompt.app.display.ExternalDisplayManager
import com.proprompt.app.remote.PrompterRemoteAction
import com.proprompt.app.remote.RemoteKeyDispatcher
import com.proprompt.app.ui.camera.CameraRecordScreen
import com.proprompt.app.ui.dashboard.DashboardScreen
import com.proprompt.app.ui.prompter.PrompterScreen
import com.proprompt.app.ui.scripts.ScriptEditorScreen
import com.proprompt.app.ui.theme.ProPromptTheme
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    private lateinit var externalDisplayManager: ExternalDisplayManager
    private var remoteKeyDispatcher: RemoteKeyDispatcher? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Keep screen awake while reading or recording
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        val app = application as ProPromptApplication

        externalDisplayManager = ExternalDisplayManager(this) { display ->
            // External display attached/detached
        }
        externalDisplayManager.startListening()

        remoteKeyDispatcher = RemoteKeyDispatcher(allowVolumeKeys = true) { action ->
            when (action) {
                is PrompterRemoteAction.TogglePlay -> {
                    // Trigger remote action
                }
                is PrompterRemoteAction.SpeedUp -> {
                    // Speed +
                }
                is PrompterRemoteAction.SpeedDown -> {
                    // Speed -
                }
                is PrompterRemoteAction.Restart -> {
                    // Reset
                }
                else -> {}
            }
        }

        setContent {
            ProPromptTheme {
                val navController = rememberNavController()
                val scripts by app.database.scriptDao().getAllScripts().collectAsState(initial = emptyList())
                val lastScriptId by app.preferences.lastScriptIdFlow.collectAsState(initial = null)

                val activeScript = remember(scripts, lastScriptId) {
                    scripts.find { it.id == lastScriptId } ?: scripts.firstOrNull()
                }

                var selectedScriptForEdit by remember { mutableStateOf<ScriptEntity?>(null) }
                var selectedScriptForPrompter by remember { mutableStateOf<ScriptEntity?>(null) }

                NavHost(navController = navController, startDestination = "dashboard") {
                    composable("dashboard") {
                        DashboardScreen(
                            recentScripts = scripts,
                            lastScript = activeScript,
                            onStartPrompter = { script ->
                                selectedScriptForPrompter = script
                                lifecycleScope.launch {
                                    app.preferences.setLastScriptId(script.id)
                                }
                                navController.navigate("prompter")
                            },
                            onRecordVideo = { script ->
                                selectedScriptForPrompter = script
                                navController.navigate("camera_record")
                            },
                            onNewScript = {
                                selectedScriptForEdit = null
                                navController.navigate("editor")
                            },
                            onMyScripts = {
                                // Navigate to scripts
                            },
                            onExternalDisplay = {
                                selectedScriptForPrompter = activeScript
                                navController.navigate("prompter")
                            },
                            onRemoteSetup = {
                                // Open remote setup
                            }
                        )
                    }

                    composable("prompter") {
                        val text = selectedScriptForPrompter?.content
                            ?: activeScript?.content
                            ?: "No script text available."

                        PrompterScreen(
                            scriptText = text,
                            onBack = { navController.popBackStack() }
                        )
                    }

                    composable("camera_record") {
                        val text = selectedScriptForPrompter?.content
                            ?: activeScript?.content
                            ?: "No script text available."

                        CameraRecordScreen(
                            scriptText = text,
                            onBack = { navController.popBackStack() }
                        )
                    }

                    composable("editor") {
                        ScriptEditorScreen(
                            initialScript = selectedScriptForEdit,
                            onSave = { entity ->
                                lifecycleScope.launch {
                                    app.database.scriptDao().insertScript(entity)
                                    app.preferences.setLastScriptId(entity.id)
                                }
                                navController.popBackStack()
                            },
                            onBack = { navController.popBackStack() }
                        )
                    }
                }
            }
        }
    }

    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (remoteKeyDispatcher?.dispatchKeyEvent(event) == true) {
            return true
        }
        return super.dispatchKeyEvent(event)
    }

    override fun onDestroy() {
        super.onDestroy()
        externalDisplayManager.stopListening()
    }
}
