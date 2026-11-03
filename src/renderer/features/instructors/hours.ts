import { HOURS_THRESHOLD, parseHoursValue } from '../spreadsheet/helpers.js';
import type { Instructor } from './parse.js';

// Clasificación de un valor de horas respecto al umbral del reporte.
type HoursKind = 'ok' | 'low' | 'none';
export type ContractHoursKind = 'equal' | 'low' | 'over' | 'none';

interface HoursView {
  /** Texto a mostrar: las horas o un guion cuando no hay dato. */
  text: string;
  /** Clase de color asociada. */
  kind: HoursKind;
  /** Si hay un valor numérico válido. */
  hasHours: boolean;
}

export function hoursView(hours: string): HoursView {
  const value = parseHoursValue(hours);
  const hasHours = hours !== '' && Number.isFinite(value);
  return {
    text: hasHours ? hours : '—',
    kind: hasHours ? (value < HOURS_THRESHOLD ? 'low' : 'ok') : 'none',
    hasHours,
  };
}

export function hoursKind(hours: string): HoursKind {
  return hoursView(hours).kind;
}

export function contractHoursKind(hours: string, requiredHours: string): ContractHoursKind {
  const value = parseHoursValue(hours);
  const required = parseHoursValue(requiredHours);
  if (!Number.isFinite(value) || !Number.isFinite(required)) return 'none';
  const roundedValue = Math.round(value * 100);
  const roundedRequired = Math.round(required * 100);
  if (roundedValue === roundedRequired) return 'equal';
  return roundedValue < roundedRequired ? 'low' : 'over';
}

// Horas leídas en vivo desde SofiaPlus por cédula y mes. Solo reemplazan las
// horas adicionales de ese mes; las horas académicas permanecen intactas.
const liveHours = new Map<string, string>();
const liveAdditionalHours = new Map<string, Map<number, string>>();

export function rememberLiveHours(identification: string, hours: string): void {
  if (identification && hours) liveHours.set(identification, hours);
}

export function rememberAvailabilityHours(identification: string, month: number, hours: string): void {
  if (!identification || !hours) return;
  const hoursByMonth = liveAdditionalHours.get(identification) ?? new Map<number, string>();
  hoursByMonth.set(month, hours);
  liveAdditionalHours.set(identification, hoursByMonth);
}

export function availabilityHours(identification: string, month: number): string | null {
  return liveAdditionalHours.get(identification)?.get(month) ?? null;
}

/** Horas efectivas: las del portal si ya se leyeron, si no las del Excel. */
export function effectiveHours(instructor: Instructor): string {
  return liveHours.get(instructor.identification) ?? instructor.hours;
}

export function forgetLiveHours(): void {
  liveHours.clear();
  liveAdditionalHours.clear();
}
