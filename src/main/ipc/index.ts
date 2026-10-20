import { registerAutomationHandlers } from './automation.js';
import { registerLogHandlers } from './log.js';
import { registerNotificationHandlers } from './notifications.js';
import { registerSpreadsheetHandlers } from './spreadsheet.js';
import { registerWindowHandlers } from './window.js';
import { mainLogger } from '../logger.js';

// Registra los canales IPC agrupados por dominio. Cada módulo es dueño de sus
// canales para que el renderer no dependa de un único archivo monolítico.
export function registerIpcHandlers(): void {
  try {
    // El logger va primero: si otro canal falla al registrarse, el error del
    // renderer ya tiene un destino en la terminal.
    registerLogHandlers();
    registerAutomationHandlers();
    registerSpreadsheetHandlers();
    registerNotificationHandlers();
    registerWindowHandlers();
  } catch (error) {
    mainLogger.error('IPC', 'No se pudieron registrar los canales IPC', error);
  }
}
