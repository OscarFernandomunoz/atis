// Pone el arbol de fórmulas sobre la hoja real de SheetJS: lee celdas por su
// dirección, evalua las celdas que también son fórmula (con memo) y detecta
// referencias circulares antes de que la app se cuelgue.

import * as XLSX from 'xlsx';
import type { StyledCell } from '../styled-cell.js';
import { evaluate, type FormulaContext } from './evaluator.js';
import { parseFormula } from './parser.js';
import { CIRCULAR_ERROR, NAME_ERROR, isErrorValue, type CellResult, type Result } from './values.js';

// Excel guarda fechas como seriales (días desde el 1899-12-30).
const EXCEL_EPOCH_SHIFT_DAYS = 25569;

export function dateToSerial(date: Date): number {
  return Math.round(date.getTime() / 86400000 + EXCEL_EPOCH_SHIFT_DAYS);
}

/** Valor crudo de una celda para fórmulas: n/s/b como número/texto/bool; vacía = null. */
export function readRawValue(cell: StyledCell | undefined): CellResult {
  if (!cell || cell.t === 'z') return null;
  if (cell.t === 'e') return { error: String(cell.v ?? '#¡VALOR!') };
  const value = cell.v;
  if (value instanceof Date) return dateToSerial(value);
  if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') return value;
  return null;
}

/** Guarda el resultado de una fórmula en su celda, ajustando el tipo de Excel. */
export function writeFormulaResult(cell: StyledCell, value: Result): void {
  if (typeof value === 'number') { cell.t = 'n'; cell.v = value; }
  else if (typeof value === 'boolean') { cell.t = 'b'; cell.v = value; }
  else if (isErrorValue(value)) { cell.t = 'e'; cell.v = value.error; }
  else { cell.t = 's'; cell.v = value; }
  delete cell.w;
}

/**
 * Contexto que lee la hoja: las celdas con fórmula se evaluan bajo demanda con
 * memo, así que una recálculo no repite trabajo y los ciclos se cortan.
 */
export function createSheetContext(sheet: XLSX.WorkSheet): FormulaContext {
  const memo = new Map<string, Result>();
  const evaluating = new Set<string>();
  return {
    read(rowIndex: number, columnIndex: number): CellResult {
      if (rowIndex < 0 || columnIndex < 0) return null;
      const address = XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex });
      const cell = sheet[address] as StyledCell | undefined;
      if (!cell?.f) return readRawValue(cell);
      const memoized = memo.get(address);
      if (memoized !== undefined) return memoized;
      if (evaluating.has(address)) return { error: CIRCULAR_ERROR };
      evaluating.add(address);
      let result: Result;
      try {
        result = evaluate(parseFormula(cell.f), this);
      } catch {
        result = { error: NAME_ERROR };
      }
      evaluating.delete(address);
      memo.set(address, result);
      writeFormulaResult(cell, result);
      return result;
    },
  };
}
