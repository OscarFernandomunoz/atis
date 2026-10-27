// La selección puede estar vacía o contener un único mes.
export interface MonthRange {
  start: number;
  end: number;
}

export function toggleMonth(range: MonthRange | null, month: number): MonthRange | null {
  if (range?.start === month && range.end === month) return null;
  return { start: month, end: month };
}

export function isMonthSelected(range: MonthRange | null, month: number): boolean {
  return range !== null && month >= range.start && month <= range.end;
}
