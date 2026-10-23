export const HOURS_COLUMN_NAME = 'Horas académicas';
const CEDULA_COLUMN_NAMES = ['Columna 3', '# DE DOCUMENTO'];
// Fecha cuyo adelanto marca al "instructor nuevo" y ventana del aviso, en días
// desde hoy de la máquina del usuario.
export const CONTRACT_START_COLUMN_NAME = 'INICIO DEL CONTRATO';
export const CONTRACT_START_WINDOW_DAYS = 30;
export const HOURS_THRESHOLD = 160;
export const GREEN_FILL = 'FF00B050';
export const RED_FILL = 'FFFF0000';

// Convierte el texto del span ("160", "18.36 × 12", etc.) en un número comparable.
export function parseHoursValue(hours: string): number {
  const cleaned = hours.replace(',', '.');
  const parts = cleaned.match(/\d+(?:\.\d+)?/g) ?? [];
  if (parts.length === 0) return Number.NaN;
  return parts.slice(1).reduce((acc, part) => acc * Number(part), Number(parts[0]));
}

// Compara encabezados ignorando acentos y mayúsculas (el Excel puede traer
// "Horas académicas", "HORAS ACADEMICAS", etc.).
export function sameHeader(a: string, b: string): boolean {
  const norm = (s: string): string => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/\s+/g, ' ').trim().toLocaleUpperCase();
  return norm(a) === norm(b);
}

export function isCedulaHeader(text: string): boolean {
  return CEDULA_COLUMN_NAMES.some((name) => sameHeader(text, name));
}

// Serial de Excel (días desde el 1899-12-30) a fecha de calendario. Se trabaja
// en UTC medianoche porque un serial son días exactos; convertir a hora local
// desplazaría el día en zonas horarias (como la de Colombia, UTC-5).
export function excelSerialToDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  // 25569 días separa el epoch de Unix del del Excel (días entre 1970-01-01 y 1899-12-30).
  return new Date(Math.round((value - 25569) * 86400000));
}

// ¿El contrato arranca cerca de hoy (nuevo instructor)? Cubre los dos casos que
// se pueden ver en la nómina: el que recién entró (27 días atrás, por ejemplo)
// y el que entra enseguida. La ventana es en días calendario, no hábiles.
export function isContractStartNearToday(contractStart: Date | null, today: Date = new Date()): boolean {
  if (!contractStart) return false;
  // Ambos extremos a medianoche UTC para comparar fechas enteras, no horas.
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const differences = Math.abs(contractStart.getTime() - todayUtc);
  return differences < CONTRACT_START_WINDOW_DAYS * 86400000;
}

// Escribe el valor de horas tal como llega del span: número si es plano, si el span
// trae una expresión tipo "24.48 × 12" se calcula el producto, si no, texto.
export function hoursCellValue(hours: string): number | string {
  const num = Number(hours.replace(',', '.'));
  if (Number.isFinite(num) && hours.trim() !== '') return num;
  const parsed = parseHoursValue(hours);
  return Number.isFinite(parsed) ? parsed : hours;
}
