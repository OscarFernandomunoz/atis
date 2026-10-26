// API pública del motor de fórmulas de la vista previa.
export { parseFormula } from './parser.js';
export { tokenize, lettersToColumn, FormulaSyntaxError } from './tokens.js';
export type { Token } from './tokens.js';
export type { Expression, Position, BinaryOperator } from './ast.js';
export { createSheetContext, readRawValue, writeFormulaResult, dateToSerial } from './sheet-values.js';
export { recalcSheet } from './recalc.js';
export type { RecalculatedCell } from './recalc.js';
export type { FormulaContext } from './evaluator.js';
export type { Result, CellResult, ErrorValue, FormulaValue } from './values.js';
export { isErrorValue, numberToText, toText, toNumber } from './values.js';
