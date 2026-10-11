package com.proprompt.app

import android.app.Application
import com.proprompt.app.data.local.AppDatabase
import com.proprompt.app.data.preferences.PrompterPreferences
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.SupervisorJob

class ProPromptApplication : Application() {
    private val applicationScope = CoroutineScope(SupervisorJob())

    val database by lazy { AppDatabase.getDatabase(this, applicationScope) }
    val preferences by lazy { PrompterPreferences(this) }
}
