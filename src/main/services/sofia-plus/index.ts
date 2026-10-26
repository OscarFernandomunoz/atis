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
import type { SofiaIdentificationAvailability } from '../../../shared/index.js';
import type { SofiaAutomationRequest } from './types.js';
import { isAutomationCancelled, resetAutomationPause, waitIfPaused } from './workflow/pause-gate.js';
import { resetSofiaSession } from './workflow/session-reset.js';
import { showStepBanner } from './workflow/step-banner.js';
import { closeSofiaPopups, loadWindow } from './workflow/window-loader.js';

// Este archivo orquesta el flujo principal de automatización de SofiaPlus.
export type { SofiaAutomationRequest, SofiaCredentials } from './types.js';

// Marca el inicio de un paso y, antes, respeta la pausa: la automatización se detiene
// en la frontera de este paso y continúa aquí mismo cuando el usuario reanuda.
async function markStep(
  window: BrowserWindow,
  stepNumber: number,
  totalSteps: number,
  stepTitle: string,
): Promise<void> {
  await waitIfPaused();
  void showStepBanner(window, stepNumber, totalSteps, stepTitle);
}

// Consulta la disponibilidad de cada instructor y conserva los resultados por cédula.
export async function openSofiaPlus(
  request: SofiaAutomationRequest,
  onIdentificationChange?: (identification: string | null) => void,
): Promise<SofiaIdentificationAvailability[]> {
  resetAutomationPause();
  // Cada corrida empieza sin cookies ni caché: el portal siempre arranca en el login.
  await resetSofiaSession();
  if (isAutomationCancelled()) throw new Error('La automatización fue detenida.');
  const window = await loadWindow();
  const totalSteps = 6 + (request.identifications.length * 7);
  let stepNumber = 0;
  const nextStep = async (stepTitle: string): Promise<void> => {
    stepNumber += 1;
    await markStep(window, stepNumber, totalSteps, stepTitle);
  };

  await nextStep('🔐 Llenando credenciales y haciendo login');
  await booleanScript(
    window,
    `(${fillSofiaInputs.toString()})(${JSON.stringify({ username: request.username, password: request.password })})`,
    'No se encontraron los campos de acceso de SofiaPlus.',
  );

  await nextStep('👤 Seleccionando menú Aspirante');
  await clickScript(window, `(${openAspiranteOptions.toString()})()`, 'No se encontró el selector Aspirante después del login.');

  await nextStep('📘 Abriendo Gestión Desarrollo Curricular');
  await booleanScript(window, `(${selectCurriculumOption.toString()})()`, 'No cuenta con el rol necesario para acceder a Gestión Desarrollo Curricular.');

  await nextStep('🏫 Abriendo Gestión de Ambientes');
  await clickScript(window, `(${findEnvironmentManagementOption.toString()})()`, 'No se encontró la opción Gestión de Ambientes.');

  await nextStep('📊 Abriendo Gestion Ambientes');
  await clickScript(window, `(${findAmbientesOption.toString()})()`, 'No se encontró la opción Gestion Ambientes.');

  await nextStep('👨‍🏫 Abriendo Instructores');
  await booleanScript(
    window,
    `(${clickInstructorsOption.toString()})()`,
    'No se encontró o no se pudo activar el enlace Instructores.',
  );

  await nextStep('🔎 Abriendo Consultar Disponibilidad de Instructor');
  await booleanScript(
    window,
    `(${clickInstructorAvailabilityOption.toString()})()`,
    'No se encontró o no se pudo activar Consultar Disponibilidad de Instructor.',
  );

  const results: SofiaIdentificationAvailability[] = [];
  for (const [index, identification] of request.identifications.entries()) {
    const progress = `cédula ${index + 1} de ${request.identifications.length}`;
    onIdentificationChange?.(identification);
    try {
      if (index > 0) {
        await nextStep(`🔎 Volviendo a Consultar Disponibilidad para ${progress}`);
        await booleanScript(
          window,
          `(${clickInstructorAvailabilityOption.toString()})()`,
          'No se pudo volver a abrir Consultar Disponibilidad de Instructor.',
        );
      }

      await nextStep(`🪪 Seleccionando Cédula de Ciudadanía · ${progress}`);
      await booleanScript(
        window,
        `(${selectCitizenshipId.toString()})()`,
        'No se encontró la opción Cédula de Ciudadanía en el formulario.',
      );

      await nextStep(`🪪 Escribiendo ${progress}`);
      await booleanScript(
        window,
        `(${fillInstructorIdentification.toString()})(${JSON.stringify(identification)})`,
        'No se encontró el campo Número de Documento para escribir la cédula.',
      );

      await nextStep(`📅 Escribiendo fechas · ${progress}`);
      await booleanScript(
        window,
        `(${fillReportDates.toString()})(${JSON.stringify({ startDate: request.startDate, endDate: request.endDate })})`,
        'No se encontraron los campos de fecha para escribir el rango seleccionado.',
      );

      await nextStep(`🔍 Consultando disponibilidad · ${progress}`);
      await booleanScript(
        window,
        `(${clickAvailabilitySubmit.toString()})()`,
        'No se encontró el botón Consultar Instructor.',
      );

      await nextStep(`📄 Abriendo detalle · ${progress}`);
      await booleanScript(
        window,
        `(${clickAvailabilityResult.toString()})()`,
        'No se encontró el detalle de disponibilidad del instructor.',
        90,
      );

      await nextStep(`🟠 Leyendo bloques · ${progress}`);
      const entries = await executeInFrames<SofiaIdentificationAvailability['entries']>(
        window,
        `(${readOrangeAvailability.toString()})()`,
        (result) => Array.isArray(result) && result.length > 0,
        90,
      );
      // Si la consulta y el detalle se abrieron pero no apareció ningún bloque naranja,
      // la disponibilidad de esta cédula es cero; no se debe detener el lote.
      results.push({ identification, entries: entries ?? [], error: null });
    } catch (error) {
      if (isAutomationCancelled()) throw new Error('La automatización fue detenida.', { cause: error });
      const message = error instanceof Error ? error.message : String(error);
      results.push({ identification, entries: [], error: message });
    } finally {
      closeSofiaPopups();
    }
  }
  onIdentificationChange?.(null);
  if (isAutomationCancelled()) throw new Error('La automatización fue detenida.');
  return results;
}
