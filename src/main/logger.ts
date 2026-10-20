/**
 * Logger profesional para el proceso principal.
 * Salida exclusiva en terminal (stdout/stderr), nada en DevTools.
 */

import { APP_TITLE } from '../shared/window.js';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  scope: string;
  message: string;
  detail?: string;
  timestamp: string;
}

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: '\x1b[36m', // cyan
  info: '\x1b[32m',  // green
  warn: '\x1b[33m',  // yellow
  error: '\x1b[31m', // red
};

const RESET_COLOR = '\x1b[0m';
const DIM_COLOR = '\x1b[2m';
const BOLD_COLOR = '\x1b[1m';

const isTTY = process.stdout.isTTY;

/** Formatea una fecha como HH:MM:SS.mmm */
function formatTime(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const ms = String(now.getMilliseconds()).padStart(3, '0');
  return `${hh}:${mm}:${ss}.${ms}`;
}

/** Escapa secuencias de control ANSI del texto de entrada. */
function sanitize(value: string): string {
  let result = '';
  for (const char of value) {
    const code = char.charCodeAt(0);
    if (code === 0x7f || (code < 0x20 && code !== 0x09 && code !== 0x0a)) continue;
    result += char;
  }
  return result;
}

/** Escribe la entrada en el stream correspondiente. */
function write(entry: LogEntry): void {
  const time = formatTime();
  const color = isTTY ? LEVEL_COLORS[entry.level] : '';
  const reset = isTTY ? RESET_COLOR : '';
  const dim = isTTY ? DIM_COLOR : '';
  const bold = isTTY ? BOLD_COLOR : '';

  const levelLabel = entry.level.toUpperCase().padEnd(5);
  const scope = sanitize(entry.scope).slice(0, 60);
  const message = sanitize(entry.message).slice(0, 500);
  const detail = entry.detail ? `\n${dim}${sanitize(entry.detail).slice(0, 1000)}${reset}` : '';

  const line = `${dim}${time}${reset} ${color}${bold}[${levelLabel}]${reset} ${color}${scope}${reset} ${message}${detail}`;

  if (entry.level === 'error') {
    console.error(line);
  } else if (entry.level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

/** Crea una función de log para un nivel específico. */
function createLogger(level: LogLevel) {
  return (scope: string, message: unknown, detail?: unknown): void => {
    write({
      level,
      scope: scope.slice(0, 60),
      message: String(message).slice(0, 500),
      detail: detail !== undefined ? String(detail) : undefined,
      timestamp: new Date().toISOString(),
    });
  };
}

export const mainLogger = {
  debug: createLogger('debug'),
  info: createLogger('info'),
  warn: createLogger('warn'),
  error: createLogger('error'),
};

/** Log de arranque con banner de la aplicación. */
export function logStartup(): void {
  if (!isTTY) return;
  const width = 60;
  const title = ` ${APP_TITLE} `;
  const padding = Math.max(0, width - title.length);
  const left = '═'.repeat(Math.floor(padding / 2));
  const right = '═'.repeat(Math.ceil(padding / 2));
  console.log(`\n${DIM_COLOR}${left}${BOLD_COLOR}${title}${DIM_COLOR}${right}${RESET_COLOR}\n`);
}

/** Log de cierre limpio. */
export function logShutdown(): void {
  mainLogger.info('Main', 'Apagando la aplicación...');
}