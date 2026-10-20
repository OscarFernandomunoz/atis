import { app, nativeTheme, type BrowserWindow, type BrowserWindowConstructorOptions } from 'electron';
import {
  APP_TITLE,
  TITLE_BAR_HEIGHT,
  isSofiaNavigationAllowed,
  isSofiaPlusUrl,
  type TitleBarTheme,
} from '../../shared/index.js';
import { appFile } from '../app-paths.js';
import { TITLE_BAR_OVERLAY_COLORS, TITLE_BAR_THEME_COLORS } from './palette.js';
import { buildRemoteChromeScript } from './remote-chrome.js';

let activeTitleBarTheme: TitleBarTheme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
const remoteWindows = new WeakSet<BrowserWindow>();
const restrictedWindows = new WeakSet<BrowserWindow>();

export function getCurrentTitleBarTheme(): TitleBarTheme {
  return activeTitleBarTheme;
}

function isRemoteSofiaWindow(window: BrowserWindow): boolean {
  if (remoteWindows.has(window)) return true;

  try {
    return isSofiaPlusUrl(window.webContents.getURL());
  } catch {
    return false;
  }
}

function getWindowAppearanceOptions(
  initialTheme: TitleBarTheme = getCurrentTitleBarTheme(),
): BrowserWindowConstructorOptions {
  if (process.platform === 'darwin') {
    return {
      titleBarStyle: 'hiddenInset',
      trafficLightPosition: { x: 16, y: 18 },
    };
  }

  if (process.platform === 'win32' || process.platform === 'linux') {
    return {
      titleBarStyle: 'hidden',
      titleBarOverlay: {
        ...TITLE_BAR_OVERLAY_COLORS[initialTheme],
        height: TITLE_BAR_HEIGHT,
      },
    };
  }

  return { frame: false };
}

export function getAppWindowOptions(
  initialTheme: TitleBarTheme = getCurrentTitleBarTheme(),
): BrowserWindowConstructorOptions {
  return {
    title: APP_TITLE,
    icon: appFile('public/images/logo.png'),
    autoHideMenuBar: true,
    backgroundColor: TITLE_BAR_THEME_COLORS[initialTheme].background,
    // En la app empaquetada no se abren DevTools: el usuario final no necesita
    // el contexto de depuración y una página remota no debe poder inspeccionarse.
    // Las emergentes del portal heredan esta misma configuración restrictiva.
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: !app.isPackaged,
    },
    ...getWindowAppearanceOptions(initialTheme),
  };
}

export function applyTitleBarTheme(window: BrowserWindow, theme: TitleBarTheme): void {
  activeTitleBarTheme = theme;
  if (window.isDestroyed()) return;

  if (process.platform === 'win32' || process.platform === 'linux') {
    try {
      window.setTitleBarOverlay({
        ...TITLE_BAR_OVERLAY_COLORS[theme],
        height: TITLE_BAR_HEIGHT,
      });
    } catch (error) {
      console.warn('[AIA][Window] No se pudo actualizar el overlay nativo de la ventana.', error);
    }
  }

  if (isRemoteSofiaWindow(window)) {
    void window.webContents.executeJavaScript(buildRemoteChromeScript(theme), true).catch(() => {
      // La página puede estar navegándose; se reintentará en dom-ready.
    });
  }
}

// Una ventana remota solo puede navegar dentro del portal. Esto evita que el
// contenido de SofiaPlus (o un enlace malicioso dentro de él) saque al usuario a
// otro sitio con la misma apariencia y el mismo cromo de la app.
function restrictRemoteNavigation(window: BrowserWindow): void {
  if (restrictedWindows.has(window)) return;
  restrictedWindows.add(window);

  window.webContents.on('will-navigate', (event, url) => {
    if (!isSofiaNavigationAllowed(url)) event.preventDefault();
  });
  window.webContents.on('will-redirect', (event, url) => {
    if (!isSofiaNavigationAllowed(url)) event.preventDefault();
  });

  window.webContents.setWindowOpenHandler(({ url }) => (
    isSofiaNavigationAllowed(url)
      ? {
        action: 'allow',
        // Las emergentes del portal (diálogo de instructor, etc.) acompañan a la ventana
        // visible de SofiaPlus y conservan su mismo aspecto.
        overrideBrowserWindowOptions: getAppWindowOptions(getCurrentTitleBarTheme()),
      }
      : { action: 'deny' }
  ));
}

export function registerRemoteWindow(window: BrowserWindow): void {
  if (remoteWindows.has(window)) return;
  remoteWindows.add(window);
  restrictRemoteNavigation(window);

  const decorate = (): void => {
    if (window.isDestroyed() || window.webContents.isDestroyed()) return;
    void window.webContents.executeJavaScript(
      buildRemoteChromeScript(getCurrentTitleBarTheme()),
      true,
    ).catch(() => {
      // El contenido todavía puede estar cambiando durante una navegación.
    });
  };

  // Una navegación dispara varios eventos seguidos. Se agrupan en una sola
  // decoración para no reescribir la barra varias veces en el mismo instante.
  let decorateTimer: ReturnType<typeof setTimeout> | null = null;
  const scheduleDecorate = (): void => {
    if (decorateTimer !== null) return;
    decorateTimer = setTimeout(() => {
      decorateTimer = null;
      decorate();
    }, 60);
  };

  window.webContents.on('dom-ready', scheduleDecorate);
  window.webContents.on('did-start-navigation', scheduleDecorate);
  window.webContents.on('did-finish-load', scheduleDecorate);
  window.webContents.on('did-frame-finish-load', scheduleDecorate);

  // Algunos portales reescriben el documento después de dom-ready; estos
  // reintentos garantizan que la barra vuelva a quedar visible sin tocar su
  // contenido. Una vez decorado, el script sale sin rehacer el cromo.
  const retryTimer = setInterval(decorate, 1_000);
  const stopRetries = (): void => {
    clearInterval(retryTimer);
    if (decorateTimer !== null) clearTimeout(decorateTimer);
    decorateTimer = null;
  };
  setTimeout(stopRetries, 10_000);
  window.once('closed', stopRetries);

  decorate();
}
