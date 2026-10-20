import { REQUIRED_COLUMN_LABEL, REQUIRED_COLUMN_NAMES } from './constants.js';

// Busca en qué fila y columna aparece el encabezado obligatorio. Se compara sin
// distinguir mayúsculas ni espacios repetidos porque el Excel lo escribe a mano.
export function findRequiredColumnIndex(rows: unknown[][]): { headerRowIndex: number; columnIndex: number } | null {
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const columnIndex = (rows[rowIndex] ?? []).findIndex((cell) => REQUIRED_COLUMN_NAMES.some((name) => (
      name.toLocaleUpperCase() === String(cell ?? '').trim().replace(/\s+/g, ' ').toLocaleUpperCase()
    )));
    if (columnIndex !== -1) return { headerRowIndex: rowIndex, columnIndex };
  }
  return null;
}

export function validateRequiredColumn(rows: unknown[][], sheetName: string): string | null {
  if (!findRequiredColumnIndex(rows)) {
    return `La hoja "${sheetName}" no tiene ${REQUIRED_COLUMN_LABEL}. Ese campo es obligatorio.`;
  }
  return null;
}

export function getAllIdentifications(rows: unknown[][]): string[] {
  const requiredColumn = findRequiredColumnIndex(rows);
  if (!requiredColumn) return [];
  return rows.slice(requiredColumn.headerRowIndex + 1)
    .map((row) => String((row ?? [])[requiredColumn.columnIndex] ?? '').trim())
    // Con encabezados de dos filas, la fila descriptiva ("Cédula", etc.) aparece
    // justo debajo; una cédula real siempre tiene 6+ dígitos.
    .filter((value) => value.replace(/\D/g, '').length >= 6);
}
