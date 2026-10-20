import { hasUnsafeControlChars } from '../../../shared/index.js';

/** Tope de tamaño para un libro enviado desde el renderer (30 MB). */
export const MAX_WORKBOOK_BYTES = 30 * 1024 * 1024;

const MAX_FILE_NAME_LENGTH = 160;
const MAX_TARGETS = 1000;
const MAX_TARGET_LENGTH = 30;

export interface ApplyHoursMultiplePayload {
  data: ArrayBuffer | Uint8Array;
  fileName: string;
  targets: Array<{ identification: string; totalHours: string }>;
}

function readTargetText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (text.length === 0 || text.length > MAX_TARGET_LENGTH) return null;
  if (text.includes(';') || text.includes('|') || text.includes('\n') || text.includes('\r')
    || hasUnsafeControlChars(text)) return null;
  return text;
}

function parseTargets(value: unknown): ApplyHoursMultiplePayload['targets'] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_TARGETS) return null;

  const targets: ApplyHoursMultiplePayload['targets'] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') return null;
    const raw = item as Record<string, unknown>;
    const identification = readTargetText(raw.identification);
    const totalHours = readTargetText(raw.totalHours);
    if (!identification || !totalHours) return null;
    targets.push({ identification, totalHours });
  }
  return targets;
}

/** Deja solo el nombre base del archivo, sin rutas ni caracteres peligrosos. */
function readFileName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  // Se cortan tanto `/` como `\` porque la ruta final se construye en Windows.
  const base = value.replace(/\\/g, '/').split('/').pop()?.trim() ?? '';
  if (!base || base.length > MAX_FILE_NAME_LENGTH) return null;
  if (!/\.(xls|xlsx)$/i.test(base)) return null;
  return base;
}

/**
 * Valida y normaliza el libro que llega por IPC antes de tocar el sistema de
 * archivos o pasárselo a PowerShell.
 */
export function parseApplyHoursPayload(value: unknown): ApplyHoursMultiplePayload | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;

  const data = raw.data;
  if (!(data instanceof ArrayBuffer) && !(data instanceof Uint8Array)) return null;
  if (data.byteLength === 0 || data.byteLength > MAX_WORKBOOK_BYTES) return null;

  const fileName = readFileName(raw.fileName);
  const targets = parseTargets(raw.targets);
  if (!fileName || !targets) return null;

  return { data, fileName, targets };
}

/**
 * Convierte el nombre recibido en un nombre seguro para el directorio temporal.
 *
 * Solo conserva letras, números, guiones, puntos y guiones bajos. El resultado
 * nunca contiene separadores de ruta, así que no puede escapar del directorio
 * creado con `mkdtemp`.
 */
export function safeWorkbookName(fileName: string): string {
  const cleaned = fileName
    .replace(/[^\w.-]/g, '_')
    .replace(/^\.+/, '')
    .slice(0, MAX_FILE_NAME_LENGTH);
  const base = cleaned || 'nomina.xlsx';
  return /\.(xls|xlsx)$/i.test(base) ? base : `${base}.xlsx`;
}
