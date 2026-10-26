import type { FileElements } from './card-board.js';
import { normalizeIdentification } from '../helpers.js';
import { isRowHidden } from './table.js';

// Recolecta las cédulas guardadas en las filas visibles del preview.
export function getVisibleIdentifications(elements: FileElements): string[] {
  const visible: string[] = [];
  elements.excelPreview.querySelectorAll<HTMLTableRowElement>('tbody tr:not([hidden])').forEach((row) => {
    const identification = normalizeIdentification(row.dataset.identification);
    if (identification.length >= 6) visible.push(identification);
  });
  return [...new Set(visible)];
}

// Resalta la fila que contiene la cédula indicada.
export function highlightRow(elements: FileElements, identification: string | null): void {
  // Solo se toca la fila que estaba activa, no las miles de la tabla.
  elements.excelPreview.querySelectorAll('.excel-row-active')
    .forEach((row) => row.classList.remove('excel-row-active'));
  if (!identification) return;
  // La cédula ya vive en `data-identification`: se evita leer el texto de todas
  // las celdas en cada aviso de progreso.
  const target = elements.excelPreview.querySelector<HTMLTableRowElement>(
    `tr[data-identification="${CSS.escape(identification)}"]`,
  );
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

// Marca las filas del preview cuya cédula corresponde a un "instructor nuevo"
// (contrato que arranca dentro de la ventana de ±30 días de hoy). Es solo
// informativo: no cambia filtros ni automatización. No hay que retirar marcas
// previas porque la tabla se reconstruye completa en cada carga del archivo.
export function markNewInstructorRows(preview: HTMLElement, identifications: Set<string>): void {
  if (identifications.size === 0) return;
  preview.querySelectorAll<HTMLTableRowElement>('tbody tr[data-identification]').forEach((row) => {
    if (identifications.has(row.dataset.identification ?? '')) row.classList.add('excel-new-instructor');
  });
}
