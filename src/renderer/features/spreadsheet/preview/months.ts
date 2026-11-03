import * as XLSX from 'xlsx';
import type { FileElements } from './card-board.js';
import { mountSheetSections, type SheetSectionInfo } from './sections.js';
import { isCedulaHeader, normalizeIdentification, sameHeader } from '../helpers.js';
import { MONTH_BLOCK_LABELS } from './constants.js';

// Ventana de meses del preview: el carrusel de arriba elige qué bloques del
// Excel se ven ("Febrero" → solo la parte común y su bloque de 5 columnas).
// También guarda la última lectura del archivo para repintar sin releerlo.

let cached: readonly SheetSectionInfo[] | null = null;
let currentMonths: readonly number[] | null = null;
let onRepaint: (() => void) | null = null;

// Guarda las hojas del archivo cargado (no se releen al cambiar de mes).
export function rememberSheets(infos: readonly SheetSectionInfo[]): void {
  cached = infos;
}

export function forgetSheets(): void {
  cached = null;
}

export function getCurrentMonths(): readonly number[] | null {
  return currentMonths;
}

// Registro que ejecuta cada repintado: el controlador vuelve a aplicar el
// filtro de carnets y las marcas de "instructor nuevo" sobre las filas nuevas.
export function onPreviewRepainted(callback: () => void): void {
  onRepaint = callback;
}

export function paintPreview(elements: FileElements): void {
  if (!cached) return;
  mountSheetSections(elements, cached, currentMonths);
}

// Cambia la ventana de meses y repinta. `null` muestra el archivo completo.
export function applyMonthWindow(elements: FileElements, months: readonly number[] | null): void {
  currentMonths = months;
  if (!cached) return;
  paintPreview(elements);
  onRepaint?.();
}

export function updatePreviewAvailabilityHours(
  preview: HTMLElement,
  identification: string,
  hours: number,
  monthIndex: number,
): number {
  if (!cached) return 0;
  const displayHours = String(Number(hours.toFixed(2)));
  let updatedRows = 0;

  cached.forEach(({ rows, sheet }, sectionIndex) => {
    const headerRow = rows.findIndex((row) => row.some((cell) => isCedulaHeader(String(cell ?? '').trim())));
    if (headerRow < 0) return;
    const headers = rows.slice(headerRow, headerRow + 3);
    const identificationColumn = headers
      .flatMap((row) => row.map((cell, column) => isCedulaHeader(String(cell ?? '').trim()) ? column : -1))
      .find((column) => column >= 0);
    if (identificationColumn === undefined) return;

    const monthStarts = (rows[0] ?? []).flatMap((cell, column) => {
      const month = MONTH_BLOCK_LABELS.findIndex((label) => sameHeader(String(cell ?? '').trim(), label));
      return month < 0 ? [] : [{ month, column }];
    });
    const selectedMonth = monthStarts.find((entry) => entry.month === monthIndex);
    if (monthStarts.length > 0 && !selectedMonth) return;
    const nextMonth = selectedMonth
      ? monthStarts.find((entry) => entry.column > selectedMonth.column)?.column ?? Number.POSITIVE_INFINITY
      : Number.POSITIVE_INFINITY;
    let hoursColumn = -1;
    for (let row = headerRow; row < Math.min(headerRow + 3, rows.length) && hoursColumn < 0; row += 1) {
      hoursColumn = (rows[row] ?? []).findIndex((cell, column) => (
        (!selectedMonth || (column >= selectedMonth.column && column < nextMonth))
        && sameHeader(String(cell ?? '').trim(), 'Horas Adicionales')
      ));
    }
    if (hoursColumn < 0) return;
    const section = preview.querySelectorAll<HTMLElement>(':scope > section')[sectionIndex];
    const tableRows = section?.querySelectorAll<HTMLTableRowElement>('tbody tr[data-identification]');

    rows.forEach((row, rowIndex) => {
      if (rowIndex <= headerRow || normalizeIdentification(row[identificationColumn]) !== identification) return;
      row[hoursColumn] = hours;
      if (sheet) {
        const address = XLSX.utils.encode_cell({ r: rowIndex, c: hoursColumn });
        const cell = sheet[address] ?? { t: 'n' as const, v: hours };
        cell.t = 'n';
        cell.v = hours;
        cell.w = displayHours;
        delete cell.f;
        sheet[address] = cell;
      }
      tableRows?.forEach((tableRow) => {
        if (normalizeIdentification(tableRow.dataset.identification) !== identification) return;
        const cell = tableRow.querySelector<HTMLTableCellElement>(`td[data-c="${hoursColumn}"]`)
          ?? tableRow.cells[hoursColumn];
        if (cell) cell.textContent = displayHours;
      });
      updatedRows += 1;
    });
  });

  return updatedRows;
}
