import { execFile } from 'node:child_process';
import { APP_TITLE } from '../../../shared/index.js';
import { appFile } from '../../app-paths.js';
import { psString, runPowerShell } from './powershell.js';

/**
 * Identificador con el que Windows firma los avisos de la app.
 *
 * Windows no muestra un nombre ni un logo inventados: para cada aviso busca este
 * identificador y usa lo que tenga registrado. Sin registrarlo, el sistema
 * atribuye el aviso al proceso que lo publica y el toast aparece como
 * "Windows PowerShell" con el logo de PowerShell.
 */
export const WINDOWS_AUMID = 'Aia.GestionNomina';

// La primera vez PowerShell prepara módulos y copia el icono; después es inmediato.
const REGISTRATION_TIMEOUT_MS = 20000;
const APP_FOLDER = 'AIA';
const ICON_NAME = 'sofia-plus.png';

let preparation: Promise<boolean> | null = null;

/** Ruta del icono tal como la ve Windows (en WSL hay que traducirla). */
function windowsIconPath(): Promise<string | null> {
  const local = appFile('public/images', ICON_NAME);
  if (process.platform === 'win32') return Promise.resolve(local);

  // `wslpath` funciona tanto si el proyecto vive dentro de WSL (\\wsl.localhost)
  // como si está en el disco de Windows (/mnt/c/...).
  return new Promise((resolve) => {
    execFile('wslpath', ['-w', local], (error, stdout) => {
      resolve(error ? null : stdout.trim() || null);
    });
  });
}

// Copia el icono a una carpeta local del usuario y registra ahí la identidad.
async function registerAppId(): Promise<boolean> {
  const icon = await windowsIconPath();
  if (!icon) return false;

  const script = [
    "$ErrorActionPreference = 'Stop'",
    `$folder = Join-Path $env:LOCALAPPDATA ${psString(APP_FOLDER)}`,
    'New-Item -ItemType Directory -Force -Path $folder | Out-Null',
    // El icono se copia a Windows porque el registro no puede apuntar a WSL de forma fiable.
    `$icon = Join-Path $folder ${psString(ICON_NAME)}`,
    `Copy-Item -LiteralPath ${psString(icon)} -Destination $icon -Force`,
    `$key = 'HKCU:\\Software\\Classes\\AppUserModelId\\${WINDOWS_AUMID}'`,
    'New-Item -Path $key -Force | Out-Null',
    `Set-ItemProperty -Path $key -Name DisplayName -Value ${psString(APP_TITLE)}`,
    'Set-ItemProperty -Path $key -Name IconUri -Value $icon',
  ].join('; ');

  return runPowerShell(script, REGISTRATION_TIMEOUT_MS);
}

/**
 * Deja lista la identidad de la app en Windows (nombre y logo de los avisos).
 *
 * Se hace una sola vez por sesión: el resultado se memoriza, incluso si falla,
 * para no repetir el trabajo en cada notificación.
 */
export function ensureWindowsAppId(): Promise<boolean> {
  preparation ??= registerAppId();
  return preparation;
}
