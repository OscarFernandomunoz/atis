import { BrowserWindow, ipcMain } from 'electron';
import { openSofiaPlus, type InstructorHours, type SofiaCredentials } from '../services/sofia-plus/index.js';
import { setAutomationPaused } from '../services/sofia-plus/flow/pause-gate.js';
import { applyHoursWithExcel, type ApplyHoursPayload } from '../services/excel/apply-hours.js';
import { applyHoursMultipleWithExcel, type ApplyHoursMultiplePayload } from '../services/excel/apply-hours-multiple.js';
import { showSystemNotification } from '../services/notifications.js';
import { readSettings, updateSettings } from '../services/settings.js';
import { applyTitleBarTheme } from '../windows/appearance.js';
import type { NotificationPermission, SystemNotification } from '../../shared/notifications.js';

// Envía un evento de progreso al renderer (resaltado de fila y horas en la vista previa).
function sendProgress(webContents: Electron.WebContents, identification: string | null, hours: string | null): void {
  if (!webContents.isDestroyed()) {
    webContents.send('sofia:progress', identification, hours);
  }
}

// Registra los canales IPC que usa la app para comunicarse entre el renderer y el proceso principal.
export function registerIpcHandlers(): void {
  try {
    // Ejecuta el flujo completo de login y manejo de SofiaPlus con las credenciales recibidas.
    ipcMain.handle('sofia:open-and-fill', async (event, credentials: SofiaCredentials): Promise<InstructorHours[]> => {
      try {
        return await openSofiaPlus(credentials, (identification, hours) => sendProgress(event.sender, identification, hours));
      } catch (error) {
        console.error('[AIA][SofiaPlus] No se pudo completar el flujo de automatización.', error);
        throw error;
      }
    });

    // Pausa o reanuda la automatización en curso sin cortarla: el flujo se detiene en la
    // próxima frontera de paso y continúa desde ese mismo punto.
    ipcMain.on('sofia:set-paused', (_event, paused: unknown) => {
      if (typeof paused !== 'boolean') return;
      setAutomationPaused(paused);
    });

    // Escribe las horas en el Excel con Excel real (COM) preservando diseño y filtros.
    ipcMain.handle('excel:apply-hours', async (_event, payload: ApplyHoursPayload): Promise<ArrayBuffer | null> => {
      try {
        const result = await applyHoursWithExcel(payload);
        return result ? result.buffer.slice(result.byteOffset, result.byteOffset + result.byteLength) as ArrayBuffer : null;
      } catch (error) {
        console.error('[AIA][Excel] Error al aplicar horas con Excel COM.', error);
        return null;
      }
    });

    // Aplica las horas a TODAS las cédulas en una sola pasada con Excel real (COM).
    ipcMain.handle('excel:apply-hours-multiple', async (_event, payload: ApplyHoursMultiplePayload): Promise<ArrayBuffer | null> => {
      try {
        const result = await applyHoursMultipleWithExcel(payload);
        return result ? result.buffer.slice(result.byteOffset, result.byteOffset + result.byteLength) as ArrayBuffer : null;
      } catch (error) {
        console.error('[AIA][Excel] Error al aplicar horas múltiples con Excel COM.', error);
        return null;
      }
    });

    // Permiso de notificaciones: se pregunta una sola vez y la respuesta se recuerda
    // en disco, así el modal no vuelve a aparecer en los siguientes arranques.
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

    // Sincroniza el tema y la barra nativa de todas las ventanas de la app.
    ipcMain.on('window:set-title-bar-theme', (event, theme: unknown) => {
      if (theme !== 'light' && theme !== 'dark') return;
      if (!BrowserWindow.fromWebContents(event.sender)) return;

      for (const window of BrowserWindow.getAllWindows()) {
        applyTitleBarTheme(window, theme);
      }
    });

    // Los controles de fallback siempre se dirigen a la ventana que envió el evento.
    ipcMain.on('window:minimize', (event) => {
      BrowserWindow.fromWebContents(event.sender)?.minimize();
    });

    ipcMain.on('window:toggle-maximize', (event) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (!win) return;
      if (win.isMaximized()) {
        win.unmaximize();
      } else {
        win.maximize();
      }
    });

    ipcMain.on('window:close', (event) => {
      BrowserWindow.fromWebContents(event.sender)?.close();
    });

    ipcMain.handle('window:is-maximized', (event) => {
      return BrowserWindow.fromWebContents(event.sender)?.isMaximized() ?? false;
    });
  } catch (error) {
    console.error('[AIA][IPC] No se pudieron registrar los canales IPC.', error);
  }
}
