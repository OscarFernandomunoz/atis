/**
 * ¿La app corre dentro de WSL?
 *
 * WSLg dibuja las ventanas de Linux en Windows, pero la sesión de Linux no tiene
 * servicio de notificaciones (libnotify falla en silencio, igual que `notify-send`).
 * Como el escritorio real es Windows, ahí sí se pueden publicar los avisos.
 */
export function isWsl(): boolean {
  return Boolean(process.env.WSL_DISTRO_NAME || process.env.WSL_INTEROP);
}
