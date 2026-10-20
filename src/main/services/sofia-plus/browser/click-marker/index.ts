import type { BrowserWindow } from 'electron';
import type { ClickPoint } from '../../types.js';
import { buildClickMarkerScript } from './script.js';

// Dibuja un puntero de precisión en la coordenada exacta donde se hará clic. El retículo
// (anillo + cruz + punto) está centrado en el punto medido, y la etiqueta se separa lo
// suficiente para no tapar el objetivo. Todo lleva pointer-events: none para no interferir
// con los clics de la automatización.
export async function showClickMarker(
  window: BrowserWindow,
  point: ClickPoint,
  label: string,
  demo = false,
): Promise<void> {
  const script = buildClickMarkerScript(point, label);

  try {
    await window.webContents.mainFrame.executeJavaScript(script);
  } catch {
    for (const frame of window.webContents.mainFrame.frames) {
      try {
        await frame.executeJavaScript(script);
      } catch {
        /* ignore */
      }
    }
  }

  console.log(`[AIA][SofiaPlus] ${demo ? 'Modo demostración: no se ejecutó el clic; ' : 'Clic resaltado; '}posición (${point.x.toFixed(1)}, ${point.y.toFixed(1)}): ${label}`);
}

// Solo resalta el punto de la página, sin ejecutar ningún clic.
export async function markClickPoint(window: BrowserWindow, point: ClickPoint, label: string): Promise<void> {
  await showClickMarker(window, point, label);
}
