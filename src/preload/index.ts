import { contextBridge, ipcRenderer } from 'electron';
import { getTitleBarPlatform, type TitleBarTheme } from '../shared/index.js';
import type { NotificationPermission, SystemNotification } from '../shared/index.js';

// Este API expone una interfaz segura desde el preload hacia el renderer.
// Se limita a invocar canales IPC definidos en el proceso principal sin permitir acceso directo a Node.
const electronAPI = {
  titleBarPlatform: getTitleBarPlatform(),

  openSofiaAndFill: (credentials: {
    username: string;
    password: string;
    startDate: string;
    endDate: string;
    identification: string;
    identifications?: string[];
  }, onProgress?: (identification: string | null, hours: string | null) => void): Promise<Array<{ identification: string; totalHours: string | null }>> => {
    if (onProgress) {
      const channel = 'sofia:progress';
      const listener = (_event: Electron.IpcRendererEvent, identification: string | null, hours: string | null): void => onProgress(identification, hours);
      ipcRenderer.on(channel, listener);
      return ipcRenderer.invoke('sofia:open-and-fill', credentials).finally(() => {
        ipcRenderer.removeListener(channel, listener);
      });
    }
    return ipcRenderer.invoke('sofia:open-and-fill', credentials);
  },

  // Pausa o reanuda la automatización en curso; reanuda justo donde quedó.
  setAutomationPaused: (paused: boolean): void => ipcRenderer.send('sofia:set-paused', paused),

  // Aplica las horas a TODAS las cédulas en una sola pasada con Excel real (COM).
  applyHoursMultipleToExcel: (payload: { data: ArrayBuffer; fileName: string; targets: Array<{ identification: string; totalHours: string }> }): Promise<ArrayBuffer | null> =>
    ipcRenderer.invoke('excel:apply-hours-multiple', payload),

  // Sincroniza el color del overlay nativo de Windows/Linux.
  setTitleBarTheme: (theme: TitleBarTheme): void => ipcRenderer.send('window:set-title-bar-theme', theme),

  // Notificaciones del computador: el renderer pregunta, recuerda la decisión y avisa.
  getNotificationPermission: (): Promise<NotificationPermission | null> =>
    ipcRenderer.invoke('notifications:permission'),
  setNotificationPermission: (permission: NotificationPermission): Promise<NotificationPermission | null> =>
    ipcRenderer.invoke('notifications:set-permission', permission),
  notifySystem: (payload: SystemNotification): Promise<boolean> =>
    ipcRenderer.invoke('notifications:show', payload),

  // Controles propios usados únicamente como fallback.
  minimize: (): void => ipcRenderer.send('window:minimize'),
  toggleMaximize: (): void => ipcRenderer.send('window:toggle-maximize'),
  close: (): void => ipcRenderer.send('window:close'),
  isMaximized: (): Promise<boolean> => ipcRenderer.invoke('window:is-maximized'),
  onMaximizeChange: (callback: (maximized: boolean) => void): () => void => {
    const maximize = (): void => callback(true);
    const unmaximize = (): void => callback(false);
    ipcRenderer.on('window:maximized', maximize);
    ipcRenderer.on('window:unmaximized', unmaximize);
    return () => {
      ipcRenderer.removeListener('window:maximized', maximize);
      ipcRenderer.removeListener('window:unmaximized', unmaximize);
    };
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
