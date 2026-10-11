package com.proprompt.app.remote

import android.view.KeyEvent

sealed class PrompterRemoteAction {
    object TogglePlay : PrompterRemoteAction()
    object SpeedUp : PrompterRemoteAction()
    object SpeedDown : PrompterRemoteAction()
    object Restart : PrompterRemoteAction()
    object JumpForward : PrompterRemoteAction()
    object JumpBackward : PrompterRemoteAction()
    object NextCue : PrompterRemoteAction()
    object PrevCue : PrompterRemoteAction()
}

class RemoteKeyDispatcher(
    private val allowVolumeKeys: Boolean = true,
    private val onAction: (PrompterRemoteAction) -> Unit
) {

    fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (event.action != KeyEvent.ACTION_DOWN) return false

        return when (event.keyCode) {
            KeyEvent.KEYCODE_SPACE,
            KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE,
            KeyEvent.KEYCODE_MEDIA_PLAY,
            KeyEvent.KEYCODE_MEDIA_PAUSE -> {
                onAction(PrompterRemoteAction.TogglePlay)
                true
            }

            KeyEvent.KEYCODE_DPAD_UP,
            KeyEvent.KEYCODE_PAGE_UP,
            KeyEvent.KEYCODE_MEDIA_FAST_FORWARD -> {
                onAction(PrompterRemoteAction.SpeedUp)
                true
            }

            KeyEvent.KEYCODE_DPAD_DOWN,
            KeyEvent.KEYCODE_PAGE_DOWN,
            KeyEvent.KEYCODE_MEDIA_REWIND -> {
                onAction(PrompterRemoteAction.SpeedDown)
                true
            }

            KeyEvent.KEYCODE_DPAD_RIGHT -> {
                onAction(PrompterRemoteAction.JumpForward)
                true
            }

            KeyEvent.KEYCODE_DPAD_LEFT -> {
                onAction(PrompterRemoteAction.JumpBackward)
                true
            }

            KeyEvent.KEYCODE_R -> {
                onAction(PrompterRemoteAction.Restart)
                true
            }

            // Volume Keys Control (Explicit Opt-In)
            KeyEvent.KEYCODE_VOLUME_UP -> {
                if (allowVolumeKeys) {
                    onAction(PrompterRemoteAction.SpeedUp)
                    true
                } else false
            }

            KeyEvent.KEYCODE_VOLUME_DOWN -> {
                if (allowVolumeKeys) {
                    onAction(PrompterRemoteAction.SpeedDown)
                    true
                } else false
            }

            else -> false
        }
    }
}
