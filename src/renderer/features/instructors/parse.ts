import {
  CONTRACT_START_COLUMN_NAME,
  CONTRACT_REQUIRED_HOURS_COLUMN_NAME,
  HOURS_COLUMN_NAME,
  excelSerialToDate,
  isCedulaHeader,
  sameHeader,
} from '../spreadsheet/helpers.js';
import { MONTH_BLOCK_LABELS } from '../spreadsheet/preview/constants.js';

// Datos de un instructor tomados directamente de las columnas del Excel.
export interface Instructor {
  identification: string;
  name: string;
  program: string;
  hours: string;
  requiredContractHours: string;
  additionalHoursByMonth: Record<number, string>;
  // Fecha de inicio del contrato tal como trae la celda (serial de Excel):
  // null si la hoja no trae la columna o la celda no es una fecha.
  contractStart: Date | null;
}

const NAME_HEADER_HINT = 'NOMBRE';
const PROGRAM_HEADER_HINT = 'PROGRAMA';
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

function findMonthlyAdditionalHoursColumns(rows: unknown[][], headerRow: number): Map<number, number> {
  const monthStarts = (rows[0] ?? []).flatMap((cell, column) => {
    const month = MONTH_BLOCK_LABELS.findIndex((label) => sameHeader(clean(cell), label));
    return month < 0 ? [] : [{ month, column }];
  }).sort((a, b) => a.column - b.column);
  const columns = new Map<number, number>();

  monthStarts.forEach(({ month, column }, index) => {
    const nextMonthColumn = monthStarts[index + 1]?.column ?? Number.POSITIVE_INFINITY;
    for (let row = headerRow; row <= Math.min(headerRow + 2, rows.length - 1); row += 1) {
      const additionalColumn = (rows[row] ?? []).findIndex((cell, currentColumn) => (
        currentColumn >= column
        && currentColumn < nextMonthColumn
        && sameHeader(clean(cell), 'Horas Adicionales')
      ));
      if (additionalColumn !== -1) {
        columns.set(month, additionalColumn);
        break;
      }
    }
  });
  return columns;
}

// Extrae un instructor por cada fila con cédula; ignora filas de totales o notas.
// Si una fila común se repite, acumula los datos mensuales sin duplicar la tarjeta.
export function parseInstructors(sheets: unknown[][][]): Instructor[] {
  const seen = new Map<string, Instructor>();
  const instructors: Instructor[] = [];
  for (const rows of sheets) {
    const headerRow = findHeaderRow(rows);
    if (headerRow === -1) continue;
    const cedulaCol = findColumn(rows, headerRow, isCedulaHeader);
    if (cedulaCol === -1) continue;
    const nameCol = findColumn(rows, headerRow, (header) => header.toLocaleUpperCase().includes(NAME_HEADER_HINT));
    const programCol = findColumn(rows, headerRow, (header) => header.toLocaleUpperCase().includes(PROGRAM_HEADER_HINT));
    const hoursCol = findColumn(rows, headerRow, (header) => sameHeader(header, HOURS_COLUMN_NAME));
    const requiredContractHoursCol = findColumn(
      rows,
      headerRow,
      (header) => sameHeader(header, CONTRACT_REQUIRED_HOURS_COLUMN_NAME),
    );
    const additionalHoursColumns = findMonthlyAdditionalHoursColumns(rows, headerRow);
    // La fecha de inicio del contrato puede quedar una o dos filas bajo la de la
    // cédula (encabezados fusionados); si no existe, el instructor no se marca.
    const startCol = findColumn(rows, headerRow, (header) => sameHeader(header, CONTRACT_START_COLUMN_NAME));
    for (let row = headerRow + 1; row < rows.length; row += 1) {
      const cells = rows[row] ?? [];
      const identification = clean(cells[cedulaCol]);
      if (identification.replace(/\D/g, '').length < MIN_IDENTIFICATION_DIGITS) continue;
      const instructor: Instructor = {
        identification,
        name: nameCol === -1 ? SIN_NOMBRE : clean(cells[nameCol]) || SIN_NOMBRE,
        program: programCol === -1 ? 'Sin programa' : clean(cells[programCol]) || 'Sin programa',
        hours: hoursCol === -1 ? '' : clean(cells[hoursCol]),
        requiredContractHours: requiredContractHoursCol === -1 ? '' : clean(cells[requiredContractHoursCol]),
        additionalHoursByMonth: Object.fromEntries(
          [...additionalHoursColumns].map(([month, column]) => [month, clean(cells[column])]),
        ),
        contractStart: startCol === -1 ? null : excelSerialToDate(cells[startCol]),
      };
      // Clave por fila completa: dos filas idénticas se colapsan, pero la misma
      // persona en dos programas distintos conserva su carnet.
      const signature = [
        instructor.identification,
        instructor.name,
        instructor.program,
        instructor.hours,
        instructor.requiredContractHours,
      ].join('\u0000');
      const existing = seen.get(signature);
      if (existing) {
        Object.entries(instructor.additionalHoursByMonth).forEach(([month, hours]) => {
          if (!existing.additionalHoursByMonth[Number(month)]?.trim()) {
            existing.additionalHoursByMonth[Number(month)] = hours;
          }
        });
        continue;
      }
      seen.set(signature, instructor);
      instructors.push(instructor);
    }
  }
  return instructors;
}
