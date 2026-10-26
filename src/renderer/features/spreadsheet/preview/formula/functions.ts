// Funciones de hoja disponibles en el recálculo: básicas de agregación.
// Los argumentos llegan ya evaluados; un rago llega aplanado en la lista.

import type { Result, CellResult } from './values.js';
import { DIV_ZERO_ERROR, NAME_ERROR, VALUE_ERROR, numericValues } from './values.js';

export type FunctionImplementation = (args: readonly CellResult[]) => Result;

function sum(args: readonly CellResult[]): Result {
  return numericValues(args).reduce((total, value) => total + value, 0);
}

function average(args: readonly CellResult[]): Result {
  const numbers = numericValues(args);
  if (numbers.length === 0) return { error: DIV_ZERO_ERROR };
  const total = numbers.reduce((total, value) => total + value, 0);
  return total / numbers.length;
}

function max(args: readonly CellResult[]): Result {
  const numbers = numericValues(args);
  return numbers.length === 0 ? 0 : Math.max(...numbers);
}

function min(args: readonly CellResult[]): Result {
  const numbers = numericValues(args);
  return numbers.length === 0 ? 0 : Math.min(...numbers);
}

function count(args: readonly CellResult[]): Result {
  return numericValues(args).length;
}

// Fecha de un serial de Excel (días desde el 1899-12-30), en UTC para que la
// zona horaria de la máquina no corra el día.
function dateFromSerial(value: number): Date {
  // 25569 días separa el epoch Unix del epoch de Excel.
  return new Date(Math.round((value - 25569) * 86400000));
}

/** DAY/MES/AÑO sobre un serial; la celda vacía vale 0 como en Excel. */
function datePartFunction(part: 'date' | 'month' | 'year'): FunctionImplementation {
  return ([value]) => {
    if (value === null || value === '') return 0;
    if (typeof value === 'boolean') return { error: VALUE_ERROR };
    const serial = typeof value === 'number'
      ? value
      : Number(String(value).replace(',', '.'));
    if (!Number.isFinite(serial)) return { error: VALUE_ERROR };
    const date = dateFromSerial(serial);
    if (part === 'date') return date.getUTCDate();
    if (part === 'month') return date.getUTCMonth() + 1;
    return date.getUTCFullYear();
  };
}

/** Registro de funciones: nombres en español e inglés por igual. */
const REGISTRY = new Map<string, FunctionImplementation>([
  ['SUM', sum],
  ['SUMA', sum],
  ['AVERAGE', average],
  ['PROMEDIO', average],
  ['MAX', max],
  ['MIN', min],
  ['COUNT', count],
  ['CONTAR', count],
  ['DAY', datePartFunction('date')],
  ['DIA', datePartFunction('date')],
  ['MONTH', datePartFunction('month')],
  ['MES', datePartFunction('month')],
  ['YEAR', datePartFunction('year')],
  ['AÑO', datePartFunction('year')],
]);

/** Cuando el nombre no existe en el registro, Excel marca #¿NOMBRE?. */
export function callFunction(name: string, args: readonly CellResult[]): Result {
  const implementation = REGISTRY.get(name.toLocaleUpperCase());
  if (!implementation) {
    return { error: NAME_ERROR };
  }
  return implementation(args);
}
