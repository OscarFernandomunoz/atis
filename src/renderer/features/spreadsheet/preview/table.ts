import { normalizeIdentification } from '../helpers.js';

// Una fila del preview se oculta por el filtro de carnets o por el buscador de la tabla.
export function isRowHidden(row: HTMLTableRowElement): boolean {
  return row.dataset.cardHidden === 'true' || row.dataset.searchHidden === 'true';
}

// Construye la tabla de una hoja. La cédula se guarda en `data-identification`
// para que los filtros de carnets y de búsqueda puedan ocultar la fila sin
// volver a leer el libro.
export function createTable(rows: unknown[][], requiredColumnIndex: number): HTMLTableElement {
  const table = document.createElement('table');
  const head = document.createElement('thead');
  const body = document.createElement('tbody');
  rows.forEach((row, rowIndex) => {
    const tableRow = document.createElement('tr');
    (row ?? []).forEach((cell, cellIndex) => {
      const tableCell = document.createElement(rowIndex === 0 ? 'th' : 'td');
      tableCell.textContent = rowIndex === 0 ? String(cell ?? '') || `Columna ${cellIndex + 1}` : String(cell ?? '');
      if (cellIndex === requiredColumnIndex) tableCell.classList.add('excel-required-column');
      tableRow.appendChild(tableCell);
    });
    if (rowIndex > 0 && requiredColumnIndex >= 0) {
      const identification = normalizeIdentification((row ?? [])[requiredColumnIndex]);
      if (identification.length >= 6) tableRow.dataset.identification = identification;
    }
    (rowIndex === 0 ? head : body).appendChild(tableRow);
  });
  table.append(head, body);
  return table;
}

export function createFilterBar(table: HTMLTableElement): HTMLDivElement {
  const bar = document.createElement('div');
  bar.className = 'excel-filter-bar';
  const label = document.createElement('label');
  label.className = 'excel-filter-label';
  label.textContent = 'Buscar en';
  const select = document.createElement('select');
  select.className = 'excel-column-select';
  select.setAttribute('aria-label', 'Seleccionar columna para buscar');
  select.innerHTML = '<option value="all">Todas las columnas</option>';
  // El encabezado útil es la última fila del thead: la primera puede ser la fila
  // de meses combinados que el propio Excel junta con celdas fusionadas.
  const lastHeaderRow = table.tHead?.rows[table.tHead.rows.length - 1];
  Array.from(lastHeaderRow?.cells ?? []).forEach((cell, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = cell.textContent || `Columna ${index + 1}`;
    select.appendChild(option);
  });
  const input = document.createElement('input');
  input.className = 'excel-filter-input';
  input.type = 'search';
  input.placeholder = 'Escribe para buscar...';
  input.setAttribute('aria-label', 'Texto de búsqueda');

  const firstTBody = table.tBodies[0];
  const rowsCollection = firstTBody ? Array.from(firstTBody.rows) : [];

  const rowValues = rowsCollection.map((row) => Array.from(row.cells, (cell) => (
    cell.textContent?.toLowerCase() ?? ''
  )));

  // Pausa antes de filtrar mientras se escribe: una tabla grande no debe
  // recorrer todas sus filas en cada pulsación.
  const FILTER_DEBOUNCE_MS = 100;
  let filterFrame: number | null = null;
  let filterTimer: number | null = null;

  const runFilter = (): void => {
    // Se agrupa en un frame para no filtrar en cada pulsación del teclado.
    if (filterFrame !== null) return;
    filterFrame = window.requestAnimationFrame(() => {
      filterFrame = null;
      const value = input.value.trim().toLowerCase();
      const selectedColumn = select.value === 'all' ? null : Number(select.value);
      rowsCollection.forEach((row, rowIndex) => {
        const values = rowValues[rowIndex] ?? [];
        const cellVal = selectedColumn !== null ? values[selectedColumn] : undefined;
        const matches = !value || (selectedColumn === null
          ? values.some((cellValue) => cellValue.includes(value))
          : Boolean(cellVal?.includes(value)));
        row.dataset.searchHidden = matches ? 'false' : 'true';
        row.hidden = isRowHidden(row);
      });
    });
  };

  const apply = (): void => {
    if (filterTimer !== null) window.clearTimeout(filterTimer);
    filterTimer = window.setTimeout(() => {
      filterTimer = null;
      runFilter();
    }, FILTER_DEBOUNCE_MS);
  };

  // El desplegable cambia de columna: conviene reflejarlo sin esperar la pausa.
  select.addEventListener('change', () => {
    if (filterTimer !== null) {
      window.clearTimeout(filterTimer);
      filterTimer = null;
    }
    runFilter();
  });
  input.addEventListener('input', apply);
  bar.append(label, select, input);
  return bar;
}
