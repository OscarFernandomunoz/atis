import * as XLSX from 'xlsx';
import { normalizeIdentification, sameHeader } from '../helpers.js';
import { CONTRACT_DATE_COLUMN_NAMES } from './constants.js';
import { columnWindowOf, type ColumnWindow } from './column-window.js';
import type { StyledCell } from './styled-cell.js';
import { textOf, fillOf } from './styled-cell.js';

/**
 * Tabla montada con el formato del archivo Excel original.
 *
 * El preview genérico (`table.ts`) solo copia valores, así que un archivo como
 * "CONTROL DE HORAS CAPE" pierde su identidad: bloques de mes combinados y una
 * fila de fondo por persona. Aquí se reconstruye desde la hoja directamente para
 * respetar rellenos, celdas combinadas y el texto en el formato en que Excel lo
 * muestra (fechas "2/2/26", importes con el formato de la celda, etc.).
 * Si la hoja no trae ninguno de relleno sólido, devuelve null y el controlador
 * cae a la vista genérica.
 */

/** Qué celdas tapa cada fusión y su tamaño, para usarlas como colSpan/rowSpan. */
function describeMerges(
  sheet: XLSX.WorkSheet,
  allowed: Set<number> | null,
): {
  covered: Set<string>;
  spanAt: Map<string, { c: number; r: number }>;
  extentColumn: number;
  extentRow: number;
} {
  const covered = new Set<string>();
  const spanAt = new Map<string, { c: number; r: number }>();
  let extentColumn = -1;
  let extentRow = -1;
  for (const merge of sheet['!merges'] ?? []) {
    // Con ventana de meses, una fusión que toque columnas apartadas se descarta:
    // las celdas de su parte visible se pintan una por una con su propio relleno.
    if (allowed) {
      let inside = true;
      for (let c = merge.s.c; c <= merge.e.c; c += 1) {
        if (!allowed.has(c)) {
          inside = false;
          break;
        }
      }
      if (!inside) continue;
    }
    spanAt.set(`${merge.s.r}:${merge.s.c}`, {
      c: merge.e.c - merge.s.c + 1,
      r: merge.e.r - merge.s.r + 1,
    });
    extentColumn = Math.max(extentColumn, merge.e.c);
    extentRow = Math.max(extentRow, merge.e.r);
    // Solo la primera celda de la fusión se pinta: el resto se salta.
    for (let r = merge.s.r; r <= merge.e.r; r += 1) {
      for (let c = merge.s.c; c <= merge.e.c; c += 1) {
        if (r !== merge.s.r || c !== merge.s.c) covered.add(`${r}:${c}`);
      }
    }
  }
  return { covered, spanAt, extentColumn, extentRow };
}

/** Borde útil del archivo dentro de la ventana: se recortan las columnas y filas
 * finales sin valor ni fondo. */
function lastUsedExtent(
  sheet: XLSX.WorkSheet,
  range: XLSX.Range,
  minColumn: number,
  minRow: number,
  window: ColumnWindow | null,
): { maxColumn: number; maxRow: number } {
  const maxAllowedColumn = window ? window.end : range.e.c;
  let maxColumn = minColumn;
  let maxRow = minRow;
  for (let r = range.s.r; r <= range.e.r; r += 1) {
    for (let c = range.s.c; c <= Math.min(range.e.c, maxAllowedColumn); c += 1) {
      if (window && !window.allowed.has(c)) continue;
      const cell = sheet[XLSX.utils.encode_cell({ r, c })] as StyledCell | undefined;
      if (textOf(cell) === '' && fillOf(cell) === null) continue;
      maxColumn = Math.max(maxColumn, c);
      maxRow = Math.max(maxRow, r);
    }
  }
  return { maxColumn, maxRow };
}

/** Columnas (por índice) de la última fila de encabezado con título de fecha de contrato. */
function findContractDateColumns(sheet: XLSX.WorkSheet, headerRowCount: number, maxColumn: number): Set<number> {
  const columns = new Set<number>();
  const headingRow = headerRowCount - 1;
  for (let c = 0; c <= maxColumn; c += 1) {
    const heading = textOf(sheet[XLSX.utils.encode_cell({ r: headingRow, c })] as StyledCell | undefined).trim();
    if (CONTRACT_DATE_COLUMN_NAMES.some((name) => sameHeader(heading, name))) columns.add(c);
  }
  return columns;
}

