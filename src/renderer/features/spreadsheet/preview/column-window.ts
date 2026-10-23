import * as XLSX from 'xlsx';
import { sameHeader } from '../helpers.js';
import { MONTH_BLOCK_LABELS } from './constants.js';
import type { StyledCell } from './styled-cell.js';
import { textOf } from './styled-cell.js';

/** Columnas que sobreviven al recorte por meses. */
export interface ColumnWindow {
  allowed: Set<number>;
  /** Última columna útil de la ventana. */
  end: number;
}

// Localiza los bloques de mes de la fila 1 (celdas combinadas con el nombre del
// mes, 5 columnas de horas cada uno) y arma la ventana: la parte común del
// principio (programa, nombre, cédula, contrato) más los bloques elegidos.
// Devuelve null cuando la hoja no sigue esta forma y conviene verla completa.
export function columnWindowOf(sheet: XLSX.WorkSheet, months: readonly number[]): ColumnWindow | null {
  const blocks = new Map<number, { start: number; end: number }>();
  for (const merge of (sheet['!merges'] ?? []) as XLSX.Range[]) {
    if (merge.s.r !== 0) continue;
    const label = textOf(sheet[XLSX.utils.encode_cell({ r: 0, c: merge.s.c })] as StyledCell | undefined).trim();
    const index = MONTH_BLOCK_LABELS.findIndex((name) => sameHeader(label, name));
    if (index >= 0) blocks.set(index, { start: merge.s.c, end: merge.e.c });
  }
  if (blocks.size === 0) return null;
  // Todo lo que va antes del primer bloque es parte común: se conserva siempre.
  const commonEnd = Math.min(...[...blocks.values()].map((block) => block.start)) - 1;
  const allowed = new Set<number>();
  for (let column = 0; column <= commonEnd; column += 1) allowed.add(column);
  let end = commonEnd;
  for (const month of months) {
    const block = blocks.get(month);
    if (!block) continue;
    for (let column = block.start; column <= block.end; column += 1) allowed.add(column);
    end = Math.max(end, block.end);
  }
  return { allowed, end };
}
