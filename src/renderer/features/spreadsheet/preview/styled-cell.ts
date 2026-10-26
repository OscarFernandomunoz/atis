import type * as XLSX from 'xlsx';

// Estilos mínimos que SheetJS devuelve al leer con `cellStyles`. La versión libre
// del paquete no los tipa, así que se declaran aquí.
export interface StyledCell extends XLSX.CellObject {
  s?: {
    patternType?: string;
    fgColor?: { rgb?: string };
  };
}

/** Texto de la celda tal como lo muestra Excel: `w` es el valor ya formateado. */
export function textOf(cell: StyledCell | undefined): string {
  if (!cell || cell.t === 'z' || cell.v === undefined || cell.v === null) return '';
  return (cell.w ?? String(cell.v)) as string;
}

/** Relleno sólido de la celda convertido a color CSS; null si no tiene fondo. */
export function fillOf(cell: StyledCell | undefined): string | null {
  const fill = cell?.s;
  if (!fill || fill.patternType !== 'solid') return null;
  const rgb = fill.fgColor?.rgb;
  // SheetJS puede entregar "AARRGGBB" u "RRGGBB": en ambos casos vale el final.
  if (typeof rgb !== 'string' || rgb.length < 6) return null;
  return `#${rgb.slice(-6).toLowerCase()}`;
}
