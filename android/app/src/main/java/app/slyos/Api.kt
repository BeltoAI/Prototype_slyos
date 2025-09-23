package app.slyos

import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.logging.HttpLoggingInterceptor
import org.json.JSONArray
import org.json.JSONObject

object Api {
    @Volatile private var base: String = BuildConfig.API_BASE
    @Volatile var deviceId: String? = null

    private val httpLogging = HttpLoggingInterceptor { msg -> Log.d("OkHttp", msg) }
        .apply { level = HttpLoggingInterceptor.Level.BODY }

    private val client: OkHttpClient by lazy {
        OkHttpClient.Builder().addInterceptor(httpLogging).build()
    }

    fun setBase(b: String) {
        base = if (b.isBlank()) BuildConfig.API_BASE else b
        Log.d("SlyOS", "API base set to: $base")
    }

    private fun url(path: String): String = base.trimEnd('/') + path

    private fun jsonOrNull(s: String?): JSONObject? = try {
        if (s.isNullOrBlank()) null else JSONObject(s)
    } catch (_: Throwable) { null }

    private fun Request.Builder.addDevHeaders(): Request.Builder {
        val id = deviceId
        if (!id.isNullOrBlank()) addHeader("X-Device-Id", id)
        return this
    }
    private fun withDevQuery(path: String): String {
        val id = deviceId ?: return path
        return path + (if (path.contains("?")) "&" else "?") + "deviceId=" + id
    }

    // ---------------- Registration (optional; harmless if server lacks it) ----------------
    suspend fun registerDevice(model: String, osVersion: String): Boolean = withContext(Dispatchers.IO) {
        Log.d("SlyOS", "Api.register: ENTER")
        val bodyJson = JSONObject().put("model", model).put("osVersion", osVersion).toString()
        val bodies = listOf(bodyJson)
        val paths = listOf("/api/device/register", "/api/ops/device/register")
        for (p in paths) {
            val req = Request.Builder()
                .url(url(p))
                .addDevHeaders()
                .post(bodies[0].toRequestBody("application/json; charset=utf-8".toMediaType()))
                .build()
            val res = client.newCall(req).execute()
            Log.d("SlyOS", "Api.register: $p -> HTTP ${res.code}")
            if (res.isSuccessful) {
                val body = res.body?.string().orEmpty()
                val js = jsonOrNull(body)
                val id = js?.optString("id", null) ?: js?.optString("deviceId", null)
                if (!id.isNullOrBlank()) {
                    deviceId = id
                    Log.d("SlyOS", "Api.register: deviceId set to $id")
                }
                return@withContext true
            }
        }
        false
    }

    // ---------------- Credits ----------------
    suspend fun creditsTotal(): Int = withContext(Dispatchers.IO) {
        val req = Request.Builder().url(url("/api/credits/total")).get().build()
        val res = client.newCall(req).execute()
        if (!res.isSuccessful) 0 else run {
            val body = res.body?.string().orEmpty()
            body.trim().toIntOrNull() ?: (jsonOrNull(body)?.optInt("total", 0) ?: 0)
        }
    }
    suspend fun deviceCredits(id: String): Int = withContext(Dispatchers.IO) {
        val req = Request.Builder().url(url("/api/credits/device/$id")).get().build()
        val res = client.newCall(req).execute()
        if (!res.isSuccessful) 0 else run {
            val body = res.body?.string().orEmpty()
            body.trim().toIntOrNull() ?: (jsonOrNull(body)?.optInt("credits", 0) ?: 0)
        }
    }

    // ---------------- Job pulling / pushing ----------------

    /** Claim a job; tries many routes + GET/POST + passes deviceId in header & query. */
    suspend fun claim(): String? = withContext(Dispatchers.IO) {
        fun parseId(body: String?): String? {
            val js = jsonOrNull(body) ?: return null
            return js.optString("id", null) ?: js.optString("jobId", null) ?: js.optString("uid", null)
        }
        val claimPaths = listOf(
            "/api/ops/jobs/claim",
            "/api/ops/jobs/next",
            "/api/ops/claim",
            "/api/ops/claim-job",
            "/api/jobs/claim",
            "/api/jobs/next",
            "/api/job/claim",
            "/api/job/next",
            "/api/ops/job/claim"
        )
        for (p in claimPaths) {
            // Try GET with deviceId in query
            run {
                val req = Request.Builder()
                    .url(url(withDevQuery(p)))
                    .addDevHeaders()
                    .get()
                    .build()
                Log.d("SlyOS", "Api.claim: GET ${req.url}")
                val res = client.newCall(req).execute()
                if (res.isSuccessful) {
                    val body = res.body?.string().orEmpty()
                    parseId(body)?.let { return@withContext it }
                }
            }
            // Try POST with deviceId header/json
            run {
                val body = JSONObject().put("deviceId", deviceId ?: "").toString()
                val req = Request.Builder()
                    .url(url(p))
                    .addDevHeaders()
                    .post(body.toRequestBody("application/json; charset=utf-8".toMediaType()))
                    .build()
                Log.d("SlyOS", "Api.claim: POST ${req.url}")
                val res = client.newCall(req).execute()
                Log.d("SlyOS", "Api.claim: HTTP ${res.code}")
                if (res.isSuccessful) {
                    val resp = res.body?.string().orEmpty()
                    parseId(resp)?.let { return@withContext it }
                }
            }
        }
        null
    }

