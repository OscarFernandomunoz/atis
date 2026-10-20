import type { NotificationPermission } from '../../../shared/index.js';
import { loadNotificationPermission, rememberNotificationPermission } from './permission.js';

/**
 * Modal que pide permiso para usar las notificaciones del computador.
 *
 * Se muestra una sola vez, al abrir la aplicación: mientras el usuario no
 * responda, no hay decisión guardada. Cerrar con la equis, con Escape o con el
 * fondo cuenta como "ahora no", así el permiso no vuelve a interrumpir.
 */
export function initNotificationConsent(): void {
  const modal = document.getElementById('notificationsModal');
  const backdrop = document.getElementById('notificationsBackdrop');
  const closeButton = document.getElementById('notificationsClose');
  const denyButton = document.getElementById('notificationsDeny');
  const allowButton = document.getElementById('notificationsAllow');
  if (!modal || !backdrop || !closeButton || !denyButton || !allowButton) return;

  let decided = false;

  const decide = (permission: NotificationPermission): void => {
    if (decided) return;
    decided = true;
    modal.hidden = true;
    void rememberNotificationPermission(permission);
  };

  allowButton.addEventListener('click', () => decide('allowed'));
  denyButton.addEventListener('click', () => decide('denied'));
  closeButton.addEventListener('click', () => decide('denied'));
  backdrop.addEventListener('click', () => decide('denied'));
  document.addEventListener('keydown', (event) => {
    // Sólo responde cuando el modal está delante; si no, la tecla es de otra ventana.
    if (event.key !== 'Escape' || modal.hidden) return;
    decide('denied');
  });

  void loadNotificationPermission().then((permission) => {
    if (permission !== null) return;
    modal.hidden = false;
    allowButton.focus();
  });
}
