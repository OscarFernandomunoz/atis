import { ipcMain } from 'electron';
import {
  applyHoursMultipleWithExcel,
  applyHoursWithExcel,
  type ApplyHoursMultiplePayload,
  type ApplyHoursPayload,
} from '../services/spreadsheet/index.js';

// IPC transporta ArrayBuffer; se recorta la vista al rango exacto del buffer.
function toArrayBuffer(result: Uint8Array | null): ArrayBuffer | null {
  return result
    ? result.buffer.slice(result.byteOffset, result.byteOffset + result.byteLength) as ArrayBuffer
    : null;
}

// Canales que escriben las horas en el libro original usando Excel real (COM).
export function registerSpreadsheetHandlers(): void {
  // Escribe las horas en el Excel preservando diseño y filtros.
  ipcMain.handle('excel:apply-hours', async (_event, payload: ApplyHoursPayload): Promise<ArrayBuffer | null> => {
    try {
      return toArrayBuffer(await applyHoursWithExcel(payload));
    } catch (error) {
      console.error('[AIA][Excel] Error al aplicar horas con Excel COM.', error);
      return null;
    }
  });

  // Aplica las horas a TODAS las cédulas en una sola pasada con Excel real (COM).
  ipcMain.handle('excel:apply-hours-multiple', async (_event, payload: ApplyHoursMultiplePayload): Promise<ArrayBuffer | null> => {
    try {
      return toArrayBuffer(await applyHoursMultipleWithExcel(payload));
    } catch (error) {
      console.error('[AIA][Excel] Error al aplicar horas múltiples con Excel COM.', error);
      return null;
    }
  });
}
