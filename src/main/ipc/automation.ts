import { ipcMain } from 'electron';
import { openSofiaPlus, type InstructorHours, type SofiaCredentials } from '../services/sofia-plus/index.js';
import { setAutomationPaused } from '../services/sofia-plus/workflow/pause-gate.js';
import { resetSofiaSession } from '../services/sofia-plus/workflow/session-reset.js';

// Envía un evento de progreso al renderer (resaltado de fila y horas en la vista previa).
function sendProgress(webContents: Electron.WebContents, identification: string | null, hours: string | null): void {
  if (!webContents.isDestroyed()) {
    webContents.send('sofia:progress', identification, hours);
  }
}

// Canales de la automatización de SofiaPlus.
export function registerAutomationHandlers(): void {
  // Ejecuta el flujo completo de login y manejo de SofiaPlus con las credenciales recibidas.
  ipcMain.handle('sofia:open-and-fill', async (event, credentials: SofiaCredentials): Promise<InstructorHours[]> => {
    try {
      return await openSofiaPlus(
        credentials,
        (identification, hours) => sendProgress(event.sender, identification, hours),
      );
    } catch (error) {
      console.error('[AIA][SofiaPlus] No se pudo completar el flujo de automatización.', error);
      throw error;
    } finally {
      // Al terminar (con éxito o con error) se cierra la ventana del portal y se borra su
      // sesión: la próxima corrida vuelve a empezar desde el login, sin quedarse abierta.
      await resetSofiaSession();
    }
  });

  // Pausa o reanuda la automatización en curso sin cortarla: el flujo se detiene en la
  // próxima frontera de paso y continúa desde ese mismo punto.
  ipcMain.on('sofia:set-paused', (_event, paused: unknown) => {
    if (typeof paused !== 'boolean') return;
    setAutomationPaused(paused);
  });
}
