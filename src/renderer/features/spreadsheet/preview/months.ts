import type { FileElements } from './card-board.js';
import { mountSheetSections, type SheetSectionInfo } from './sections.js';

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
