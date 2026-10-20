import { ipcMain } from 'electron';
import { showSystemNotification } from '../services/notifications/index.js';
import { readSettings, updateSettings } from '../services/settings.js';
import type { NotificationPermission, SystemNotification } from '../../shared/index.js';

// Canales del permiso y de los avisos del sistema.
export function registerNotificationHandlers(): void {
  // El permiso se pregunta una sola vez y la respuesta se recuerda en disco,
  // así el modal no vuelve a aparecer en los siguientes arranques.
  ipcMain.handle('notifications:permission', (): NotificationPermission | null => readSettings().notifications);

  ipcMain.handle('notifications:set-permission', (_event, value: unknown): NotificationPermission | null => {
    if (value !== 'allowed' && value !== 'denied') return readSettings().notifications;
    return updateSettings({ notifications: value }).notifications;
  });

  // Muestra el aviso nativo; sólo si el usuario lo autorizó y el sistema lo soporta.
  // Devuelve si llegó a mostrarse, para que el renderer pueda usar su respaldo.
  ipcMain.handle('notifications:show', async (_event, payload: SystemNotification): Promise<boolean> => {
    if (readSettings().notifications !== 'allowed') return false;
    if (typeof payload?.title !== 'string' || typeof payload?.body !== 'string') return false;
    return showSystemNotification({ title: payload.title, body: payload.body });
  });
}
