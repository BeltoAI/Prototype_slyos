package app.slyos.service

import android.app.*
import android.content.Intent
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.*
import app.slyos.Api

class WorkerService : Service() {
  private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
  private val channelId = "sly_worker"

  override fun onCreate() {
    super.onCreate()
    if (android.os.Build.VERSION.SDK_INT >= 26) {
      val nm = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
      val ch = NotificationChannel(channelId, "SlyOS Worker", NotificationManager.IMPORTANCE_LOW)
      nm.createNotificationChannel(ch)
    }
    val notif = NotificationCompat.Builder(this, channelId)
      .setContentTitle("SlyOS worker")
      .setContentText("Running…")
      .setSmallIcon(android.R.drawable.stat_notify_sync)
      .build()
    startForeground(1, notif)

    scope.launch {
      var backoffMs = 2000L
      while (isActive) {
        try {
          if (Api.deviceId == null) { delay(1500); continue }
          val claim = Api.claim()
          if (claim?._id != null) {
            val preview = when (claim.type) {
              "http_task" -> (Api.fetchText(claim.payload?.get("url") ?: "").ifEmpty { "err" }).take(200)
              "text_embed" -> "embedding:" + Api.embedDemo(claim.payload?.get("text") ?: "")
              else -> "unknown"
            }
            val ok = Api.submit(claim._id!!, preview)
            Log.d("SlyOS.Worker","submit unit=${claim._id} ok=$ok")
            backoffMs = 1000L
            delay(1000)
          } else {
            delay(backoffMs)
            backoffMs = (backoffMs * 1.5).toLong().coerceAtMost(15000L)
          }
        } catch (t:Throwable) {
          Log.e("SlyOS.Worker","loop error", t)
          delay(2000)
        }
      }
    }
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int = START_STICKY
  override fun onBind(intent: Intent?): IBinder? = null
  override fun onDestroy() { scope.cancel(); super.onDestroy() }
}
