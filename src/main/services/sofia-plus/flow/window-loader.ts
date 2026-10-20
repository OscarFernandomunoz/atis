import { BrowserWindow } from 'electron';
import { getAppWindowOptions, getCurrentTitleBarTheme, registerRemoteWindow } from '../../../windows/appearance.js';
import { getTrackedChildWindows, patchSofiaPageGuards, trackSofiaWindow, wait } from '../browser/index.js';
import { lockSofiaWindow } from './window-lock.js';
import { getSofiaWindowSize } from './window-size.js';

const SOFIA_URL = 'http://senasofiaplus.edu.co/sofia-public/';
// Partición propia: permite borrar las cookies y la caché de la automatización sin tocar
// las preferencias de la aplicación, que viven en la sesión por defecto.
export const SOFIA_PARTITION = 'sofia-automation';
let sofiaWindow: BrowserWindow | null = null;
let requestFilterInstalled = false;

// Carga la URL base con reintentos. Se usa al crear la ventana y al reiniciar la sesión:
// cada corrida debe empezar en la pantalla de login.
async function loadSofiaUrl(window: BrowserWindow): Promise<void> {
  let lastLoadError: Error | undefined;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await window.loadURL(SOFIA_URL);
      return;
    } catch (error) {
      lastLoadError = error instanceof Error ? error : new Error(String(error));
      const attemptNumber = attempt + 1;
      if (attemptNumber < 3) {
        console.warn(`[AIA][SofiaPlus] No se pudo cargar SofiaPlus en el intento ${attemptNumber}/3; se reintentará.`, error);
        await wait(500 * attemptNumber);
      } else {
        console.error('[AIA][SofiaPlus] No se pudo cargar SofiaPlus después de 3 intentos.', error);
      }
    }
  }
  throw new Error(`No se pudo cargar SofiaPlus: ${lastLoadError?.message ?? 'error desconocido'}`);
}

// Crea o reutiliza la ventana visible de SofiaPlus. Al reutilizarla se vuelve a cargar la
// URL base, porque la sesión se limpia entre corridas y hay que partir del login.
export async function loadWindow(): Promise<BrowserWindow> {
  if (sofiaWindow && !sofiaWindow.isDestroyed()) {
    await loadSofiaUrl(sofiaWindow);
    sofiaWindow.focus();
    return sofiaWindow;
  }

  // Tamaño fijo: el usuario solo puede minimizar la ventana, no redimensionarla ni cerrarla.
  const size = getSofiaWindowSize();
  const window = new BrowserWindow({
    width: size.width,
    height: size.height,
    minWidth: size.width,
    minHeight: size.height,
    maxWidth: size.width,
    maxHeight: size.height,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    minimizable: true,
    closable: false,
    ...getAppWindowOptions(getCurrentTitleBarTheme()),
    webPreferences: {
      partition: SOFIA_PARTITION,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  registerRemoteWindow(window);
  lockSofiaWindow(window, size);
  sofiaWindow = window;
  window.on('closed', () => { sofiaWindow = null; });
  // Permite que executeInFrames alcance también las ventanas emergentes del sitio
  // (el diálogo del instructor se abre con window.open).
  trackSofiaWindow(window);

  // Corrige la doble barra de algunas URLs del portal. Vive en la sesión, no en la ventana:
  // se instala una sola vez aunque la ventana se recree.
  if (!requestFilterInstalled) {
    requestFilterInstalled = true;
    window.webContents.session.webRequest.onBeforeRequest(
      { urls: ['http://senasofiaplus.edu.co//*'] },
      (details, callback) => {
        const normalizedUrl = details.url.replace(
          'http://senasofiaplus.edu.co//',
          'http://senasofiaplus.edu.co/',
        );
        callback(normalizedUrl === details.url ? {} : { redirectURL: normalizedUrl });
      },
    );
  }

  window.webContents.on('did-frame-finish-load', () => {
    void patchSofiaPageGuards(window);
  });

  try {
    await loadSofiaUrl(window);
  } catch (error) {
    window.destroy();
    throw error;
  }
  window.focus();
  return window;
}

// Cierra la ventana principal del portal. Se usa al terminar la corrida (con éxito o error)
// para no dejar la sesión abierta ni una ventana visible con la página del SENA.
export function closeSofiaWindow(): void {
  if (sofiaWindow && !sofiaWindow.isDestroyed()) {
    sofiaWindow.destroy();
  }
  sofiaWindow = null;
}

// Cierra las emergentes que el portal haya dejado abiertas (diálogo del instructor, etc.).
// Pertenecen a la corrida anterior y no deben sobrevivir a un reinicio de sesión.
export function closeSofiaPopups(): void {
  const mainWindow = sofiaWindow;

  // Primero las emergentes registradas por el portal: algunas todavía pueden estar en
  // `about:blank` y no se detectarían por la URL.
  if (mainWindow && !mainWindow.isDestroyed()) {
    for (const child of getTrackedChildWindows(mainWindow)) {
      if (!child.isDestroyed()) child.destroy();
    }
  }

  // Respaldo: cualquier otra ventana del portal que no esté registrada.
  for (const window of BrowserWindow.getAllWindows()) {
    if (window === mainWindow || window.isDestroyed()) continue;
    try {
      if (window.webContents.getURL().toLowerCase().includes('senasofiaplus')) {
        window.destroy();
      }
    } catch {
      // La ventana pudo cerrarse mientras se recorre la lista.
    }
  }
}
