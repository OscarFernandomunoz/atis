// Edición de celdas en vivo: clic selecciona (la barra de fórmulas muestra la
// fórmula o el valor), escribir y Enter confirma; las celdas que dependen se
// recalculan igual que en Excel. Los cambios viven en la hoja de SheetJS, así
// que sobreviven al repintado por meses.

import * as XLSX from 'xlsx';
import type { WorkSheet } from 'xlsx';
import type { StyledCell } from './styled-cell.js';
import { textOf } from './styled-cell.js';
import { createFormulaBar } from './formula-bar.js';
import {
  confirmCellValue,
  rawEditValue,
} from './cell-value.js';

function parseCellCoordinates(element: HTMLTableCellElement): { row: number; column: number } {
  return { row: Number(element.dataset.r), column: Number(element.dataset.c) };
}

/** Deja lista la edición: barra de fórmulas + clic/doble clic en las celdas del cuerpo. */
export function enableCellEditing(section: HTMLElement, table: HTMLTableElement, sheet: WorkSheet): void {
  const bar = createFormulaBar();
  const title = section.firstElementChild;
  // La barra vive bajo el título de la hoja, encima de la tabla.
  section.insertBefore(bar.root, title?.nextSibling ?? null);
  let selected: HTMLTableCellElement | null = null;

  function rawOf(row: number, column: number): string {
    const cell = sheet[XLSX.utils.encode_cell({ r: row, c: column })] as StyledCell | undefined;
    return rawEditValue(cell);
  }

  function select(element: HTMLTableCellElement): void {
    selected?.classList.remove('excel-selected');
    selected = element;
    selected.classList.add('excel-selected');
    const { row, column } = parseCellCoordinates(element);
    bar.input.value = rawOf(row, column);
    bar.input.placeholder = `Celda ${XLSX.utils.encode_cell({ r: row, c: column })}`;
    bar.input.dataset.row = String(row);
    bar.input.dataset.column = String(column);
  }

  function editInPlace(element: HTMLTableCellElement): void {
    const { row, column } = parseCellCoordinates(element);
    const input = document.createElement('input');
    input.className = 'excel-cell-input';
    input.type = 'text';
    input.value = rawOf(row, column);
    element.replaceChildren(input);
    input.focus();
    input.select();
    const finish = (restore: boolean): void => {
      input.remove();
      // Al cancelar vuelve el texto previo; al confirmar, el recálculo repinta
      // el texto nuevo directamente sobre el mismo elemento.
      if (restore) {
        const cell = sheet[XLSX.utils.encode_cell({ r: row, c: column })] as StyledCell | undefined;
        element.textContent = textOf(cell);
      }
    };
    input.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        input.dataset.cancelled = 'true';
        finish(true);
        return;
      }
      if (event.key !== 'Enter') return;
      // Confirmado por paridad con la barra: número, texto o fórmula (=...).
      confirmCellValue(table, sheet, row, column, input.value);
      finish(false);
    });
    input.addEventListener('blur', () => {
      if (input.dataset.cancelled) return;
      if (input.value.trim() === rawOf(row, column).trim()) { finish(true); return; }
      commitBar(input.value, row, column);
      finish(false);
    });
  }

  function commitBar(text: string, row: number, column: number): void {
    confirmCellValue(table, sheet, row, column, text);
    // Tras confirmar, la barra muestra la fórmula o el valor resultante, como Excel.
    bar.input.value = rawOf(row, column);
    if (selected) select(selected);
  }

  table.addEventListener('click', (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const cell = target.closest('td[data-r][data-c]') as HTMLTableCellElement | null;
    if (!cell || cell.querySelector('input')) return;
    // Segundo clic sobre la celda ya seleccionada la abre para editar.
    if (cell === selected) {
      editInPlace(cell);
      return;
    }
    select(cell);
    bar.input.focus();
  });

  bar.input.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key !== 'Enter' && event.key !== 'Escape') return;
    const row = Number(bar.input.dataset.row);
    const column = Number(bar.input.dataset.column);
    if (Number.isNaN(row) || Number.isNaN(column)) return;
    if (event.key === 'Escape') {
      bar.input.value = rawOf(row, column);
      return;
    }
    event.preventDefault();
    commitBar(bar.input.value, row, column);
  });
}
