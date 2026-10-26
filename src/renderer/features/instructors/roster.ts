import { isContractStartNearToday } from '../spreadsheet/helpers.js';
import { SIN_NOMBRE, type Instructor } from './parse.js';

// Índice cédula → datos del Excel cargado. Deja que otras partes de la interfaz
// (la barra del reproductor, la vista previa) muestren el nombre de la persona
// que la automatización está procesando sin volver a leer el archivo.
const rosterByIdentification = new Map<string, { name: string; contractStart: Date | null }>();

export function rememberInstructors(instructors: readonly Instructor[]): void {
  rosterByIdentification.clear();
  for (const { identification, name, contractStart } of instructors) {
    if (!identification || name === SIN_NOMBRE) continue;
    if (!rosterByIdentification.has(identification)) {
      rosterByIdentification.set(identification, { name, contractStart });
    }
  }
}

export function findInstructorName(identification: string): string | null {
  return rosterByIdentification.get(identification)?.name ?? null;
}

// Cédulas cuyo contrato arranca dentro de la ventana de "instructor nuevo":
// la lista con la que se marcan los carnets y las filas de la vista previa.
export function newInstructorIdentifications(): Set<string> {
  const nueva = new Set<string>();
  rosterByIdentification.forEach((entry, identification) => {
    if (isContractStartNearToday(entry.contractStart)) nueva.add(identification);
  });
  return nueva;
}

export function forgetInstructors(): void {
  rosterByIdentification.clear();
}
