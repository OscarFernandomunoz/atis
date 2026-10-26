import { contextBridge, ipcRenderer } from 'electron';
import {
  getTitleBarPlatform,
  type AppLogEntry,
  type SofiaIdentificationAvailability,
  type TitleBarTheme,
} from '../shared/index.js';
import type { NotificationPermission, SystemNotification } from '../shared/index.js';

// Este API expone una interfaz segura desde el preload hacia el renderer.
// Se limita a invocar canales IPC definidos en el proceso principal sin permitir acceso directo a Node.
const electronAPI = {
  titleBarPlatform: getTitleBarPlatform(),

  // El renderer no escribe en la consola de DevTools: envía sus mensajes al
  // proceso principal, que los imprime en la terminal.
  log: (entry: AppLogEntry): void => ipcRenderer.send('app:log', entry),

  // Inicia sesión en SofiaPlus y consulta cada identificación recibida.
  openSofiaAndFill: (credentials: {
    username: string;
    password: string;
    identifications: string[];
    startDate: string;
    endDate: string;
  }): Promise<SofiaIdentificationAvailability[]> => ipcRenderer.invoke('sofia:open-and-fill', credentials),

  // Pausa o reanuda la automatización en curso; reanuda justo donde quedó.
  setAutomationPaused: (paused: boolean): void => ipcRenderer.send('sofia:set-paused', paused),
  // Detiene la corrida actual; al iniciar de nuevo se abre una sesión limpia.
  stopAutomation: (): void => ipcRenderer.send('sofia:stop'),
  onSofiaConsulting: (callback: (identification: string | null) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, identification: unknown): void => {
      if (identification === null || typeof identification === 'string') callback(identification);
    };
    ipcRenderer.on('sofia:consulting', listener);
    return () => ipcRenderer.removeListener('sofia:consulting', listener);
  },

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
