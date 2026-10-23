// Valores que circulan en el evaluador de fórmulas y las conversiones que
// Excel hace implícitamente: celda vacía → 0 en aritmética, texto numérico
// aceptado solo cuando fue escrito directo en la fórmula, errores propagados.

export type FormulaValue = number | string | boolean;

/** Marca de error de Excel: se propaga por toda la fórmula. */
export interface ErrorValue {
  error: string;
}

/** Lo que produce una expresión: un valor o un error, nunca undefined. */
export type Result = FormulaValue | ErrorValue;

/** Lo que devuelve una celda leída: lo anterior, o null si está vacía. */
export type CellResult = Result | null;

export const VALUE_ERROR = '#¡VALOR!';
export const DIV_ZERO_ERROR = '#¡DIV/0!';
export const NAME_ERROR = '#¿NOMBRE?';
export const CIRCULAR_ERROR = '#¡CIRCULAR!';

export function isErrorValue(value: Result | null): value is ErrorValue {
  return typeof value === 'object' && value !== null && 'error' in value;
}

function error(code: string): ErrorValue {
  return { error: code };
}

/** Celda vacía a 0, número a número, texto numérico a número; si no, #¡VALOR!. */
export function toNumber(value: CellResult): number | ErrorValue {
  if (value === null || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : error(VALUE_ERROR);
  if (typeof value === 'boolean') return value ? 1 : 0;
  const parsed = Number(String(value).replace(',', '.'));
  if (Number.isFinite(parsed)) return parsed;
  return error(VALUE_ERROR);
}

/** Número como lo pinta Excel sin formato: corta el ruido binario de punto flotante. */
export function numberToText(value: number): string {
  if (!Number.isInteger(value)) {
    const rounded = Number(value.toPrecision(12));
    return String(rounded);
  }
  return String(value);
}

export function toText(value: CellResult): string {
  if (value === null) return '';
  if (typeof value === 'number') return numberToText(value);
  if (typeof value === 'boolean') return value ? 'VERDADERO' : 'FALSO';
  return typeof value === 'string' ? value : value.error;
}

/** Lógica de comparación de Excel: número antes que texto, texto alfabético. */
export function compareValues(left: CellResult, right: CellResult): number | ErrorValue {
  if (left === null && right === null) return 0;
  const leftNumber = typeof left === 'number' || left === null;
  const rightNumber = typeof right === 'number' || right === null;
  if (leftNumber && rightNumber) {
    const a = toNumber(left);
    const b = toNumber(right);
    if (isErrorValue(a) || isErrorValue(b)) return error(VALUE_ERROR);
    return a === b ? 0 : a < b ? -1 : 1;
  }
  if (typeof left === 'boolean' || typeof right === 'boolean') {
    return left === right ? 0 : (left ? 1 : 0) < (right ? 1 : 0) ? -1 : 1;
  }
  const a = toText(left);
  const b = toText(right);
  return a === b ? 0 : a.toLocaleUpperCase() < b.toLocaleUpperCase() ? -1 : 1;
}

/** Solo acepta números (con texto convertible); lo demás lo descarta, como SUM en referencias. */
export function numericValues(values: readonly CellResult[]): number[] {
  const numbers: number[] = [];
  for (const value of values) {
    if (value === null || typeof value === 'boolean') continue;
    if (typeof value === 'number') {
      if (Number.isFinite(value)) numbers.push(value);
      continue;
    }
    const parsed = Number(String(value).replace(',', '.'));
    if (Number.isFinite(parsed)) numbers.push(parsed);
  }
  return numbers;
}
