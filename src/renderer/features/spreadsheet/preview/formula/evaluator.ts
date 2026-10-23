// Evaluador de expresiones de fórmula: recorre el arbol del parser contra un
// contexto de hoja. Los errores de Excel (#¡VALOR!, #¡DIV/0!, ...) se propagan:
// una vez presente, ninguna operación cambia el resultado.

import type { Expression } from './ast.js';
import { callFunction } from './functions.js';
import type { CellResult, Result } from './values.js';
import {
  compareValues,
  isErrorValue,
  toNumber,
  toText,
  VALUE_ERROR,
} from './values.js';


/** Lo que el evaluador necesita de la hoja: leer celdas respetando fórmulas anidadas. */
export interface FormulaContext {
  read(rowIndex: number, columnIndex: number): CellResult;
}

function divide(numerator: number, denominator: number): Result {
  if (denominator === 0) return { error: '#¡DIV/0!' };
  return numerator / denominator;
}

/** Evalúa una expresión a un único valor. */
export function evaluate(expression: Expression, context: FormulaContext): Result {
  switch (expression.kind) {
    case 'number': return expression.value;
    case 'string': return expression.value;
    case 'cell': return context.read(expression.position.row, expression.position.column) ?? 0;
    case 'range': return firstOfRange(expression, context);
    case 'percent': {
      const value = toNumber(evaluate(expression.operand, context));
      return isErrorValue(value) ? value : value / 100;
    }
    case 'unary': {
      const value = toNumber(evaluate(expression.operand, context));
      if (isErrorValue(value)) return value;
      return expression.operator === '-' ? -value : value;
    }
    case 'binary': return evaluateBinary(expression, context);
    case 'call': {
      const flat: CellResult[] = [];
      for (const argument of expression.args) {
        flat.push(...evaluateArgument(argument, context));
      }
      return callFunction(expression.name, flat);
    }
  }
}

/** Un rango como argumento de función es una lista de valores; en otro sitio vale su primera celda. */
function evaluateArgument(expression: Expression, context: FormulaContext): CellResult[] {
  if (expression.kind !== 'range') return [evaluate(expression, context) ?? null];
  return rangeValues(expression.from.column, expression.from.row, expression.to.column, expression.to.row, context);
}

function firstOfRange(expression: Extract<Expression, { kind: 'range' }>, context: FormulaContext): Result {
  const values = rangeValues(
    expression.from.column, expression.from.row,
    expression.to.column, expression.to.row, context,
  );
  // Un rango fuera de función vale su primera celda; vacía cuenta como 0.
  return values[0] ?? 0;
}

function rangeValues(
  columnA: number, rowA: number, columnB: number, rowB: number,
  context: FormulaContext,
): CellResult[] {
  const rowStart = Math.min(rowA, rowB);
  const rowEnd = Math.max(rowA, rowB);
  const columnStart = Math.min(columnA, columnB);
  const columnEnd = Math.max(columnA, columnB);
  // Guarda-sanidad: un rango desbordado (A1:XFD1048576) no puede recorrer millones de celdas.
  if ((rowEnd - rowStart + 1) * (columnEnd - columnStart + 1) > 200_000) {
    return [{ error: '#¡REF!' }];
  }
  const values: CellResult[] = [];
  for (let r = rowStart; r <= rowEnd; r += 1) {
    for (let c = columnStart; c <= columnEnd; c += 1) {
      values.push(context.read(r, c));
    }
  }
  return values;
}

function evaluateBinary(
  expression: Extract<Expression, { kind: 'binary' }>,
  context: FormulaContext,
): Result {
  const left = evaluate(expression.left, context);
  const right = evaluate(expression.right, context);
  if (isErrorValue(left)) return left;
  if (isErrorValue(right)) return right;
  switch (expression.operator) {
    case '+': case '-': case '*': case '/': case '^': return arithmetic(expression.operator, left, right);
    case '&': return toText(left) + toText(right);
    default: return comparison(expression.operator, left, right);
  }
}

function arithmetic(operator: string, left: CellResult, right: CellResult): Result {
  const a = toNumber(left);
  if (isErrorValue(a)) return a;
  const b = toNumber(right);
  if (isErrorValue(b)) return b;
  switch (operator) {
    case '+': return a + b;
    case '-': return a - b;
    case '*': return a * b;
    case '/': return divide(a, b);
    case '^': return Math.pow(a, b);
    default: return { error: VALUE_ERROR };
  }
}

function comparison(operator: string, left: CellResult, right: CellResult): Result {
  const outcome = compareValues(left, right);
  if (isErrorValue(outcome)) return outcome;
  switch (operator) {
    case '=': return outcome === 0;
    case '<>': return outcome !== 0;
    case '<': return outcome < 0;
    case '>': return outcome > 0;
    case '<=': return outcome <= 0;
    case '>=': return outcome >= 0;
    default: return { error: VALUE_ERROR };
  }
}
