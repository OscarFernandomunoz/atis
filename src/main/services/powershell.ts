import { spawn } from 'node:child_process';

/** Convierte un texto en cadena literal de PowerShell (basta duplicar comillas simples). */
export function psString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

/**
 * Ejecuta un script en Windows PowerShell y resuelve si terminó bien.
 *
 * El script viaja en base64 UTF-16LE (`-EncodedCommand`) para que las comillas,
 * los acentos y los saltos de línea del mensaje no rompan la línea de comandos.
 * Nunca rechaza: un fallo (sin interop de WSL, PowerShell bloqueado por política)
 * se resuelve como `false` para que la app busque otra vía de aviso.
 */
export function runPowerShell(script: string, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const encoded = Buffer.from(script, 'utf16le').toString('base64');
    const child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-EncodedCommand', encoded], {
      windowsHide: true,
    });

    const timer = setTimeout(() => {
      child.kill();
      resolve(false);
    }, timeoutMs);

    child.on('error', () => {
      clearTimeout(timer);
      resolve(false);
    });
    child.on('exit', (code) => {
      clearTimeout(timer);
      resolve(code === 0);
    });
  });
}
