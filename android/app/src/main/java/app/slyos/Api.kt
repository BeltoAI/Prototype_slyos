package app.slyos

import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL

object Api {
  private const val TAG = "SlyOS.Api"
  private const val TIMEOUT = 15000
  private const val DEFAULT_BASE = "http://127.0.0.1:3000"

  @Volatile private var overrideBase: String? = null
  fun setBase(url: String?) {
    overrideBase = url?.trim()?.ifBlank { null }?.replace("localhost", "127.0.0.1")
    Log.d(TAG, "Using base=" + (overrideBase ?: DEFAULT_BASE))
  }
  fun currentBase(): String = overrideBase ?: DEFAULT_BASE

  var deviceId: String? = null

  private fun readAll(conn: HttpURLConnection): String {
    val reader = BufferedReader(InputStreamReader(
      if (conn.responseCode in 200..299) conn.inputStream else (conn.errorStream ?: conn.inputStream)
    ))
    val sb = StringBuilder()
    var line: String?
    while (reader.readLine().also { line = it } != null) sb.append(line).append('\n')
    reader.close()
    return sb.toString()
  }

  private suspend fun rawGet(path: String): String = withContext(Dispatchers.IO) {
    val u = URL(currentBase() + path)
    val c = (u.openConnection() as HttpURLConnection).apply {
      requestMethod = "GET"; connectTimeout = TIMEOUT; readTimeout = TIMEOUT
    }
    val body = readAll(c); c.disconnect(); body
  }

  private suspend fun rawPost(path: String, jsonBody: JSONObject): String = withContext(Dispatchers.IO) {
    val u = URL(currentBase() + path)
    val c = (u.openConnection() as HttpURLConnection).apply {
      requestMethod = "POST"; doOutput = true
      setRequestProperty("Content-Type","application/json")
      connectTimeout = TIMEOUT; readTimeout = TIMEOUT
    }
    c.outputStream.use { it.write(jsonBody.toString().toByteArray()) }
    val body = readAll(c); c.disconnect(); body
  }

  private suspend fun safeGet(path: String): String? =
    try { rawGet(path) } catch (t:Throwable){ Log.e(TAG, "GET fail $path", t); null }

  private suspend fun safePost(path: String, jsonBody: JSONObject): String? =
    try { rawPost(path, jsonBody) } catch (t:Throwable){ Log.e(TAG, "POST fail $path", t); null }

  suspend fun registerDevice(model:String, osVersion:String): Boolean {
    val txt = safePost("/api/devices/register", JSONObject().put("model", model).put("osVersion", osVersion))
      ?: return false
    return try {
      val jo = JSONObject(txt)
      val id = jo.optString("deviceId", "")
      if (id.isNotEmpty()) { deviceId = id; true } else false
    } catch (_:Throwable){ false }
  }

  suspend fun creditsTotal(): Int {
    return try {
      val txt = safeGet("/api/credits/info") ?: return 0
      JSONObject(txt).optInt("total", 0)
    } catch (_:Throwable){ 0 }
  }

  suspend fun deviceCredits(id:String): Int {
    return try {
      val txt = safeGet("/api/devices/credits?deviceId=$id") ?: return 0
      JSONObject(txt).optInt("total", 0)
    } catch (_:Throwable){ 0 }
  }

  data class Claim(
    val _id:String?, val type:String?, val creditValue:Int?, val payload: Map<String,String>?
  )

  // ********** FIXED HERE **********
  suspend fun claim(): Claim? {
    val id = deviceId ?: return null
    val txt = safePost("/api/units/claim", JSONObject().put("deviceId", id)) ?: return null
    return try {
      val jo = JSONObject(txt)
      // Success == server returns a unit with "_id"
      val unitId = jo.optString("_id", "")
      if (unitId.isEmpty()) return null  // covers {claimed:false, message:"no task"}
      val payload = mutableMapOf<String,String>().apply {
        jo.optJSONObject("payload")?.let { p -> p.keys().forEach { k -> put(k, p.optString(k, "")) } }
      }
      Claim(
        _id = unitId,
        type = jo.optString("type", null),
        creditValue = if (jo.has("creditValue")) jo.optInt("creditValue") else null,
        payload = payload
      )
    } catch (_:Throwable){ null }
  }
  // ********************************

  suspend fun submit(unitId:String, preview:String): Boolean {
    val id = deviceId ?: return false
    val res = JSONObject().put("status","ok").put("preview", preview)
    val body = JSONObject().put("jobUnitId", unitId).put("deviceId", id).put("result", res).put("runtimeMs", 42)
    val txt = safePost("/api/units/submit", body) ?: return false
    return try { JSONObject(txt).optBoolean("ok", false) } catch (_:Throwable){ false }
  }

  suspend fun fetchText(url:String): String = withContext(Dispatchers.IO) {
    try {
      val u = URL(url)
      val c = (u.openConnection() as HttpURLConnection).apply {
        requestMethod = "GET"; connectTimeout = TIMEOUT; readTimeout = TIMEOUT
      }
      val body = readAll(c); c.disconnect(); body
    } catch (_:Throwable){ "" }
  }

  suspend fun embedDemo(text:String): String = withContext(Dispatchers.IO) {
    try {
      val md = java.security.MessageDigest.getInstance("SHA-256")
      md.digest(text.toByteArray()).joinToString("") { "%02x".format(it) }.take(16)
    } catch (_:Throwable){ "0000000000000000" }
  }
}
