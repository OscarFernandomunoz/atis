import { BrowserWindow, ipcMain } from 'electron';
import { applyTitleBarTheme } from '../windows/index.js';

// Canales de la barra de título y de los controles de ventana.
export function registerWindowHandlers(): void {
  // Sincroniza el tema y la barra nativa de todas las ventanas de la app.
  ipcMain.on('window:set-title-bar-theme', (event, theme: unknown) => {
    if (theme !== 'light' && theme !== 'dark') return;
    if (!BrowserWindow.fromWebContents(event.sender)) return;

    for (const window of BrowserWindow.getAllWindows()) {
      applyTitleBarTheme(window, theme);
    }
  });

  // Los controles de fallback siempre se dirigen a la ventana que envió el evento.
  ipcMain.on('window:minimize', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize();
  });

  ipcMain.on('window:toggle-maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return;
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  });

  ipcMain.on('window:close', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close();
  });

  ipcMain.handle('window:is-maximized', (event) => {
    return BrowserWindow.fromWebContents(event.sender)?.isMaximized() ?? false;
  });
}
