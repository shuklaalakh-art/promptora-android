package com.proprompt.app.data.preferences

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.*
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "proprompt_preferences")

class PrompterPreferences(private val context: Context) {

    companion object {
        val SPEED_KEY = intPreferencesKey("prompter_speed")
        val FONT_SIZE_KEY = intPreferencesKey("prompter_font_size")
        val LINE_HEIGHT_KEY = floatPreferencesKey("prompter_line_height")
        val MARGIN_HORIZONTAL_KEY = intPreferencesKey("prompter_margin_horizontal")
        val MIRROR_X_KEY = booleanPreferencesKey("prompter_mirror_x")
        val MIRROR_Y_KEY = booleanPreferencesKey("prompter_mirror_y")
        val THEME_KEY = stringPreferencesKey("prompter_theme")
        val SHOW_GUIDE_KEY = booleanPreferencesKey("prompter_show_guide")
        val GUIDE_POSITION_KEY = intPreferencesKey("prompter_guide_position")
        val VOLUME_KEY_CONTROL = booleanPreferencesKey("prompter_volume_key_control")
        val LAST_SCRIPT_ID = stringPreferencesKey("prompter_last_script_id")
    }

    val speedFlow: Flow<Int> = context.dataStore.data.map { it[SPEED_KEY] ?: 5 }
    val fontSizeFlow: Flow<Int> = context.dataStore.data.map { it[FONT_SIZE_KEY] ?: 38 }
    val lineHeightFlow: Flow<Float> = context.dataStore.data.map { it[LINE_HEIGHT_KEY] ?: 1.6f }
    val marginHorizontalFlow: Flow<Int> = context.dataStore.data.map { it[MARGIN_HORIZONTAL_KEY] ?: 16 }
    val mirrorXFlow: Flow<Boolean> = context.dataStore.data.map { it[MIRROR_X_KEY] ?: false }
    val mirrorYFlow: Flow<Boolean> = context.dataStore.data.map { it[MIRROR_Y_KEY] ?: false }
    val themeFlow: Flow<String> = context.dataStore.data.map { it[THEME_KEY] ?: "studio-dark" }
    val showGuideFlow: Flow<Boolean> = context.dataStore.data.map { it[SHOW_GUIDE_KEY] ?: true }
    val guidePositionFlow: Flow<Int> = context.dataStore.data.map { it[GUIDE_POSITION_KEY] ?: 35 }
    val volumeKeyControlFlow: Flow<Boolean> = context.dataStore.data.map { it[VOLUME_KEY_CONTROL] ?: true }
    val lastScriptIdFlow: Flow<String?> = context.dataStore.data.map { it[LAST_SCRIPT_ID] }

    suspend fun setSpeed(speed: Int) {
        context.dataStore.edit { it[SPEED_KEY] = speed }
    }

    suspend fun setFontSize(size: Int) {
        context.dataStore.edit { it[FONT_SIZE_KEY] = size }
    }

    suspend fun setMirrorX(mirror: Boolean) {
        context.dataStore.edit { it[MIRROR_X_KEY] = mirror }
    }

    suspend fun setMirrorY(mirror: Boolean) {
        context.dataStore.edit { it[MIRROR_Y_KEY] = mirror }
    }

    suspend fun setTheme(theme: String) {
        context.dataStore.edit { it[THEME_KEY] = theme }
    }

    suspend fun setVolumeKeyControl(enabled: Boolean) {
        context.dataStore.edit { it[VOLUME_KEY_CONTROL] = enabled }
    }

    suspend fun setLastScriptId(scriptId: String) {
        context.dataStore.edit { it[LAST_SCRIPT_ID] = scriptId }
    }
}