/** Construye la tabla con el formato propio de la hoja, o null si la hoja no trae rellenos.
 *
 * `months` lista los meses (0 = enero) que se muestran: la parte común del
 * principio más los bloques de esos meses. null muestra el archivo completo.
 */
export function buildStyledTable(
  sheet: XLSX.WorkSheet,
  headerRowCount: number,
  requiredColumnIndex: number,
  months: readonly number[] | null = null,
): HTMLTableElement | null {
  const ref = sheet['!ref'];
  if (!ref) return null;
  // Ventana de meses: con meses elegidos solo quedan las columnas de esos bloques.
  const window = months === null ? null : columnWindowOf(sheet, months);
  const allowed = window?.allowed ?? null;
  const { covered, spanAt, extentColumn, extentRow } = describeMerges(sheet, allowed);
  const { maxColumn, maxRow } = lastUsedExtent(sheet, XLSX.utils.decode_range(ref), extentColumn, extentRow, window);
  if (maxColumn < 0 || maxRow < 0) return null;
  // Las fechas del contrato se resaltan en cabecera y cuerpo (clase aplicada por columna).
  const contractColumns = findContractDateColumns(sheet, headerRowCount, maxColumn);

  // Sin ni un relleno el archivo no trae diseño propio: la vista genérica los
  // aplica mejor (tema de la app, rayado suave). Aquí solo vale la pena si hay.
  let sawFill = false;
  const table = document.createElement('table');
  table.classList.add('excel-styled');
  const head = document.createElement('thead');
  const body = document.createElement('tbody');

  for (let r = 0; r <= maxRow; r += 1) {
    const isHeader = r < headerRowCount;
    const row = document.createElement('tr');
    if (!isHeader && requiredColumnIndex <= maxColumn) {
      const identification = textOf(
        sheet[XLSX.utils.encode_cell({ r, c: requiredColumnIndex })] as StyledCell | undefined,
      );
      // Misma convención que la vista genérica: los filtros de carnets y la
      // automatización localizan la fila por `data-identification`.
      const normalizedIdentification = normalizeIdentification(identification);
      if (normalizedIdentification.length >= 6) row.dataset.identification = normalizedIdentification;
    }
    for (let c = 0; c <= maxColumn; c += 1) {
      // Con ventana de meses, las columnas apartadas no se pintan.
      if (allowed && !allowed.has(c)) continue;
      // Las celdas tapadas por una fusión no se pinta: solo su origen con colspan.
      if (covered.has(`${r}:${c}`)) continue;
      const cell = sheet[XLSX.utils.encode_cell({ r, c })] as StyledCell | undefined;
      const isNumeric = !isHeader && cell?.t === 'n';
      const element = document.createElement(isHeader ? 'th' : 'td');
      element.textContent = textOf(cell);
      // Coordenadas en el DOM: la edición en vivo (cell-editing.ts) localiza la
      // celda de la hoja por su dirección A1 para escribir y recalcular.
      if (!isHeader) {
        element.dataset.r = String(r);
        element.dataset.c = String(c);
      }
      sawFill = fillOf(cell) !== null || sawFill;
      const fill = fillOf(cell);
      if (fill) element.style.backgroundColor = fill;
      // Excel alinea números y fechas a la derecha cuando la celda usa
      // alineación general: se respeta para que la tabla se lea como el archivo.
      if (isNumeric) element.style.textAlign = 'right';
      if (c === requiredColumnIndex) element.classList.add('excel-required-column');
      // Del título de fechas del contrato hacia abajo va el resaltado: la fila
      // de meses combinados no.
      if (contractColumns.has(c) && r >= headerRowCount - 1) element.classList.add('excel-contract-column');
      // Los bloques de mes combinados se centraban en el Excel: se respeta.
      const span = spanAt.get(`${r}:${c}`);
      if (span) {
        if (span.c > 1) {
          element.colSpan = span.c;
          element.style.textAlign = 'center';
        }
        if (span.r > 1) element.rowSpan = span.r;
      }
      // Sello en la esquina de las celdas con fórmula: avisa que al hacer clic
      // se ve la fórmula completa en la barra (y que dependen de otras celdas).
      if (cell?.f) element.classList.add('excel-formula');
      row.appendChild(element);
    }
    (isHeader ? head : body).appendChild(row);
  }

  if (!sawFill) return null;
  table.append(head, body);
  return table;
}
