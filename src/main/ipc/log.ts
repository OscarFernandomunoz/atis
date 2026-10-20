import { ipcMain } from 'electron';
import { sanitizeLogText, type AppLogEntry, type AppLogLevel } from '../../shared/index.js';
import { isTrustedSender } from './trusted-sender.js';
import { mainLogger } from '../logger.js';

const MAX_SCOPE_LENGTH = 80;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_DETAIL_LENGTH = 4000;
const LEVELS: ReadonlySet<AppLogLevel> = new Set(['debug', 'info', 'warn', 'error']);

function isAppLogEntry(value: unknown): value is AppLogEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Record<string, unknown>;
  return typeof entry.level === 'string'
    && LEVELS.has(entry.level as AppLogLevel)
    && typeof entry.scope === 'string'
    && entry.scope.length <= MAX_SCOPE_LENGTH
    && typeof entry.message === 'string'
    && entry.message.length <= MAX_MESSAGE_LENGTH
    && (entry.detail === undefined
      || (typeof entry.detail === 'string' && entry.detail.length <= MAX_DETAIL_LENGTH));
}

function writeEntry(entry: AppLogEntry): void {
  const scope = sanitizeLogText(entry.scope);
  const message = sanitizeLogText(entry.message);
  const detail = entry.detail ? sanitizeLogText(entry.detail) : undefined;

  // Usa el logger profesional con prefijo [Renderer] para distinguir origen
  const loggerEntry = {
    level: entry.level,
    scope: `Renderer/${scope}`,
    message,
    detail,
    timestamp: new Date().toISOString(),
  };

  if (entry.level === 'error') {
    mainLogger.error(loggerEntry.scope, loggerEntry.message, loggerEntry.detail);
  } else if (entry.level === 'warn') {
    mainLogger.warn(loggerEntry.scope, loggerEntry.message, loggerEntry.detail);
  } else if (entry.level === 'info') {
    mainLogger.info(loggerEntry.scope, loggerEntry.message, loggerEntry.detail);
  } else {
    mainLogger.debug(loggerEntry.scope, loggerEntry.message, loggerEntry.detail);
  }
}

// Recibe los logs del renderer y los publica en la salida del proceso principal.
// Así la consola de DevTools queda limpia y la terminal conserva el diagnóstico.
export function registerLogHandlers(): void {
  ipcMain.on('app:log', (event, entry: unknown) => {
    if (!isTrustedSender(event)) return;
    if (!isAppLogEntry(entry)) return;
    writeEntry(entry);
  });
}
