import { hasUnsafeControlChars } from '../../../shared/index.js';
import type { SofiaCredentials } from './types.js';

const MAX_USERNAME_LENGTH = 200;
const MAX_PASSWORD_LENGTH = 512;
const MAX_IDENTIFICATION_LENGTH = 30;
const MAX_IDENTIFICATIONS = 500;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function readText(value: unknown, maxLength: number, trim = true): string | null {
  if (typeof value !== 'string') return null;
  const text = trim ? value.trim() : value;
  if (text.length === 0 || text.length > maxLength || text.includes('\u0000')) return null;
  return text;
}

function readIdentification(value: unknown): string | null {
  const text = readText(value, MAX_IDENTIFICATION_LENGTH);
  // Los separadores romperían el mapa "cédula|horas" que consume el script
  // de PowerShell; una cédula real no los necesita.
  if (!text || text.includes(';') || text.includes('|') || hasUnsafeControlChars(text)) return null;
  return text;
}

/**
 * Convierte el valor recibido por IPC en credenciales con forma conocida.
 *
 * Se construye un objeto nuevo con solo los campos permitidos: así un renderer
 * comprometido no puede colar propiedades extra ni valores de longitud
 * arbitraria en el script que se inyecta en el portal.
 */
export function parseSofiaCredentials(value: unknown): SofiaCredentials | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;

  const username = readText(raw.username, MAX_USERNAME_LENGTH);
  // La contraseña no se recorta: los espacios pueden ser parte de ella.
  const password = readText(raw.password, MAX_PASSWORD_LENGTH, false);
  const startDate = readText(raw.startDate, 10);
  const endDate = readText(raw.endDate, 10);
  const identification = readIdentification(raw.identification);

  if (!username || !password || !startDate || !endDate || !identification) return null;
  if (!DATE_PATTERN.test(startDate) || !DATE_PATTERN.test(endDate)) return null;

  let identifications: string[] | undefined;
  if (raw.identifications !== undefined) {
    if (!Array.isArray(raw.identifications) || raw.identifications.length > MAX_IDENTIFICATIONS) {
      return null;
    }
    const parsed: string[] = [];
    for (const item of raw.identifications) {
      const id = readIdentification(item);
      if (!id) return null;
      parsed.push(id);
    }
    identifications = parsed.length > 0 ? parsed : undefined;
  }

  return { username, password, startDate, endDate, identification, identifications };
}
