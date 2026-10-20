import type { AppLogEntry, AppLogLevel } from '../../shared/index.js';

// Los mensajes del renderer no se imprimen en DevTools: viajan por IPC al
// proceso principal, que los escribe en la terminal junto con el resto de logs.
const MAX_SCOPE_LENGTH = 80;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_DETAIL_LENGTH = 4000;

function stringifyDetail(detail: unknown): string | undefined {
  if (detail === undefined || detail === null) return undefined;
  if (detail instanceof Error) {
    return (detail.stack || detail.message).slice(0, MAX_DETAIL_LENGTH);
  }
  if (typeof detail === 'string') return detail.slice(0, MAX_DETAIL_LENGTH);
  try {
    return JSON.stringify(detail).slice(0, MAX_DETAIL_LENGTH);
  } catch {
    return String(detail).slice(0, MAX_DETAIL_LENGTH);
  }
}

function send(level: AppLogLevel, scope: string, message: unknown, detail?: unknown): void {
  const api = window.electronAPI;
  // Si el preload no cargó no hay terminal a la que enviar el mensaje, pero
  // tampoco se recurre a console.* para no ensuciar DevTools.
  if (typeof api?.log !== 'function') return;

  const entry: AppLogEntry = {
    level,
    scope: scope.slice(0, MAX_SCOPE_LENGTH),
    message: String(message).slice(0, MAX_MESSAGE_LENGTH),
  };
  const serializedDetail = stringifyDetail(detail);
  if (serializedDetail) entry.detail = serializedDetail;
  api.log(entry);
}

export const logger = {
  debug: (scope: string, message: unknown, detail?: unknown): void => send('debug', scope, message, detail),
  info: (scope: string, message: unknown, detail?: unknown): void => send('info', scope, message, detail),
  warn: (scope: string, message: unknown, detail?: unknown): void => send('warn', scope, message, detail),
  error: (scope: string, message: unknown, detail?: unknown): void => send('error', scope, message, detail),
};
