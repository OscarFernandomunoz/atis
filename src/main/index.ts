import { app, BrowserWindow, session } from 'electron';
import { isSofiaPlusUrl, SOFIA_PARTITION } from '../shared/index.js';
import { registerIpcHandlers } from './ipc/index.js';
import { hardenSession } from './security/session.js';
import { createMainWindow, registerRemoteWindow } from './windows/index.js';
import { isWsl, WINDOWS_AUMID, ensureWindowsAppId } from './services/platform/index.js';

// Windows atribuye cada notificación a la app por este identificador: sin él, los
// avisos aparecen con el nombre del ejecutable en lugar del de la aplicación.
if (process.platform === 'win32') {
  app.setAppUserModelId(WINDOWS_AUMID);
}

app.on('browser-window-created', (_event, window) => {
  const registerIfRemote = (): void => {
    if (window.isDestroyed()) return;

    try {
      if (isSofiaPlusUrl(window.webContents.getURL())) {
        registerRemoteWindow(window);
      }
    } catch {
      // La URL todavía puede no estar disponible durante la creación de la ventana.
    }
  };

  window.webContents.on('did-start-navigation', registerIfRemote);
  window.webContents.on('did-finish-load', registerIfRemote);
  registerIfRemote();
});

// El proceso principal inicializa la app, registra los canales IPC y crea la ventana principal.
app.whenReady().then(() => {
  try {
    // La interfaz y el portal no necesitan permisos del navegador. Las descargas
    // se bloquean solo en la sesión del portal: la app sí descarga su Excel.
    hardenSession(session.defaultSession);
    hardenSession(session.fromPartition(SOFIA_PARTITION), { blockDownloads: true });
    // Se habilitan los handlers del proceso principal para que el renderer pueda pedir acciones.
    registerIpcHandlers();
    // Se registra la identidad de la app en Windows (nombre y logo de los avisos)
    // en segundo plano: el primer aviso ya la encontrará lista.
    if (isWsl() || process.platform === 'win32') {
      void ensureWindowsAppId();
    }
    // Se crea la ventana principal de la aplicación al arrancar.
    const mainWindow = createMainWindow();
    // La ventana de SofiaPlus no se puede cerrar por el usuario: si desaparece la principal,
    // hay que terminar la app para no dejarlo atrapado con una ventana que no puede cerrar.
    mainWindow.on('closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    // En macOS, cuando la app vuelve a activarse, se reabre la ventana si no hay ninguna abierta.
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      }
    });
  } catch (error) {
    console.error('[AIA][Main] No se pudo inicializar la aplicación.', error);
  }
});

// Cuando todas las ventanas se cierran, la aplicación termina, excepto en macOS donde suele quedarse viva.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
