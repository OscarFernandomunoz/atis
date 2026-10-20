import { ipcMain } from 'electron';
import { parseSofiaCredentials } from '../services/sofia-plus/credentials.js';
import { openSofiaPlus, type InstructorHours } from '../services/sofia-plus/index.js';
import { setAutomationPaused } from '../services/sofia-plus/workflow/pause-gate.js';
import { resetSofiaSession } from '../services/sofia-plus/workflow/session-reset.js';
import { isTrustedSender } from './trusted-sender.js';
import { mainLogger } from '../logger.js';

// Envía un evento de progreso al renderer (resaltado de fila y horas en la vista previa).
function sendProgress(webContents: Electron.WebContents, identification: string | null, hours: string | null): void {
  if (!webContents.isDestroyed()) {
    webContents.send('sofia:progress', identification, hours);
  }
}

// Canales de la automatización de SofiaPlus.
export function registerAutomationHandlers(): void {
  // Ejecuta el flujo completo de login y manejo de SofiaPlus con las credenciales recibidas.
  ipcMain.handle('sofia:open-and-fill', async (event, raw: unknown): Promise<InstructorHours[]> => {
    if (!isTrustedSender(event)) throw new Error('Origen no autorizado.');

    const credentials = parseSofiaCredentials(raw);
    if (!credentials) throw new Error('Los datos de acceso no son válidos.');

    try {
      return await openSofiaPlus(
        credentials,
        (identification, hours) => sendProgress(event.sender, identification, hours),
      );
    } catch (error) {
      mainLogger.error('SofiaPlus', 'No se pudo completar el flujo de automatización', error);
      throw error;
    } finally {
      // Al terminar (con éxito o con error) se cierra la ventana del portal y se borra su
      // sesión: la próxima corrida vuelve a empezar desde el login, sin quedarse abierta.
      await resetSofiaSession();
    }
  });

  // Pausa o reanuda la automatización en curso sin cortarla: el flujo se detiene en la
  // próxima frontera de paso y continúa desde ese mismo punto.
  ipcMain.on('sofia:set-paused', (event, paused: unknown) => {
    if (!isTrustedSender(event)) return;
    if (typeof paused !== 'boolean') return;
    setAutomationPaused(paused);
  });
}
