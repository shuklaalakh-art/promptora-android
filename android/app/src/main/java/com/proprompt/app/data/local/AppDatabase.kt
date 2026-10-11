package com.proprompt.app.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.sqlite.db.SupportSQLiteDatabase
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@Database(entities = [ScriptEntity::class], version = 1, exportSchema = false)
abstract class AppDatabase : RoomDatabase() {
    abstract fun scriptDao(): ScriptDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context, scope: CoroutineScope): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "proprompt_database"
                )
                .addCallback(DatabaseCallback(scope))
                .build()
                INSTANCE = instance
                instance
            }
        }

        private class DatabaseCallback(
            private val scope: CoroutineScope
        ) : RoomDatabase.Callback() {
            override fun onCreate(db: SupportSQLiteDatabase) {
                super.onCreate(db)
                INSTANCE?.let { database ->
                    scope.launch(Dispatchers.IO) {
                        populateInitialScripts(database.scriptDao())
                    }
                }
            }

            suspend fun populateInitialScripts(dao: ScriptDao) {
                val initialScripts = listOf(
                    ScriptEntity(
                        id = "script-keynote",
                        title = "Next-Gen Mobile Innovation Keynote",
                        category = "Product Launch",
                        tags = "Keynote,Tech,English",
                        content = """
[[CUE: OPENING]]
Good morning, everyone. Welcome to the future of mobile intelligence.

Today, we are introducing a breakthrough that changes how we communicate, work, and create. 

For the past three years, our engineering teams have asked a single question: 
What if your device didn't just respond to commands, but anticipated what you needed before you even reached for the screen?

[PAUSE 2s]

[[CUE: THE PROBLEM]]
Look at how we interact with technology today. 
We jump between dozens of fragmented apps. 
We scroll through endless menus. 
We waste precious minutes organizing what should be effortless.

[[CUE: THE PRODUCT REVEAL]]
That changes today. 
Meet the Aura Engine — an on-device architecture designed from the ground up to synthesize real-time voice, vision, and intent with zero latency.

It operates entirely offline. 
It preserves your privacy by default. 
And it delivers ten times the responsiveness of cloud-bound models.

[PAUSE 3s]

[[CUE: CLOSING]]
Technology is at its absolute best when it dissolves into the background. 
Leaving only you, your story, and your audience.

Thank you all, and let's build what comes next together.
                        """.trimIndent()
                    ),
                    ScriptEntity(
                        id = "script-hindi",
                        title = "प्रेरणादायी वक्तव्य (Hindi Speech: नवाचार)",
                        category = "Public Speaking",
                        tags = "Hindi,Motivation,वक्तव्य",
                        content = """
[[CUE: प्रारम्भ]]
नमस्कार देवियो और सज्जनो! आज के इस विशेष सम्मलेन में आप सभी का हार्दिक स्वागत है।

जब भी हम किसी नए पथ पर कदम बढ़ाते हैं, तो सबसे बड़ी चुनौती साधन नहीं, बल्कि हमारा संकल्प होता है। 

[PAUSE 2s]

[[CUE: नवाचार]]
आज का यह युग डिजिटल क्रांति और असीम संभावनाओं का युग है। 
तकनीक ने दूरियों को मिटा दिया है, किन्तु संवेदनशीलता और सत्यनिष्ठा ही हमें सच्चा नेतृत्व प्रदान करती है।

यदि आप अपने विचार में स्पष्ट हैं, तो आपकी वाणी में वह सम्मोहन होता है जो करोड़ों हृदयों को झकझोर सकता है।

[[CUE: समापन]]
आइए, अपने ज्ञान और तकनीक का उपयोग केवल व्यक्तिगत लाभ के लिए नहीं, अपितु समाज के उत्थान के लिए करें।

जय हिन्द! धन्यवाद!
                        """.trimIndent()
                    ),
                    ScriptEntity(
                        id = "script-sanskrit",
                        title = "संस्कृत सूक्त व व्याख्यान (Sanskrit Invocation)",
                        category = "Classical",
                        tags = "Sanskrit,संस्कृत",
                        content = """
[[CUE: मङ्गलाचरणम्]]
ॐ असतो मा सद्गमय। 
तमसो मा ज्योतिर्गमय। 
मृत्योर्मा अमृतं गमय॥ 
ॐ शान्तिः शान्तिः शान्तिः॥

[PAUSE 3s]

[[CUE: विद्या-प्रशंसा]]
विद्या ददाति विनयं विनयाद्याति पात्रताम्। 
पात्रत्वाद्धनमाप्नोति धनाद्धर्मं ततः सुखम्॥

ज्ञानं परमं बलं भवति। यदा वयं परिश्रमेण सत्येन च कार्यं कुर्मः, तदा सफलता निश्चितं प्राप्यते।

[[CUE: उपसंहारः]]
सर्वे भवन्तु सुखिनः सर्वे सन्तु निरामयाः। 
सर्वे भद्राणि पश्यन्तु मा कश्चिद्दुःखभाग्भवेत्॥
                        """.trimIndent()
                    )
                )
                dao.insertAll(initialScripts)
            }
        }
    }
}
