import { app } from 'electron';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { NotificationPermission } from '../../shared/index.js';

/** Preferencias de la app, guardadas en el directorio de datos del usuario. */
interface AppSettings {
  /** `null` mientras el usuario no ha respondido al permiso de notificaciones. */
  notifications: NotificationPermission | null;
}

const DEFAULTS: AppSettings = { notifications: null };

function settingsPath(): string {
  return join(app.getPath('userData'), 'settings.json');
}

function readPermission(value: unknown): NotificationPermission | null {
  return value === 'allowed' || value === 'denied' ? value : null;
}

/** Lee las preferencias; en el primer arranque (sin archivo) devuelve los valores por defecto. */
export function readSettings(): AppSettings {
  try {
    const raw = JSON.parse(readFileSync(settingsPath(), 'utf8')) as Record<string, unknown>;
    return { notifications: readPermission(raw.notifications) };
  } catch {
    // Sin archivo todavía o JSON corrupto: no hay nada que recordar.
    return { ...DEFAULTS };
  }
}

/** Guarda los cambios y devuelve el estado resultante. */
export function updateSettings(patch: Partial<AppSettings>): AppSettings {
  const next: AppSettings = { ...readSettings(), ...patch };
  try {
    writeFileSync(settingsPath(), JSON.stringify(next, null, 2), { encoding: 'utf8', mode: 0o600 });
  } catch (error) {
    console.error('[AIA][Settings] No se pudieron guardar las preferencias.', error);
  }
  return next;
}
