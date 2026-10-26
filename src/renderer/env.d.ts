import type { AppLogEntry, SofiaIdentificationAvailability, TitleBarPlatform } from '../shared/index.js';
import type { NotificationPermission, SystemNotification } from '../shared/index.js';

// Define la forma del API expuesto desde el preload para que TypeScript reconozca window.electronAPI.
export interface IElectronAPI {
  // Envía un log del renderer al proceso principal para verlo en la terminal.
  log: (entry: AppLogEntry) => void;

  // Inicia sesión en SofiaPlus y consulta cada identificación recibida.
  openSofiaAndFill: (credentials: {
    username: string;
    password: string;
    identifications: string[];
    startDate: string;
    endDate: string;
  }) => Promise<SofiaIdentificationAvailability[]>;

  // Pausa o reanuda la automatización en curso; al reanudar continúa donde quedó.
  setAutomationPaused: (paused: boolean) => void;
  // Detiene la corrida actual; al iniciar de nuevo se abre una sesión limpia.
  stopAutomation: () => void;
  onSofiaConsulting: (callback: (identification: string | null) => void) => () => void;

  // Aplica las horas al Excel con Excel real, conservando diseño y filtros.
  // Devuelve null si Excel no está disponible (se puede usar el fallback).
  applyHoursMultipleToExcel: (payload: { data: ArrayBuffer; fileName: string; targets: Array<{ identification: string; totalHours: string }> }) => Promise<ArrayBuffer | null>;

  // Control de la ventana (TitleBar)
  titleBarPlatform: TitleBarPlatform;
  setTitleBarTheme: (theme: 'light' | 'dark') => void;
  minimize: () => void;
  toggleMaximize: () => void;
  close: () => void;
  isMaximized: () => Promise<boolean>;
  onMaximizeChange: (callback: (isMaximized: boolean) => void) => () => void;

  // Notificaciones del computador: el usuario decide una sola vez y la app lo recuerda.
  getNotificationPermission: () => Promise<NotificationPermission | null>;
  setNotificationPermission: (permission: NotificationPermission) => Promise<NotificationPermission | null>;
  notifySystem: (payload: SystemNotification) => Promise<boolean>;
}

declare global {
  interface Window {
    // Hace visible el bridge seguro del preload en el renderer.
    electronAPI: IElectronAPI;
  }
}
