import { BrowserWindow } from 'electron';
import { appFile } from '../app-paths.js';
import { getAppWindowOptions, getCurrentTitleBarTheme } from './appearance.js';

// Crea la ventana principal de la aplicación con el renderer HTML y el preload seguro.
export function createMainWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 720,
    minHeight: 520,
    // Se muestra recién cuando el renderer pintó su primer frame: así el arranque
    // no enseña una ventana vacía ni obliga a recomponer la interfaz a la vista.
    show: false,
    ...getAppWindowOptions(getCurrentTitleBarTheme()),
    webPreferences: {
      preload: appFile('dist/preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      // La app no usa corrector ortográfico; desactivarlo evita levantar ese
      // servicio al escribir en los campos.
      spellcheck: false,
    },
  });

  // Red de seguridad: si `ready-to-show` no llega, la ventana aparece igual.
  const showFallback = setTimeout(() => {
    if (!mainWindow.isDestroyed() && !mainWindow.isVisible()) mainWindow.show();
  }, 1500);
  mainWindow.once('ready-to-show', () => {
    clearTimeout(showFallback);
    if (!mainWindow.isDestroyed()) mainWindow.show();
  });
  mainWindow.once('closed', () => clearTimeout(showFallback));

  // También sincroniza el estado cuando el sistema o un atajo maximizan la ventana.
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window:maximized');
  });
  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window:unmaximized');
  });

  // Carga la interfaz de usuario compilada en la carpeta dist.
  mainWindow.loadFile(appFile('dist/renderer/index.html'));
  return mainWindow;
}
