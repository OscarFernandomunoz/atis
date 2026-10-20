/** Niveles de registro que el renderer puede enviar al proceso principal. */
export type AppLogLevel = 'debug' | 'info' | 'warn' | 'error';

/** Entrada de registro que cruza el puente IPC desde el renderer. */
export interface AppLogEntry {
  level: AppLogLevel;
  scope: string;
  message: string;
  detail?: string;
}

/**
 * Limpia secuencias de control antes de escribir en la terminal.
 *
 * El texto puede venir de una página remota o de un archivo del usuario; sin
 * esta limpieza, una secuencia ANSI podría manipular la salida o el título de
 * la terminal. Se conservan saltos de línea y tabulaciones.
 */
export function sanitizeLogText(value: string): string {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
}
