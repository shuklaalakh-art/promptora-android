package com.proprompt.app.data.local

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Dao
interface ScriptDao {
    @Query("SELECT * FROM scripts ORDER BY updatedAt DESC")
    fun getAllScripts(): Flow<List<ScriptEntity>>

    @Query("SELECT * FROM scripts WHERE id = :id LIMIT 1")
    suspend fun getScriptById(id: String): ScriptEntity?

    @Query("SELECT * FROM scripts WHERE title LIKE '%' || :query || '%' OR content LIKE '%' || :query || '%' ORDER BY updatedAt DESC")
    fun searchScripts(query: String): Flow<List<ScriptEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertScript(script: ScriptEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(scripts: List<ScriptEntity>)

    @Update
    suspend fun updateScript(script: ScriptEntity)

    @Query("UPDATE scripts SET lastReadPosition = :position, updatedAt = :time WHERE id = :id")
    suspend fun updateReadingPosition(id: String, position: Int, time: Long = System.currentTimeMillis())

    @Query("DELETE FROM scripts WHERE id = :id")
    suspend fun deleteById(id: String)
}
