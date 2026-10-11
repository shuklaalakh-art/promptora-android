package com.proprompt.app.ui.theme

import androidx.compose.material3.darkColorScheme
import androidx.compose.ui.graphics.Color

val CyanPrimary = Color(0xFF38BDF8)
val CyanSecondary = Color(0xFF0284C7)
val EmeraldAccent = Color(0xFF10B981)
val AmberAccent = Color(0xFFF59E0B)
val RoseRecord = Color(0xFFE11D48)

val DarkBackground = Color(0xFF000000)
val DarkSurface = Color(0xFF0F172A)
val DarkSurfaceVariant = Color(0xFF1E293B)

val DarkColorScheme = darkColorScheme(
    primary = CyanPrimary,
    secondary = CyanSecondary,
    background = DarkBackground,
    surface = DarkSurface,
    surfaceVariant = DarkSurfaceVariant,
    onPrimary = Color.Black,
    onBackground = Color.White,
    onSurface = Color.White
)
