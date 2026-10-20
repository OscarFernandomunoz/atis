import { SIN_NOMBRE, type Instructor } from './parse.js';

// Índice cédula → nombre del Excel cargado. Deja que otras partes de la interfaz
// (la barra del reproductor) muestren el nombre de la persona que la automatización
// está procesando sin tener que volver a leer el archivo.
const namesByIdentification = new Map<string, string>();

export function rememberInstructors(instructors: readonly Instructor[]): void {
  namesByIdentification.clear();
  for (const { identification, name } of instructors) {
    if (!identification || name === SIN_NOMBRE) continue;
    if (!namesByIdentification.has(identification)) namesByIdentification.set(identification, name);
  }
}

export function findInstructorName(identification: string): string | null {
  return namesByIdentification.get(identification) ?? null;
}

export function forgetInstructors(): void {
  namesByIdentification.clear();
}
