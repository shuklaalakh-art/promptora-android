package com.proprompt.app.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "scripts")
data class ScriptEntity(
    @PrimaryKey
    val id: String,
    val title: String,
    val category: String,
    val content: String,
    val tags: String = "",
    val lastReadPosition: Int = 0,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)
