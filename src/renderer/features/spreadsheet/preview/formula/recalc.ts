// Recálculo de una hoja completa: tras un cambio de valor, toda celda con
// fórmula se vuelve a evaluar. Devuelve las direcciones cuyo texto visible
// cambió, para que la interfaz repinte solo esas celdas.

import * as XLSX from 'xlsx';
import type { StyledCell } from '../styled-cell.js';
import { createSheetContext, writeFormulaResult } from './sheet-values.js';
import { evaluate, type FormulaContext } from './evaluator.js';
import { parseFormula } from './parser.js';
import { isErrorValue, numberToText, type Result } from './values.js';

/** Celda tocada por el recálculo, con su texto nuevo para el repintado. */
export interface RecalculatedCell {
  row: number;
  column: number;
  text: string;
}

/** Texto visible de una celda tras el recálculo: mismo formato que Excel aplicaría. */
function displayedText(cell: StyledCell, value: Result | null): string {
  if (value === null) return '';
  if (isErrorValue(value)) return value.error;
  if (typeof cell.z === 'string' && cell.z !== 'General') {
    try {
      return XLSX.SSF.format(cell.z, value);
    } catch {
      // Formato que SSF no entiende: cae al formato general.
    }
  }
  if (typeof value === 'number') return numberToText(value);
  if (typeof value === 'boolean') return value ? 'VERDADERO' : 'FALSO';
  return value ?? '';
}

/** Evalua una fórmula con un contexto prestado y escribe el resultado de vuelta. */
function evaluateCell(
  sheet: XLSX.WorkSheet,
  context: FormulaContext,
  row: number,
  column: number,
): Result | null {
  const cell = sheet[XLSX.utils.encode_cell({ r: row, c: column })] as StyledCell | undefined;
  if (!cell?.f) return null;
  let value: Result;
  try {
    value = evaluate(parseFormula(cell.f), context);
  } catch {
    value = { error: '#¿NOMBRE?' };
  }
  writeFormulaResult(cell, value);
  return value;
}
/**
 * Recalcula cada fórmula de la hoja en su orden natural (una creación de
 * contexto único memoiza las dependencias). Solo toca celdas dentro de !ref.
 */
export function recalcSheet(sheet: XLSX.WorkSheet): RecalculatedCell[] {
  const ref = sheet['!ref'];
  if (!ref) return [];
  const range = XLSX.utils.decode_range(ref);
  const context = createSheetContext(sheet);
  const changed: RecalculatedCell[] = [];
  for (let row = range.s.r; row <= range.e.r; row += 1) {
    for (let column = range.s.c; column <= range.e.c; column += 1) {
      const address = XLSX.utils.encode_cell({ r: row, c: column });
      const cell = sheet[address] as StyledCell | undefined;
      if (!cell?.f) continue;
      const before = cell.w ?? (cell.v === undefined ? '' : String(cell.v));
      const value = evaluateCell(sheet, context, row, column);
      const after = displayedText(cell, value);
      // El texto formateado queda en la celda: `textOf` lo mantiene tras repintar.
      cell.w = after;
      if (before !== after) changed.push({ row, column, text: after });
    }
  }
  return changed;
}
