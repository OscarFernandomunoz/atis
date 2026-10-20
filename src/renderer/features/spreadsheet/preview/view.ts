import type { FileElements } from './card-board.js';
import { findRequiredColumnIndex } from './column.js';
import { isRowHidden } from './table.js';

// Recolecta las cédulas de las filas VISIBLES (no ocultas por el filtro de búsqueda).
// Si no hay filtro activo, devuelve todas las cédulas.
export function getVisibleIdentifications(elements: FileElements): string[] {
  const tables = elements.excelPreview.querySelectorAll('table');
  const visible: string[] = [];
  tables.forEach((table) => {
    const requiredIndex = findRequiredColumnIndex(
      Array.from(table.tBodies[0]?.rows ?? []).map((row) => (
        Array.from(row.cells, (cell) => cell.textContent ?? '')
      )),
    )?.columnIndex;
    if (requiredIndex === undefined) return;
    table.tBodies[0]?.querySelectorAll('tr:not([hidden])').forEach((row) => {
      const tableRow = row as HTMLTableRowElement;
      const cell = tableRow.cells[requiredIndex];
      const value = (cell?.textContent ?? '').trim();
      if (value.replace(/\D/g, '').length >= 6) visible.push(value);
    });
  });
  return [...new Set(visible)];
}

// Resalta la fila que contiene la cédula indicada.
export function highlightRow(elements: FileElements, identification: string | null): void {
  const rows = elements.excelPreview.querySelectorAll('tr');
  rows.forEach((row) => {
    row.classList.remove('excel-row-active');
  });
  if (!identification) return;
  const target = Array.from(rows).find((row) => {
    const cells = Array.from(row.cells).map((cell) => cell.textContent?.trim() ?? '');
    return cells.some((cell) => cell === identification || cell.includes(identification));
  });
  target?.classList.add('excel-row-active');
  // La tabla vive en una ventana interna: al resaltar hay que acercar la fila.
  target?.scrollIntoView({ block: 'nearest' });
}

// Oculta en la vista previa las filas cuya cédula no pasó el filtro de carnets.
// `visible === null` significa que no hay filtro activo y se muestran todas las filas.
export function applyCardFilter(elements: FileElements, visible: string[] | null): void {
  const allowed = visible === null ? null : new Set(visible);
  elements.excelPreview.querySelectorAll('table').forEach((table) => {
    Array.from(table.tBodies[0]?.rows ?? []).forEach((row) => {
      const identification = row.dataset.identification ?? '';
      const shownByCards = allowed === null || (identification !== '' && allowed.has(identification));
      row.dataset.cardHidden = shownByCards ? 'false' : 'true';
      row.hidden = isRowHidden(row);
    });
  });
}
