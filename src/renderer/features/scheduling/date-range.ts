import type { MonthRange } from './selection.js';

interface DateRangeInputs {
  start: HTMLInputElement;
  end: HTMLInputElement;
}

/**
 * Vuelca el rango de meses en los inputs: el primer día del mes inicial como
 * fecha de inicio y el último día del mes final como fecha de fin. Sin selección
 * deja los campos vacíos.
 */
export function writeDateRange(inputs: DateRangeInputs, range: MonthRange | null, year: number): void {
  if (!range) {
    inputs.start.value = '';
    inputs.end.value = '';
    return;
  }
  inputs.start.value = formatDate(year, range.start, 1);
  inputs.end.value = formatDate(year, range.end, lastDayOfMonth(year, range.end));
}

function formatDate(year: number, month: number, day: number): string {
  const monthPart = String(month + 1).padStart(2, '0');
  const dayPart = String(day).padStart(2, '0');
  return `${year}-${monthPart}-${dayPart}`;
}

// El día 0 del mes siguiente es el último día del mes pedido.
function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}
