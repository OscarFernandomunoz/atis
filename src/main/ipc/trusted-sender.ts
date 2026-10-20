import type { IpcMainEvent, IpcMainInvokeEvent } from 'electron';
import { pathToFileURL } from 'node:url';
import { appFile } from '../app-paths.js';

let rendererUrl: string | null = null;

function getRendererUrl(): string {
  rendererUrl ??= pathToFileURL(appFile('dist/renderer/index.html')).href;
  return rendererUrl;
}

/**
 * Comprueba que un mensaje IPC venga del documento local de la app.
 *
 * El preload solo está instalado en la ventana principal, pero validar el frame
 * evita que una ventana remota o un iframe puedan usar los canales si en el
 * futuro se añade otro preload. Solo se acepta el frame superior del HTML local.
 */
export function isTrustedSender(event: IpcMainEvent | IpcMainInvokeEvent): boolean {
  const frame = event.senderFrame;
  if (!frame) return false;

  try {
    return frame === frame.top && frame.url === getRendererUrl();
  } catch {
    return false;
  }
}