    /** Fetch plain text payload for a job id (tries several paths). */
    suspend fun fetchText(id: String): String = withContext(Dispatchers.IO) {
        val paths = listOf(
            "/api/jobs/$id/text",
            "/api/job/$id/text",
            "/api/ops/job/$id/text",
            "/api/jobs/$id" // some servers return text directly
        )
        for (p in paths) {
            val req = Request.Builder().url(url(p)).addDevHeaders().get().build()
            Log.d("SlyOS", "Api.fetchText: GET ${req.url}")
            val res = client.newCall(req).execute()
            if (res.isSuccessful) {
                val body = res.body?.string().orEmpty()
                // If JSON like {"text":"..."} pull text, else return raw
                jsonOrNull(body)?.optString("text", null)?.let { return@withContext it }
                return@withContext body
            } else {
                Log.d("SlyOS", "Api.fetchText: HTTP ${res.code} for $p")
            }
        }
        ""
    }

    /** Demo embedding. Server should accept {text} at /api/ops/embed; ignore if 404. */
    suspend fun embedDemo(text: String): List<Double> = withContext(Dispatchers.IO) {
        val bodyJson = JSONObject().put("text", text).toString()
        val req = Request.Builder()
            .url(url("/api/ops/embed"))
            .addDevHeaders()
            .post(bodyJson.toRequestBody("application/json; charset=utf-8".toMediaType()))
            .build()
        Log.d("SlyOS", "Api.embedDemo: POST ${req.url}")
        val res = client.newCall(req).execute()
        Log.d("SlyOS", "Api.embedDemo: HTTP ${res.code}")
        if (!res.isSuccessful) return@withContext emptyList()

        val body = res.body?.string().orEmpty()
        val js = jsonOrNull(body) ?: return@withContext emptyList()
        val arr: JSONArray? =
            if (js.has("vector")) js.optJSONArray("vector")
            else if (js.has("embedding")) js.optJSONArray("embedding")
            else null
        if (arr == null) return@withContext emptyList()
        val out = ArrayList<Double>(arr.length())
        for (i in 0 until arr.length()) out += arr.optDouble(i, 0.0)
        out
    }

    /** Submit string result for a job id (tries several endpoints). */
    suspend fun submit(id: String, result: String): Boolean = withContext(Dispatchers.IO) {
        val bodyJson = JSONObject().put("result", result).toString()
        val paths = listOf(
            "/api/jobs/$id/submit",
            "/api/job/$id/submit",
            "/api/ops/jobs/$id/submit",
            "/api/ops/job/$id/submit",
            "/api/jobs/$id" // some accept POST to job resource
        )
        for (p in paths) {
            val req = Request.Builder()
                .url(url(p))
                .addDevHeaders()
                .post(bodyJson.toRequestBody("application/json; charset=utf-8".toMediaType()))
                .build()
            Log.d("SlyOS", "Api.submit(str): POST ${req.url}")
            val res = client.newCall(req).execute()
            Log.d("SlyOS", "Api.submit(str): HTTP ${res.code}")
            if (res.isSuccessful) return@withContext true
        }
        false
    }

    /** Submit vector result for a job id (same path scan). */
    suspend fun submit(id: String, vector: List<Double>): Boolean = withContext(Dispatchers.IO) {
        val bodyJson = JSONObject().put("vector", JSONArray(vector)).toString()
        val paths = listOf(
            "/api/jobs/$id/submit",
            "/api/job/$id/submit",
            "/api/ops/jobs/$id/submit",
            "/api/ops/job/$id/submit",
            "/api/jobs/$id"
        )
        for (p in paths) {
            val req = Request.Builder()
                .url(url(p))
                .addDevHeaders()
                .post(bodyJson.toRequestBody("application/json; charset=utf-8".toMediaType()))
                .build()
            Log.d("SlyOS", "Api.submit(vec): POST ${req.url}")
            val res = client.newCall(req).execute()
            Log.d("SlyOS", "Api.submit(vec): HTTP ${res.code}")
            if (res.isSuccessful) return@withContext true
        }
        false
    }

    suspend fun submit(id: String, vector: FloatArray): Boolean = submit(id, vector.map { it.toDouble() })
}
