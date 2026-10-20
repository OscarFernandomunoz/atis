// API pública de las utilidades específicas del sistema operativo.
export { psString, runPowerShell } from './powershell.js';
export { WINDOWS_AUMID, ensureWindowsAppId } from './windows-app-id.js';
export { isWsl } from './wsl.js';
