import { notificationsAllowed } from './permission.js';
import { showInAppNotice } from './toast.js';

/**
 * Avisa al usuario de que algo salió mal.
 *
 * El aviso viaja al proceso principal, que lo publica en las notificaciones del
 * computador (en WSL, como notificación de Windows). Si el equipo no puede
 * mostrarlo —escritorio de Linux sin demonio de notificaciones, por ejemplo— el
 * aviso no se pierde: aparece como tarjeta flotante dentro de la app. Sin permiso
 * del usuario no se muestra nada más: el mensaje que cada pantalla escribe en la
 * barra inferior queda como aviso.
 */
export async function notify(title: string, body: string): Promise<void> {
  if (!notificationsAllowed()) return;
  try {
    const shown = await window.electronAPI.notifySystem({ title, body });
    if (!shown) showInAppNotice(title, body);
  } catch (error) {
    console.error('[AIA][Notificaciones] No se pudo mostrar el aviso del sistema.', error);
    showInAppNotice(title, body);
  }
}
