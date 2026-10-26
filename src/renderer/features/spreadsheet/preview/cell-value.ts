// Escritura de valores en celdas: lo tecleado se guarda en la hoja de SheetJS
// y el resultado del recálculo se repinta en la tabla. Sin lógica de interfaz.

import * as XLSX from 'xlsx';
import type { WorkSheet } from 'xlsx';
import type { StyledCell } from './styled-cell.js';
import { textOf } from './styled-cell.js';
import { recalcSheet } from './formula/index.js';

/** Contenido crudo de la celda para editar: fórmula con "=", valor sin formato. */
export function rawEditValue(cell: StyledCell | undefined): string {
  if (cell?.f) return `=${cell.f}`;
  return textOf(cell);
}

/** Texto numérico escrito a mano → número (acepta coma decimal y miles con punto). */
export function parseTypedNumber(text: string): number | null {
  if (!/^-?[0-9.,]+$/.test(text) || !/\d/.test(text)) return null;
  const lastDot = text.lastIndexOf('.');
  const lastComma = text.lastIndexOf(',');
  const decimal = Math.max(lastDot, lastComma);
  let normalized: string;
  if (lastDot >= 0 && lastComma >= 0) {
    // Con dos separadores, el último es el decimal y el otro se elimina.
    const decimalChar = lastDot > lastComma ? '.' : ',';
    normalized = [...text].filter((char, index) => char !== decimalChar || index === decimal).join('');
  } else {
    normalized = text.replace(/,/g, '.');
  }
  const value = Number(normalized.replace(/\.(?=\d{3}\b)/g, ''));
  return Number.isFinite(value) ? value : null;
}

function cellOf(sheet: WorkSheet, row: number, column: number): StyledCell {
  const address = XLSX.utils.encode_cell({ r: row, c: column });
  const existing = sheet[address] as StyledCell | undefined;
  if (existing) return existing;
  const fresh = { t: 'z' } as unknown as StyledCell;
  sheet[address] = fresh;
  return fresh;
}

/** Escribe lo tecleado en la celda: es fórmula si empieza con "=", número si se puede. */
export function writeTypedValue(sheet: WorkSheet, row: number, column: number, text: string): void {
  const cell = cellOf(sheet, row, column);
  const trimmed = text.trim();
  if (trimmed.startsWith('=')) {
    // Sin el "=" inicial: la sintaxis la valida el recálculo y un error queda
    // marcado en la celda como #¿NOMBRE?, como hace Excel con fórmula rota.
    cell.f = trimmed.slice(1);
  } else {
    delete cell.f;
    delete cell.z;
    if (trimmed === '') {
      cell.t = 'z';
      delete cell.v;
    } else if (trimmed.endsWith('%') && parseTypedNumber(trimmed.slice(0, -1)) !== null) {
      cell.t = 'n';
      cell.v = parseTypedNumber(trimmed.slice(0, -1)) ?? 0;
      cell.z = '0%';
    } else {
      const number = parseTypedNumber(trimmed);
      if (number !== null) {
        cell.t = 'n';
        cell.v = number;
      } else {
        cell.t = 's';
        cell.v = trimmed;
      }
    }
  }
  delete cell.w;
}

function queryCell(table: HTMLTableElement, row: number, column: number): HTMLTableCellElement | null {
  return table.querySelector(`td[data-r="${row}"][data-c="${column}"]`);
}

/** Tras un recálculo repinta las celdas afectadas: texto nuevo y marca de fórmula. */
export function repaintCalculatedCells(
  table: HTMLTableElement,
  sheet: WorkSheet,
  changes: readonly { row: number; column: number }[],
): void {
  for (const { row, column } of changes) {
    const cell = sheet[XLSX.utils.encode_cell({ r: row, c: column })] as StyledCell | undefined;
    const element = queryCell(table, row, column);
    if (!element) continue;
    element.textContent = textOf(cell);
    element.style.textAlign = cell?.t === 'n' ? 'right' : '';
    element.classList.toggle('excel-formula', Boolean(cell?.f));
  }
}

/** Confirma lo tecleado: escribe, recálcula la hoja y repinta las celdas tocadas. */
export function confirmCellValue(
  table: HTMLTableElement,
  sheet: WorkSheet,
  row: number,
  column: number,
  text: string,
): void {
  writeTypedValue(sheet, row, column, text);
  const recalculated = recalcSheet(sheet);
  // Las celdas tapadas por una fusión no tienen celda propia en la tabla: no se tocan.
  repaintCalculatedCells(table, sheet, [{ row, column }, ...recalculated]);
  table.dispatchEvent(new CustomEvent('excel-cell-updated', { bubbles: true }));
}
