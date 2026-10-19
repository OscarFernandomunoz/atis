import type { FileElements } from '../excel-preview.js';
import { sameHeader } from './helpers.js';

// Realza en la vista previa HTML todas las celdas "Horas Adicionales":
// cabecera y cuerpo de cada tabla, sin importar el valor de horas.
export function colorHoursCellInPreview(elements: FileElements): void {
  const background = '#ffff00';
  const textColor = '#000000';

  elements.excelPreview.querySelectorAll('table').forEach((table) => {
    const rows = [
      ...Array.from(table.tHead?.rows ?? []),
      ...Array.from(table.tBodies[0]?.rows ?? []),
    ];
    rows.forEach((row) => {
      Array.from(row.cells).forEach((cell) => {
        if (!sameHeader((cell.textContent ?? '').trim(), 'Horas Adicionales')) return;
        cell.style.backgroundColor = background;
        cell.style.color = textColor;
        cell.style.fontWeight = '700';
      });
    });
  });
}
