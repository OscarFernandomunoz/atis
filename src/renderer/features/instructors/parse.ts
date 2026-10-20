import { HOURS_COLUMN_NAME, isCedulaHeader, sameHeader } from '../spreadsheet/helpers.js';

// Datos de un instructor tomados directamente de las columnas del Excel.
export interface Instructor {
  identification: string;
  name: string;
  program: string;
  hours: string;
}

const NAME_HEADER_HINT = 'NOMBRE';
const PROGRAM_HEADER_HINT = 'PROGRAMA';
const HOURS_HEADER_HINT = 'HORA';
// Nombre de relleno cuando la hoja no trae columna de nombre o la celda está vacía.
export const SIN_NOMBRE = 'Sin nombre';
// Una cédula real trae varios dígitos; un umbral bajo permite cédulas cortas sin
// dejar entrar filas de totales o notas (que no traen dígitos en la columna).
const MIN_IDENTIFICATION_DIGITS = 4;

function clean(value: unknown): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

// La cabecera del Excel ocupa dos filas ("COLUMNA 3 *" arriba y "# DE DOCUMENTO"
// abajo), por eso cada etiqueta se busca en la fila de la cédula y las dos siguientes.
function findColumn(rows: unknown[][], startRow: number, match: (header: string) => boolean): number {
  for (let row = startRow; row <= Math.min(startRow + 2, rows.length - 1); row += 1) {
    const index = (rows[row] ?? []).findIndex((cell) => match(clean(cell)));
    if (index !== -1) return index;
  }
  return -1;
}

function findHeaderRow(rows: unknown[][]): number {
  return rows.findIndex((row) => (row ?? []).some((cell) => isCedulaHeader(clean(cell))));
}

// Extrae un instructor por cada fila con cédula; ignora filas de totales o notas.
// Solo se descartan las filas repetidas idénticas, para que ningún instructor falte.
export function parseInstructors(sheets: unknown[][][]): Instructor[] {
  const seen = new Set<string>();
  const instructors: Instructor[] = [];
  for (const rows of sheets) {
    const headerRow = findHeaderRow(rows);
    if (headerRow === -1) continue;
    const cedulaCol = findColumn(rows, headerRow, isCedulaHeader);
    if (cedulaCol === -1) continue;
    const nameCol = findColumn(rows, headerRow, (header) => header.toLocaleUpperCase().includes(NAME_HEADER_HINT));
    const programCol = findColumn(rows, headerRow, (header) => header.toLocaleUpperCase().includes(PROGRAM_HEADER_HINT));
    const hoursCol = findColumn(rows, headerRow, (header) => sameHeader(header, HOURS_COLUMN_NAME)
      || header.toLocaleUpperCase().includes(HOURS_HEADER_HINT));
    for (let row = headerRow + 1; row < rows.length; row += 1) {
      const cells = rows[row] ?? [];
      const identification = clean(cells[cedulaCol]);
      if (identification.replace(/\D/g, '').length < MIN_IDENTIFICATION_DIGITS) continue;
      const instructor: Instructor = {
        identification,
        name: nameCol === -1 ? SIN_NOMBRE : clean(cells[nameCol]) || SIN_NOMBRE,
        program: programCol === -1 ? 'Sin programa' : clean(cells[programCol]) || 'Sin programa',
        hours: hoursCol === -1 ? '' : clean(cells[hoursCol]),
      };
      // Clave por fila completa: dos filas idénticas se colapsan, pero la misma
      // persona en dos programas distintos conserva su carnet.
      const signature = [instructor.identification, instructor.name, instructor.program, instructor.hours].join('\u0000');
      if (seen.has(signature)) continue;
      seen.add(signature);
      instructors.push(instructor);
    }
  }
  return instructors;
}
