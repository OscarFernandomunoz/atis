// Analizador léxico de fórmulas A1 (`=SUMA(B2:B10)*2`): parte la cadena en
// números, cadenas, referencias, rangos, nombres de función y operadores.

export type Token =
  | { kind: 'number'; value: string }
  | { kind: 'string'; value: string }
  | { kind: 'cell'; column: number; row: number }
  | { kind: 'range'; from: { column: number; row: number }; to: { column: number; row: number } }
  | { kind: 'name'; value: string }
  | { kind: 'operator'; value: string }
  | { kind: 'lparen' }
  | { kind: 'rparen' }
  | { kind: 'comma' };

export class FormulaSyntaxError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FormulaSyntaxError';
  }
}

/** Convierte letras de columnas ("A", "AB") al índice 0-based que usa SheetJS. */
export function lettersToColumn(letters: string): number {
  // Base-26 sin cero: A=1, Z=26, AA=27; al final se resta 1 para 0-based.
  let column = 0;
  for (const char of letters.toLocaleUpperCase()) {
    column = column * 26 + (char.charCodeAt(0) - 64);
  }
  return column - 1;
}

// Referencia con o sin `$` fijos: B2, $B2, B$2, $B$2.
const REF = /^\$?([A-Za-z]{1,3})\$?(\d{1,7})(?![A-Za-z0-9_.])/;
const LETTERS = /^[A-Za-z_][A-Za-z0-9_.]*/;
const OPERATORS = /^(?:<>|<=|>=|[+\-*/^&=%<>])/;
const STRING_RAW = /^"(?:[^"]|"")*"/;
const NUMBER_RAW = /^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/;

/** Excel escribe la fila 1-based y SheetJS la indexa 0-based. */
function parsePosition(letters: string, digits: string): { column: number; row: number } {
  return { column: lettersToColumn(letters), row: Number(digits) - 1 };
}

/** Reconoce un token al frente de `rest` (sin espacios iniciales). */
function singleToken(rest: string, tokens: Token[]): number | null {
  const char = rest[0];
  if (char === '(') { tokens.push({ kind: 'lparen' }); return 1; }
  if (char === ')') { tokens.push({ kind: 'rparen' }); return 1; }
  if (char === ',') { tokens.push({ kind: 'comma' }); return 1; }
  const string = rest.match(STRING_RAW);
  if (string) {
    const value = string[0].slice(1, -1).replace(/""/g, '"');
    tokens.push({ kind: 'string', value });
    return string[0].length;
  }
  const number = rest.match(NUMBER_RAW);
  if (number) { tokens.push({ kind: 'number', value: number[0] }); return number[0].length; }
  const operator = rest.match(OPERATORS);
  if (operator) { tokens.push({ kind: 'operator', value: operator[0] }); return operator[0].length; }
  return refOrName(rest, tokens);
}

/** Un identificador puede ser función (`SUM(`) o referencia de celda (`B2`). */
function refOrName(rest: string, tokens: Token[]): number | null {
  const identifier = rest.match(LETTERS);
  if (!identifier) return null;
  const word = identifier[0];
  // Un nombre seguido de "(" es una llamada a función, aunque se llame "A".
  const restAfterWord = rest.slice(word.length);
  const gap = restAfterWord.match(/^\s*/)?.[0].length ?? 0;
  if (rest.slice(word.length + gap).startsWith('(')) {
    // El "(" queda como token aparte: el parser espera verlo tras el nombre.
    tokens.push({ kind: 'name', value: word.toLocaleUpperCase() });
    return word.length + gap;
  }
  const cell = rest.match(REF);
  if (!cell) {
    tokens.push({ kind: 'name', value: word.toLocaleUpperCase() });
    return word.length;
  }
  const from = parsePosition(cell[1] ?? '', cell[2] ?? '');
  // `A1:B2` admite espacios alrededor de ":" al escribirse a mano.
  const rangeTail = rest.slice(cell[0].length).match(/^\s*:\s*\$?[A-Za-z]{1,3}\$?\d{1,7}/);
  if (rangeTail) {
    const secondRaw = rangeTail[0].slice(rangeTail[0].indexOf(':') + 1).trim();
    const second = secondRaw.match(REF);
    const to = second ? parsePosition(second[1] ?? '', second[2] ?? '') : null;
    if (to) {
      tokens.push({ kind: 'range', from, to });
      return cell[0].length + rangeTail[0].length;
    }
  }
  tokens.push({ kind: 'cell', ...from });
  return cell[0].length;
}

export function tokenize(formula: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  while (index < formula.length) {
    const gap = formula.slice(index).match(/^\s*/)?.[0].length ?? 0;
    index += gap;
    if (index >= formula.length) break;
    const length = singleToken(formula.slice(index), tokens);
    if (length === null) {
      throw new FormulaSyntaxError(`Carácter no reconocido en "${formula}" (posición ${index})`);
    }
    index += length;
  }
  return tokens;
}
