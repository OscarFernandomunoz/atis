import type { BrowserWindow } from 'electron';
import { booleanScript, clickScript, executeInFrames } from './browser/index.js';
import { fillSofiaInputs } from './login.js';
import {
  findAmbientesOption,
  findEnvironmentManagementOption,
  clickInstructorAvailabilityOption,
  clickInstructorsOption,
  openAspiranteOptions,
  selectCurriculumOption,
} from './navigation/index.js';
import {
  clickAvailabilitySubmit,
  clickAvailabilityResult,
  fillInstructorIdentification,
  fillReportDates,
  readOrangeAvailability,
  selectCitizenshipId,
} from './report/index.js';
import type { SofiaAvailabilityEntry } from '../../../shared/index.js';
import type { SofiaAutomationRequest } from './types.js';
import { resetAutomationPause, waitIfPaused } from './workflow/pause-gate.js';
import { resetSofiaSession } from './workflow/session-reset.js';
import { showStepBanner } from './workflow/step-banner.js';
import { loadWindow } from './workflow/window-loader.js';

// Este archivo orquesta el flujo principal de automatización de SofiaPlus.
export type { SofiaAutomationRequest, SofiaCredentials } from './types.js';

// Marca el inicio de un paso y, antes, respeta la pausa: la automatización se detiene
// en la frontera de este paso y continúa aquí mismo cuando el usuario reanuda.
async function markStep(window: BrowserWindow, stepNumber: number, stepTitle: string): Promise<void> {
  await waitIfPaused();
  void showStepBanner(window, stepNumber, stepTitle);
}

// Consulta la disponibilidad del instructor y devuelve los bloques horarios resaltados.
export async function openSofiaPlus(request: SofiaAutomationRequest): Promise<SofiaAvailabilityEntry[]> {
  resetAutomationPause();
  // Cada corrida empieza sin cookies ni caché: el portal siempre arranca en el login.
  await resetSofiaSession();
  const window = await loadWindow();
  await markStep(window, 1, '🔐 Llenando credenciales y haciendo login');
  await booleanScript(
    window,
    `(${fillSofiaInputs.toString()})(${JSON.stringify({ username: request.username, password: request.password })})`,
    'No se encontraron los campos de acceso de SofiaPlus.',
  );

  await markStep(window, 2, '👤 Seleccionando menú Aspirante');
  await clickScript(window, `(${openAspiranteOptions.toString()})()`, 'No se encontró el selector Aspirante después del login.');

  await markStep(window, 3, '📘 Abriendo Gestión Desarrollo Curricular');
  await booleanScript(window, `(${selectCurriculumOption.toString()})()`, 'No cuenta con el rol necesario para acceder a Gestión Desarrollo Curricular.');

  await markStep(window, 4, '🏫 Abriendo Gestión de Ambientes');
  await clickScript(window, `(${findEnvironmentManagementOption.toString()})()`, 'No se encontró la opción Gestión de Ambientes.');

  await markStep(window, 5, '📊 Abriendo Gestion Ambientes');
  await clickScript(window, `(${findAmbientesOption.toString()})()`, 'No se encontró la opción Gestion Ambientes.');

  await markStep(window, 6, '👨‍🏫 Abriendo Instructores');
  await booleanScript(
    window,
    `(${clickInstructorsOption.toString()})()`,
    'No se encontró o no se pudo activar el enlace Instructores.',
  );

  await markStep(window, 7, '🔎 Abriendo Consultar Disponibilidad de Instructor');
  await booleanScript(
    window,
    `(${clickInstructorAvailabilityOption.toString()})()`,
    'No se encontró o no se pudo activar Consultar Disponibilidad de Instructor.',
  );

  await markStep(window, 8, '🪪 Seleccionando Cédula de Ciudadanía');
  await booleanScript(
    window,
    `(${selectCitizenshipId.toString()})()`,
    'No se encontró la opción Cédula de Ciudadanía en el formulario.',
  );

  const identification = request.identifications[0];
  if (!identification) throw new Error('No hay cédulas para consultar.');
  await markStep(window, 9, `🪪 Escribiendo cédula 1 de ${request.identifications.length}`);
  await booleanScript(
    window,
    `(${fillInstructorIdentification.toString()})(${JSON.stringify(identification)})`,
    'No se encontró el campo Número de Documento para escribir la cédula.',
  );

  await markStep(window, 10, '📅 Escribiendo fecha de inicio');
  await booleanScript(
    window,
    `(${fillReportDates.toString()})(${JSON.stringify({ startDate: request.startDate, endDate: request.endDate })})`,
    'No se encontraron los campos de fecha para escribir el rango seleccionado.',
  );

  await markStep(window, 11, '🔍 Consultando disponibilidad del instructor');
  await booleanScript(
    window,
    `(${clickAvailabilitySubmit.toString()})()`,
    'No se encontró el botón Consultar Instructor.',
  );

  await markStep(window, 12, '📄 Abriendo detalle de disponibilidad');
  await booleanScript(
    window,
    `(${clickAvailabilityResult.toString()})()`,
    'No se encontró el detalle de disponibilidad del instructor.',
    90,
  );
  await markStep(window, 13, '🟠 Leyendo bloques de disponibilidad');
  const entries = await executeInFrames<SofiaAvailabilityEntry[]>(
    window,
    `(${readOrangeAvailability.toString()})()`,
    (result) => Array.isArray(result) && result.length > 0,
    90,
  );
  if (!entries?.length) throw new Error('No se encontraron bloques naranjas en la tabla de disponibilidad.');
  return entries;
}
