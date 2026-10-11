package com.proprompt.app.display

import android.app.Presentation
import android.content.Context
import android.hardware.display.DisplayManager
import android.os.Bundle
import android.view.Display
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

class PrompterPresentation(
    outerContext: Context,
    display: Display,
    private val scriptText: String,
    private val mirrorX: Boolean = true,
    private val mirrorY: Boolean = false,
    private val fontSizeSp: Float = 42f
) : Presentation(outerContext, display) {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val composeView = ComposeView(context).apply {
            setContent {
                ExternalPrompterScreen(
                    text = scriptText,
                    mirrorX = mirrorX,
                    mirrorY = mirrorY,
                    fontSizeSp = fontSizeSp
                )
            }
        }

        setContentView(composeView)
    }
}

@Composable
fun ExternalPrompterScreen(
    text: String,
    mirrorX: Boolean,
    mirrorY: Boolean,
    fontSizeSp: Float
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
            .padding(horizontal = 48.dp, vertical = 64.dp)
            .graphicsLayer {
                scaleX = if (mirrorX) -1f else 1f
                scaleY = if (mirrorY) -1f else 1f
            }
    ) {
        Text(
            text = text,
            color = Color.White,
            fontSize = fontSizeSp.sp,
            lineHeight = (fontSizeSp * 1.5f).sp,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth()
        )
    }
}

class ExternalDisplayManager(
    private val context: Context,
    private val onDisplayChanged: (Display?) -> Unit
) : DisplayManager.DisplayListener {

    private val displayManager = context.getSystemService(Context.DISPLAY_SERVICE) as DisplayManager
    private var currentPresentation: PrompterPresentation? = null

    fun startListening() {
        displayManager.registerDisplayListener(this, null)
        checkCurrentDisplays()
    }

    fun stopListening() {
        displayManager.unregisterDisplayListener(this)
        dismissPresentation()
    }

    private fun checkCurrentDisplays() {
        val displays = displayManager.getDisplays(DisplayManager.DISPLAY_CATEGORY_PRESENTATION)
        if (displays.isNotEmpty()) {
            onDisplayChanged(displays[0])
        } else {
            onDisplayChanged(null)
        }
    }

    fun showOnDisplay(display: Display, scriptText: String, mirrorX: Boolean) {
        dismissPresentation()
        currentPresentation = PrompterPresentation(
            outerContext = context,
            display = display,
            scriptText = scriptText,
            mirrorX = mirrorX
        ).also {
            it.show()
        }
    }

    fun dismissPresentation() {
        currentPresentation?.dismiss()
        currentPresentation = null
    }

    override fun onDisplayAdded(displayId: Int) {
        checkCurrentDisplays()
    }

    override fun onDisplayRemoved(displayId: Int) {
        checkCurrentDisplays()
    }

    override fun onDisplayChanged(displayId: Int) {
        checkCurrentDisplays()
    }
}
