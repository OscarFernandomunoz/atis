// Rango de meses contiguo: nunca hay huecos entre el primero y el último.
export interface MonthRange {
  start: number;
  end: number;
}

/**
 * Aplica un clic sobre un mes y devuelve el nuevo rango.
 *
 * - Un mes fuera del rango lo extiende (rellena los intermedios).
 * - Un extremo del rango lo encoge al quitarlo.
 * - Un mes del medio reinicia el rango desde ahí.
 * - El único mes seleccionado, al volver a tocarlo, limpia la selección.
 */
export function toggleMonth(range: MonthRange | null, month: number): MonthRange | null {
  if (!range) return { start: month, end: month };
  if (month < range.start) return { start: month, end: range.end };
  if (month > range.end) return { start: range.start, end: month };
  if (range.start === range.end) return null;
  if (month === range.start) return { start: range.start + 1, end: range.end };
  if (month === range.end) return { start: range.start, end: range.end - 1 };
  return { start: month, end: month };
}

export function isMonthSelected(range: MonthRange | null, month: number): boolean {
  return range !== null && month >= range.start && month <= range.end;
}
