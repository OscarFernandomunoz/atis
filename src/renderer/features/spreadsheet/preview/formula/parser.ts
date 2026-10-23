// Parser descendente de fórmulas A1: tokens de `tokens.ts` → arbol `ast.ts`.
// La precedencia replica la de Excel: comparaciones < & < +- < */ < ^ < unarios.

import type { BinaryOperator, Expression } from './ast.js';
import { tokenize, FormulaSyntaxError, type Token } from './tokens.js';

const COMPARISON_OPS = new Set<string>(['=', '<>', '<', '>', '<=', '>=']);
const CONCAT_OPS = new Set<string>(['&']);
const ADDITIVE_OPS = new Set<string>(['+', '-']);
const MULTIPLICATIVE_OPS = new Set<string>(['*', '/']);
const POWER_OPS = new Set<string>(['^']);

export class FormulaParser {
  private position = 0;

  constructor(private readonly tokens: Token[]) {}

  parse(): Expression {
    const expression = this.parseExpression();
    if (this.position < this.tokens.length) {
      throw new FormulaSyntaxError(`Contenido sobrante en la fórmula (token ${this.position})`);
    }
    return expression;
  }

  private parseExpression(): Expression {
    return this.parseBinary(COMPARISON_OPS, () => this.parseConcat());
  }

  private parseConcat(): Expression {
    return this.parseBinary(CONCAT_OPS, () => this.parseAdditive());
  }

  private parseAdditive(): Expression {
    return this.parseBinary(ADDITIVE_OPS, () => this.parseMultiplicative());
  }

  private parseMultiplicative(): Expression {
    return this.parseBinary(MULTIPLICATIVE_OPS, () => this.parsePower());
  }

  private parsePower(): Expression {
    return this.parseBinary(POWER_OPS, () => this.parseUnary());
  }

  /** Une dos niveles de precedencia: mientras entre el operador del set, evalúa a la derecha por el siguiente nivel. */
  private parseBinary(operators: Set<string>, next: () => Expression): Expression {
    let left = next();
    while (this.position < this.tokens.length) {
      const token = this.tokens[this.position];
      if (token?.kind !== 'operator' || !operators.has(token.value)) break;
      this.position += 1;
      const right = next();
      left = { kind: 'binary', operator: token.value as BinaryOperator, left, right };
    }
    return left;
  }

  private parseUnary(): Expression {
    const token = this.tokens[this.position];
    if (token?.kind === 'operator' && (token.value === '+' || token.value === '-')) {
      this.position += 1;
      // En Excel -2^2 es 4: el unario se aplica antes que la potencia.
      const operand = this.parseUnary();
      return token.value === '-'
        ? { kind: 'unary', operator: '-', operand }
        : { kind: 'unary', operator: '+', operand };
    }
    return this.parsePostfix();
  }

  private parsePostfix(): Expression {
    let expression = this.parsePrimary();
    // El sufijo % une más que todo lo demás: 50% + 1 es 1.5.
    while (this.tokens[this.position]?.kind === 'operator' && this.valueIs('%')) {
      this.position += 1;
      expression = { kind: 'percent', operand: expression };
    }
    return expression;
  }

  private valueIs(value: string): boolean {
    const token = this.tokens[this.position];
    return token?.kind === 'operator' && token.value === value;
  }

  private parsePrimary(): Expression {
    const token = this.tokens[this.position];
    if (!token) throw new FormulaSyntaxError('La fórmula termina antes de lo esperado');
    this.position += 1;
    switch (token.kind) {
      case 'number': return { kind: 'number', value: Number(token.value) };
      case 'string': return { kind: 'string', value: token.value };
      case 'cell': return { kind: 'cell', position: { column: token.column, row: token.row } };
      case 'range': return { kind: 'range', from: token.from, to: token.to };
      case 'name': return this.parseCall(token.value);
      case 'lparen': {
        const inner = this.parseExpression();
        if (this.tokens[this.position]?.kind !== 'rparen') {
          throw new FormulaSyntaxError('Falta el paréntesis de cierre');
        }
        this.position += 1;
        return inner;
      }
      default: throw new FormulaSyntaxError(`Token inesperado de tipo ${token.kind}`);
    }
  }

  private parseCall(name: string): Expression {
    if (this.tokens[this.position]?.kind !== 'lparen') {
      throw new FormulaSyntaxError(`El nombre "${name}" no va seguido de paréntesis`);
    }
    this.position += 1;
    const args: Expression[] = [];
    if (this.tokens[this.position]?.kind !== 'rparen') {
      args.push(this.parseExpression());
      while (this.tokens[this.position]?.kind === 'comma') {
        this.position += 1;
        args.push(this.parseExpression());
      }
    }
    if (this.tokens[this.position]?.kind !== 'rparen') {
      throw new FormulaSyntaxError(`Falta el paréntesis de cierre de ${name}()`);
    }
    this.position += 1;
    return { kind: 'call', name, args };
  }
}

export function parseFormula(source: string): Expression {
  // La fórmula se guarda en SheetJS sin el "=" inicial; se tolera con él.
  const body = source.startsWith('=') ? source.slice(1) : source;
  return new FormulaParser(tokenize(body)).parse();
}
