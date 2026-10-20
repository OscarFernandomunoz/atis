import { ipcMain } from 'electron';
import { parseApplyHoursPayload } from '../services/spreadsheet/payload.js';
import {
  applyHoursMultipleWithExcel,
  type ApplyHoursMultiplePayload,
} from '../services/spreadsheet/index.js';
import { isTrustedSender } from './trusted-sender.js';

// IPC transporta ArrayBuffer; se recorta la vista al rango exacto del buffer.
function toArrayBuffer(result: Uint8Array | null): ArrayBuffer | null {
  return result
    ? result.buffer.slice(result.byteOffset, result.byteOffset + result.byteLength) as ArrayBuffer
    : null;
}

// Canales que escriben las horas en el libro original usando Excel real (COM).
export function registerSpreadsheetHandlers(): void {
  // Aplica las horas a TODAS las cédulas en una sola pasada con Excel real (COM).
  ipcMain.handle('excel:apply-hours-multiple', async (event, raw: unknown): Promise<ArrayBuffer | null> => {
    if (!isTrustedSender(event)) return null;

    const payload: ApplyHoursMultiplePayload | null = parseApplyHoursPayload(raw);
    if (!payload) {
      console.warn('[AIA][Excel] Se rechazó un libro con formato o tamaño no válido.');
      return null;
    }

    try {
      return toArrayBuffer(await applyHoursMultipleWithExcel(payload));
    } catch (error) {
      console.error('[AIA][Excel] Error al aplicar horas múltiples con Excel COM.', error);
      return null;
    }
  });
}
