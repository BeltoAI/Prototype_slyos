package app.slyos.ui.theme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColors = darkColorScheme(
  primary = Color(0xFF7C5CFC),
  surface = Color(0xFF121217),
  background = Color(0xFF0B0B0F)
)

@Composable
fun SlyTheme(content: @Composable () -> Unit) {
  MaterialTheme(colorScheme = DarkColors, typography = Typography(), content = content)
}
