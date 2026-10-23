import * as XLSX from 'xlsx';
import type { FileElements } from './card-board.js';
import { enableCellEditing } from './cell-editing.js';
import { findRequiredColumnIndex } from './column.js';
import { buildStyledTable } from './excel-table.js';
import { createFilterBar, createTable } from './table.js';

// Datos ya validados de cada hoja del archivo: todo lo que el montaje necesita.
export interface SheetSectionInfo {
  sheetName: string;
  sheet: XLSX.WorkSheet | null;
  rows: unknown[][];
  autofilter: XLSX.AutoFilterInfo | null;
}

// Monta una sección por hoja: título, tabla con los meses elegidos (o completa)
// y su barra de búsqueda por columna. Reemplaza lo que hubiera en el preview.
export function mountSheetSections(
  elements: FileElements,
  infos: readonly SheetSectionInfo[],
  months: readonly number[] | null,
): void {
  const fragment = document.createDocumentFragment();
  infos.forEach(({ sheetName, sheet, rows, autofilter }) => {
    const section = document.createElement('section');
    const title = document.createElement('h3');
    title.textContent = sheetName;
    section.appendChild(title);
    if (!rows.length) {
      const empty = document.createElement('p');
      empty.textContent = 'Esta hoja está vacía.';
      section.appendChild(empty);
    } else {
      // La hoja manda su formato propio (rellenos y celdas combinadas); si no
      // trae ninguno, la tabla estilizada devuelve null y se usa la genérica.
      const required = findRequiredColumnIndex(rows);
      const table = sheet && required
        ? buildStyledTable(sheet, required.headerRowIndex + 1, required.columnIndex, months)
          ?? createTable(rows, required.columnIndex)
        : createTable(rows, required?.columnIndex ?? -1);
      // Agregar barra de filtros que respeta filas ocultas
      section.appendChild(createFilterBar(table));
      const wrapper = document.createElement('div');
      wrapper.className = 'excel-table-wrapper';
      wrapper.appendChild(table);
      section.appendChild(wrapper);
      // Solo la tabla estilizada lleva coordenadas por celda (data-r/data-c):
      // ahí funciona la edición en vivo con recálculo de fórmulas.
      if (table.classList.contains('excel-styled') && sheet) {
        enableCellEditing(section, table, sheet);
      }
      // Si el archivo tiene filtro autofilter nativo, agregar indicación visual
      if (autofilter) {
        const filterNote = document.createElement('p');
        filterNote.className = 'excel-filter-note';
        filterNote.textContent = `• Hoja tiene filtro autofilter aplicado (rango: ${autofilter.ref})`;
        section.appendChild(filterNote);
      }
    }
    fragment.appendChild(section);
  });
  elements.excelPreview.replaceChildren(fragment);
}
