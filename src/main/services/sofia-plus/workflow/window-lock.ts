import { app, type BrowserWindow } from 'electron';
import type { SofiaWindowSize } from './window-size.js';

// Mientras el usuario no cierre la app, la ventana de la automatización no debe cerrarse
// ni cambiar de tamaño: lo único que puede hacer es minimizarla.
let allowClose = false;
app.once('before-quit', () => {
  allowClose = true;
});

// Bloquea el cierre, la maximización y el redimensionado de la ventana de SofiaPlus.
// En Linux las opciones nativas closable/maximizable son no-ops, así que el bloqueo se
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

  // Alt+F4, el menú del sistema y el botón de cerrar pasan todos por 'close'.
  // destroy() no emite este evento, así que la automatización sí puede cerrarla.
  window.on('close', (event) => {
    if (allowClose) return;
    event.preventDefault();
  });

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

  window.setClosable(false);
  window.setMaximizable(false);
  window.setResizable(false);
}
