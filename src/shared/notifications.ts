/** Contrato compartido entre el proceso principal, el preload y el renderer. */

/** Respuesta del usuario al permiso para usar las notificaciones del sistema. */
export type NotificationPermission = 'allowed' | 'denied';

/** Aviso que se muestra en el centro de notificaciones del sistema operativo. */
export interface SystemNotification {
  title: string;
  body: string;
}
