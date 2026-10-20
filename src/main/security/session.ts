import type { Session } from 'electron';

interface SessionHardeningOptions {
  /** Bloquea las descargas iniciadas por el contenido de la sesión. */
  blockDownloads?: boolean;
}

/**
 * Reduce la superficie de una sesión web al mínimo que necesita la app.
 *
 * La interfaz no usa cámara, micrófono, geolocalización, portapapeles ni
 * dispositivos; la automatización solo lee y pulsa dentro del portal. Negar
 * todo por defecto evita que una página comprometida pida permisos al usuario.
 */
export function hardenSession(ses: Session, { blockDownloads = false }: SessionHardeningOptions = {}): void {
  ses.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  ses.setPermissionCheckHandler(() => false);
  ses.setDevicePermissionHandler(() => false);

  // La ventana local descarga el Excel que genera la app (blob), así que ahí no
  // se bloquean las descargas. El portal remoto no necesita descargar nada.
  if (blockDownloads) {
    ses.on('will-download', (event) => event.preventDefault());
  }
}
