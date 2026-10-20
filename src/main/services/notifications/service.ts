import { Notification } from 'electron';
import type { SystemNotification } from '../../../shared/index.js';
import { isWsl } from '../platform/index.js';
import { showWindowsToast } from './windows-toast.js';

// Espera máxima a que el sistema confirme que el aviso llegó a la pantalla.
const CONFIRMATION_TIMEOUT_MS = 1000;

/**
 * Muestra un aviso en las notificaciones del computador.
 *
 * Resuelve `true` sólo cuando el aviso llegó al escritorio; con `false` el
 * renderer muestra su respaldo dentro de la app para no perder el mensaje.
 *
 * En WSL el escritorio real es Windows y la sesión de Linux no tiene servicio de
 * notificaciones, así que ahí se publica directamente como notificación de Windows.
 */
export async function showSystemNotification(notification: SystemNotification): Promise<boolean> {
  if (isWsl() && await showWindowsToast(notification)) return true;
  return showNativeNotification(notification);
}

/**
 * Notificación nativa de Electron (Windows, macOS y Linux con servicio de
 * notificaciones).
 *
 * En Linux `Notification.isSupported()` devuelve `true` aunque el escritorio no
 * tenga demonio: libnotify falla en silencio y no emite ningún evento, así que la
 * única pista es que `show` no llega a dispararse.
 */
function showNativeNotification({ title, body }: SystemNotification): Promise<boolean> {
  if (!Notification.isSupported()) return Promise.resolve(false);

  return new Promise((resolve) => {
    const notification = new Notification({ title, body });
    // `resolve` ignora las llamadas posteriores, así que gana quien llegue primero.
    const timer = setTimeout(() => resolve(false), CONFIRMATION_TIMEOUT_MS);
    timer.unref();

    notification.once('show', () => {
      clearTimeout(timer);
      resolve(true);
    });
    notification.once('failed', () => {
      clearTimeout(timer);
      resolve(false);
    });

    notification.show();
  });
}
