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
 * ¿El texto contiene caracteres de control?
 *
 * Se recorre carácter a carácter para no usar una expresión regular con
 * rangos de control, que ESLint rechaza. Se conservan tabulación y salto de
 * línea porque son parte normal del diagnóstico.
 */
export function hasUnsafeControlChars(value: string): boolean {
  for (const char of value) {
    const code = char.charCodeAt(0);
    if (code === 0x7f || (code < 0x20 && code !== 0x09 && code !== 0x0a)) {
      return true;
    }
  }
  return false;
}

/**
 * Limpia secuencias de control antes de escribir en la terminal.
 *
 * El texto puede venir de una página remota o de un archivo del usuario; sin
 * esta limpieza, una secuencia ANSI podría manipular la salida o el título de
 * la terminal. Se conservan saltos de línea y tabulaciones.
 */
export function sanitizeLogText(value: string): string {
  let result = '';
  for (const char of value) {
    const code = char.charCodeAt(0);
    if (code === 0x7f || (code < 0x20 && code !== 0x09 && code !== 0x0a)) continue;
    result += char;
  }
  return result;
}
