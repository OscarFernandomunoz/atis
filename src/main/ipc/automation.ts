import { ipcMain } from 'electron';
import {
  parseSofiaCredentials,
  parseSofiaEndDate,
  parseSofiaIdentifications,
  parseSofiaStartDate,
} from '../services/sofia-plus/credentials.js';
import { openSofiaPlus } from '../services/sofia-plus/index.js';
import { setAutomationPaused } from '../services/sofia-plus/workflow/pause-gate.js';
import { resetSofiaSession } from '../services/sofia-plus/workflow/session-reset.js';
import { isTrustedSender } from './trusted-sender.js';
import { mainLogger } from '../logger.js';

// Canales de la automatización de SofiaPlus.
export function registerAutomationHandlers(): void {
  // Inicia sesión y navega hasta Gestión de Ambientes.
  ipcMain.handle('sofia:open-and-fill', async (event, raw: unknown) => {
    if (!isTrustedSender(event)) throw new Error('Origen no autorizado.');

    const credentials = parseSofiaCredentials(raw);
    const identifications = raw && typeof raw === 'object'
      ? parseSofiaIdentifications((raw as Record<string, unknown>).identifications)
      : null;
    const startDate = raw && typeof raw === 'object'
      ? parseSofiaStartDate((raw as Record<string, unknown>).startDate)
      : null;
    const endDate = raw && typeof raw === 'object'
      ? parseSofiaEndDate((raw as Record<string, unknown>).endDate)
      : null;
    if (!credentials || !identifications || !startDate || !endDate) {
      throw new Error('Los datos de acceso, las cédulas o las fechas no son válidos.');
    }

    try {
      await openSofiaPlus({ ...credentials, identifications, startDate, endDate });
    } catch (error) {
      mainLogger.error('SofiaPlus', 'No se pudo completar el flujo de automatización', error);
      await resetSofiaSession();
      throw error;
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
