package app.slyos

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import kotlinx.coroutines.launch

class MainActivity: ComponentActivity(){
  override fun onCreate(savedInstanceState: Bundle?){
    super.onCreate(savedInstanceState)
    if (Build.VERSION.SDK_INT >= 33 &&
      checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
      requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), 1001)
    }
    setContent { app.slyos.ui.theme.SlyTheme { App() } }
  }
}

private fun prefs(ctx:Context) = ctx.getSharedPreferences("slyos", Context.MODE_PRIVATE)

@Composable
fun App(){
  val ctx = androidx.compose.ui.platform.LocalContext.current
  val scope = rememberCoroutineScope()

  var status by remember{ mutableStateOf("Idle") }
  var deviceReady by remember{ mutableStateOf(false) }
  var totalCredits by remember { mutableStateOf(0) }
  var phoneCredits by remember { mutableStateOf(0) }
  var serverBase by remember {
    mutableStateOf(prefs(ctx).getString("server_base", BuildConfig.API_BASE) ?: BuildConfig.API_BASE)
  }

  fun refreshCredits(){
    scope.launch {
      totalCredits = Api.creditsTotal()
      val id = Api.deviceId
      phoneCredits = if(id!=null) Api.deviceCredits(id) else 0
    }
  }
  fun startSvc(){
    try {
      ContextCompat.startForegroundService(ctx, Intent(ctx, app.slyos.service.WorkerService::class.java))
      status = "Worker running"
    } catch (t:Throwable){ status = "Start svc failed: ${t.javaClass.simpleName}" }
  }
  fun stopSvc(){
    ctx.stopService(Intent(ctx, app.slyos.service.WorkerService::class.java))
    status = "Worker stopped"
  }

  LaunchedEffect(Unit){
    Api.setBase(serverBase)
    Api.deviceId = prefs(ctx).getString("device_id", null)
    deviceReady = Api.deviceId != null
    if (!deviceReady) {
      val ok = Api.registerDevice(android.os.Build.MODEL, android.os.Build.VERSION.RELEASE ?: "Android")
      if (ok) {
        prefs(ctx).edit().putString("device_id", Api.deviceId).apply()
        deviceReady = true
      }
    }
    if (deviceReady) startSvc()
    refreshCredits()
  }

  Column(Modifier.padding(16.dp).fillMaxSize(), verticalArrangement = Arrangement.spacedBy(12.dp)) {
    Text("SlyOS Worker", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.SemiBold)

    Card {
      Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("Server", style = MaterialTheme.typography.titleMedium)
        OutlinedTextField(
          value = serverBase,
          onValueChange = { serverBase = it },
          modifier = Modifier.fillMaxWidth(),
          placeholder = { Text("http://127.0.0.1:3000 (USB) or http://<LAN-IP>:3000") },
          singleLine = true
        )
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
          Button(onClick={
            prefs(ctx).edit().putString("server_base", serverBase).apply()
            Api.setBase(serverBase); status = "Saved base"
          }){ Text("Save") }
          OutlinedButton(onClick={ scope.launch { status = "Ping ok (total=${Api.creditsTotal()})" } }){ Text("Ping") }
        }
      }
    }

    Card {
      Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("Device", style = MaterialTheme.typography.titleMedium)
        if(!deviceReady){
          Button(onClick={
            scope.launch {
              val ok = Api.registerDevice(android.os.Build.MODEL, android.os.Build.VERSION.RELEASE ?: "Android")
              deviceReady = ok
              status = if(ok) "Device registered" else "Register failed"
              if(ok) { prefs(ctx).edit().putString("device_id", Api.deviceId).apply(); startSvc() }
              refreshCredits()
            }
          }){ Text("Register device") }
        } else {
          val id = Api.deviceId ?: prefs(ctx).getString("device_id", null) ?: "?"
          if(Api.deviceId==null) Api.deviceId = prefs(ctx).getString("device_id", null)
          Text("Registered ✓ (…${id.takeLast(6)})")
          Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedButton(onClick={ startSvc() }){ Text("Start worker") }
            OutlinedButton(onClick={ stopSvc() }){ Text("Stop worker") }
          }
        }
        Text("Status: $status", maxLines = 1, overflow = TextOverflow.Ellipsis)
      }
    }

    Card {
      Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text("Credits", style = MaterialTheme.typography.titleMedium)
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
          Column { Text("Global total"); Text("$totalCredits", style = MaterialTheme.typography.titleLarge) }
          Column { Text("This phone");   Text("$phoneCredits", style = MaterialTheme.typography.titleLarge) }
        }
        OutlinedButton(onClick={ refreshCredits() }, modifier = Modifier.align(Alignment.End)) { Text("Refresh") }
      }
    }
  }
}
