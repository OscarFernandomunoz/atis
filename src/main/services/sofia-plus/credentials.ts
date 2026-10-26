import type { SofiaCredentials } from './types.js';

const MAX_USERNAME_LENGTH = 200;
const MAX_PASSWORD_LENGTH = 512;

function readText(value: unknown, maxLength: number, trim = true): string | null {
  if (typeof value !== 'string') return null;
  const text = trim ? value.trim() : value;
  if (text.length === 0 || text.length > maxLength || text.includes('\u0000')) return null;
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
  if (!username || !password) return null;
  return { username, password };
}

export function parseSofiaIdentifications(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 10_000) return null;
  const identifications = new Set<string>();
  for (const entry of value) {
    if (typeof entry !== 'string') return null;
    const identification = entry.trim();
    if (!/^\d{4,32}$/.test(identification)) return null;
    identifications.add(identification);
  }
  return [...identifications];
}

export function parseSofiaStartDate(value: unknown): string | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 0));
  if (date.toISOString().slice(0, 10) !== value) return null;
  return value;
}

export const parseSofiaEndDate = parseSofiaStartDate;
