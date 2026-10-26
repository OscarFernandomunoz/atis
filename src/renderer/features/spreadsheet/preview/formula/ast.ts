// Arbol de sintaxis de una fórmula A1, tal como la produce `parser.ts`.

export interface Position {
  column: number;
  row: number;
}

export type BinaryOperator = '+' | '-' | '*' | '/' | '^' | '&' | '=' | '<>' | '<' | '>' | '<=' | '>=';

export type Expression =
  | { kind: 'number'; value: number }
  | { kind: 'string'; value: string }
  | { kind: 'cell'; position: Position }
  | { kind: 'range'; from: Position; to: Position }
  | { kind: 'call'; name: string; args: Expression[] }
  | { kind: 'unary'; operator: '+' | '-'; operand: Expression }
  | { kind: 'percent'; operand: Expression }
  | { kind: 'binary'; operator: BinaryOperator; left: Expression; right: Expression };
