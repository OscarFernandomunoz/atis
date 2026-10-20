import type { Session } from 'electron';

/**
 * Reduce la superficie de una sesión web al mínimo que necesita la app.
 *
 * La interfaz no usa cámara, micrófono, geolocalización, portapapeles ni
 * dispositivos; la automatización solo lee y pulsa dentro del portal. Negar
 * todo por defecto evita que una página comprometida pida permisos al usuario
 * o descargue archivos sin que este lo haya solicitado.
 */
export function hardenSession(ses: Session): void {
  ses.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  ses.setPermissionCheckHandler(() => false);
  ses.setDevicePermissionHandler(() => false);
  ses.on('will-download', (event) => event.preventDefault());
}
