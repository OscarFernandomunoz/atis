import { type BrowserWindow } from 'electron';
import type { SofiaWindowSize } from './window-size.js';

// Bloquea la maximización y el redimensionado de la ventana de SofiaPlus.
// El usuario PUEDE cerrar la ventana con el botón X (al hacerlo se limpia la sesión).
// En Linux las opciones nativas maximizable/resizable son no-ops, así que el bloqueo se
// refuerza con los eventos de la ventana y con la comprobación del tamaño en cada resize.
export function lockSofiaWindow(window: BrowserWindow, size: SofiaWindowSize): void {
  let applyingSize = false;

  const enforceFixedSize = (): void => {
    if (window.isDestroyed() || applyingSize) return;

    if (window.isFullScreen()) {
      window.setFullScreen(false);
      return;
    }
    if (window.isMaximized()) {
      window.unmaximize();
      return;
    }

    const [width, height] = window.getSize();
    if (width === size.width && height === size.height) return;

    applyingSize = true;
    window.setSize(size.width, size.height);
    applyingSize = false;
  };

  // El menú del sistema de la barra de título permite mover y redimensionar la ventana
  // aunque los botones nativos estén deshabilitados.
  window.on('system-context-menu', (event) => {
    event.preventDefault();
  });

  // Los botones laterales del mouse (atrás/adelante) navegarían por el portal y sacarían
  // al flujo de la pantalla en la que está trabajando.
  window.on('app-command', (event) => {
    event.preventDefault();
  });

  window.on('maximize', () => {
    if (!window.isDestroyed()) window.unmaximize();
  });
  window.on('enter-full-screen', () => {
    if (!window.isDestroyed()) window.setFullScreen(false);
  });
  window.on('resize', enforceFixedSize);

  window.setMaximizable(false);
  window.setResizable(false);
  // NOTA: NO se llama a setClosable(false) para permitir que el usuario cierre la ventana.
  // Al cerrar, window-loader.ts limpia la sesión (cookies, caché, credenciales).
}
