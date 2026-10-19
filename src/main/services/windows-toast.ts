import type { SystemNotification } from '../../shared/notifications.js';
import { psString, runPowerShell } from './powershell.js';
import { WINDOWS_AUMID, ensureWindowsAppId } from './windows-app-id.js';

// Identificador de fábrica de PowerShell: se usa sólo si no se pudo registrar el
// propio, para que el aviso salga igual aunque sin el nombre de la app.
const POWERSHELL_AUMID = '{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}\\WindowsPowerShell\\v1.0\\powershell.exe';

// PowerShell tarda en arrancar; si no contesta a tiempo, el renderer usa su respaldo.
const TIMEOUT_MS = 8000;

/**
 * ¿La app corre dentro de WSL?
 *
 * WSLg dibuja las ventanas de Linux en Windows, pero la sesión de Linux no tiene
 * servicio de notificaciones (libnotify falla en silencio, igual que `notify-send`).
 * Como el escritorio real es Windows, ahí sí se pueden publicar los avisos.
 */
export function isWsl(): boolean {
  return Boolean(process.env.WSL_DISTRO_NAME || process.env.WSL_INTEROP);
}

// El texto lo aporta el usuario, así que se escapa como XML antes de armar el aviso.
function buildScript(aumid: string, { title, body }: SystemNotification): string {
  return [
    "$ErrorActionPreference = 'Stop'",
    '[void][Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime]',
    '[void][Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime]',
    `$title = ${psString(title)}`,
    `$body = ${psString(body)}`,
    '$xml = New-Object Windows.Data.Xml.Dom.XmlDocument',
    `$xml.LoadXml('<toast><visual><binding template="ToastGeneric"><text>' + [System.Security.SecurityElement]::Escape($title) + '</text><text>' + [System.Security.SecurityElement]::Escape($body) + '</text></binding></visual></toast>')`,
    '$toast = New-Object Windows.UI.Notifications.ToastNotification $xml',
    `[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier(${psString(aumid)}).Show($toast)`,
  ].join('; ');
}

/**
 * Publica el aviso como notificación nativa de Windows.
 *
 * Primero se asegura de que Windows conozca la app (nombre y logo registrados);
 * si eso no es posible, el aviso sale igualmente atribuido a PowerShell.
 */
export async function showWindowsToast(notification: SystemNotification): Promise<boolean> {
  const identified = await ensureWindowsAppId();
  return runPowerShell(buildScript(identified ? WINDOWS_AUMID : POWERSHELL_AUMID, notification), TIMEOUT_MS);
}
