import { registerAutomationHandlers } from './automation.js';
import { registerNotificationHandlers } from './notifications.js';
import { registerSpreadsheetHandlers } from './spreadsheet.js';
import { registerWindowHandlers } from './window.js';

// Registra los canales IPC agrupados por dominio. Cada módulo es dueño de sus
// canales para que el renderer no dependa de un único archivo monolítico.
export function registerIpcHandlers(): void {
  try {
    registerAutomationHandlers();
    registerSpreadsheetHandlers();
    registerNotificationHandlers();
    registerWindowHandlers();
  } catch (error) {
    console.error('[AIA][IPC] No se pudieron registrar los canales IPC.', error);
  }
}
