import { ipcMain } from 'electron';
import { showSystemNotification } from '../services/notifications/index.js';
import { readSettings, updateSettings } from '../services/settings.js';
import type { NotificationPermission, SystemNotification } from '../../shared/index.js';
import { isTrustedSender } from './trusted-sender.js';

const MAX_TITLE_LENGTH = 120;
const MAX_BODY_LENGTH = 500;

function parseNotification(value: unknown): SystemNotification | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.title !== 'string' || typeof raw.body !== 'string') return null;

  const title = raw.title.trim();
  const body = raw.body.trim();
  if (!title || !body || title.length > MAX_TITLE_LENGTH || body.length > MAX_BODY_LENGTH) {
    return null;
  }
  return { title, body };
}

// Canales del permiso y de los avisos del sistema.
export function registerNotificationHandlers(): void {
  // El permiso se pregunta una sola vez y la respuesta se recuerda en disco,
  // así el modal no vuelve a aparecer en los siguientes arranques.
  ipcMain.handle('notifications:permission', (event): NotificationPermission | null => {
    if (!isTrustedSender(event)) return null;
    return readSettings().notifications;
  });

  ipcMain.handle('notifications:set-permission', (event, value: unknown): NotificationPermission | null => {
    if (!isTrustedSender(event)) return null;
    if (value !== 'allowed' && value !== 'denied') return readSettings().notifications;
    return updateSettings({ notifications: value }).notifications;
  });

  // Muestra el aviso nativo; sólo si el usuario lo autorizó y el sistema lo soporta.
  // Devuelve si llegó a mostrarse, para que el renderer pueda usar su respaldo.
  ipcMain.handle('notifications:show', async (event, payload: unknown): Promise<boolean> => {
    if (!isTrustedSender(event)) return false;
    if (readSettings().notifications !== 'allowed') return false;

    const notification = parseNotification(payload);
    if (!notification) return false;
    return showSystemNotification(notification);
  });
}
