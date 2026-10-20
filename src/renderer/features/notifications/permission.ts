import type { NotificationPermission } from '../../../shared/index.js';

/**
 * Permiso de notificaciones del sistema.
 *
 * El proceso principal guarda la respuesta, pero se copia en memoria para no
 * preguntarle en cada aviso: durante la automatización pueden salir varios.
 */

let current: NotificationPermission | null = null;
let loaded = false;

/** Recupera la decisión del usuario; sólo consulta al proceso principal la primera vez. */
export async function loadNotificationPermission(): Promise<NotificationPermission | null> {
  if (!loaded) {
    current = await window.electronAPI.getNotificationPermission();
    loaded = true;
  }
  return current;
}

/** Recuerda la respuesta del usuario y la persiste para los siguientes arranques. */
export async function rememberNotificationPermission(permission: NotificationPermission): Promise<void> {
  current = permission;
  loaded = true;
  await window.electronAPI.setNotificationPermission(permission);
}

export function notificationsAllowed(): boolean {
  return current === 'allowed';
}
