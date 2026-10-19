import type { BrowserWindow } from 'electron';
import { booleanScript, clickScript, executeInFrames, wait } from './browser/index.js';
import { fillSofiaInputs } from './login.js';
import {
  findAmbientesOption,
  findEnvironmentManagementOption,
  findInstructorActivityTimeOption,
  findProgramLookupButton,
  findReportsOption,
  openAspiranteOptions,
  selectCurriculumOption,
} from './navigation.js';
import { clickInstructorResultLink, clickInstructorSearchInput, fillInstructorIdentification, fillReportDates, markIdentificationTypeSelect, readTotalHours, selectCitizenshipId, selectLearningResultsOption, submitInstructorTimesReport } from './report/index.js';
import type { InstructorHours, SofiaCredentials } from './types.js';
import { resetAutomationPause, waitIfPaused } from './flow/pause-gate.js';
import { resetSofiaSession } from './flow/session-reset.js';
import { showStepBanner } from './flow/step-banner.js';
import { loadWindow } from './flow/window-loader.js';

// Este archivo orquesta el flujo principal de automatización de SofiaPlus.
export type { InstructorHours, SofiaCredentials } from './types.js';

// Marca el inicio de un paso y, antes, respeta la pausa: la automatización se detiene
// en la frontera de este paso y continúa aquí mismo cuando el usuario reanuda.
async function markStep(window: BrowserWindow, stepNumber: number, stepTitle: string): Promise<void> {
  await waitIfPaused();
  void showStepBanner(window, stepNumber, stepTitle);
}

// Ejecuta el flujo completo: login, navegación, selección de fechas y preparación del reporte.
export async function openSofiaPlus(
  credentials: SofiaCredentials,
  onProgress?: (identification: string | null, hours: string | null) => void,
): Promise<InstructorHours[]> {
  resetAutomationPause();
  // Cada corrida empieza sin cookies ni caché: el portal siempre arranca en el login.
  await resetSofiaSession();
  const window = await loadWindow();
  await markStep(window, 1, '🔐 Llenando credenciales y haciendo login');
  await booleanScript(window, `(${fillSofiaInputs.toString()})(${JSON.stringify(credentials)})`, 'No se encontraron los campos de acceso de SofiaPlus.');

  await markStep(window, 2, '👤 Seleccionando menú Aspirante');
  await clickScript(window, `(${openAspiranteOptions.toString()})()`, 'No se encontró el selector Aspirante después del login.');

  await markStep(window, 3, '📘 Abriendo Gestión Desarrollo Curricular');
  await booleanScript(window, `(${selectCurriculumOption.toString()})()`, 'No cuenta con el rol necesario para acceder a Gestión Desarrollo Curricular.');

  await markStep(window, 4, '🏫 Abriendo Gestión de Ambientes');
  await clickScript(window, `(${findEnvironmentManagementOption.toString()})()`, 'No se encontró la opción Gestión de Ambientes.');

  await markStep(window, 5, '📊 Abriendo Gestion Ambientes');
  await clickScript(window, `(${findAmbientesOption.toString()})()`, 'No se encontró la opción Gestion Ambientes.');

  await markStep(window, 6, '📈 Abriendo Reportes');
  await clickScript(window, `(${findReportsOption.toString()})()`, 'No se encontró la opción Reportes.');

  await markStep(window, 7, '👨‍🏫 Abriendo Consulta de Tiempos de Instructor por Actividad de Formación');
  await clickScript(window, `(${findInstructorActivityTimeOption.toString()})()`, 'No se encontró la opción Consulta de Tiempos de Instructor por Actividad de Formación.');

  await markStep(window, 8, '📅 Rellenando fechas del reporte');
  await booleanScript(window, `(${fillReportDates.toString()})(${JSON.stringify({ startDate: credentials.startDate, endDate: credentials.endDate })})`, 'No se encontraron los campos de fechas del informe.');

  await markStep(window, 9, '📥 Selección Actividad de Formación → RESULTADOS DE APRENDIZAJE');
  await booleanScript(window, `(${selectLearningResultsOption.toString()})()`, 'No se encontró la opción RESULTADOS DE APRENDIZAJE de Actividad de Formación.');

  await markStep(window, 10, '📚 Abriendo selector de programa de formación');
  await clickScript(window, `(${findProgramLookupButton.toString()})()`, 'No se encontró el botón de selección de programa de formación.');

  await markStep(window, 11, '🆔 Seleccionando Tipo de Identificación → Cédula de ciudadanía');
  await booleanScript(window, `(${markIdentificationTypeSelect.toString()})()`, 'No se encontró el campo Tipo de Identificación.');
  await wait(400);
  await booleanScript(window, `(${selectCitizenshipId.toString()})()`, 'No se encontró la opción Cédula de ciudadanía.');

  const targets = credentials.identifications && credentials.identifications.length > 0
    ? credentials.identifications
    : [credentials.identification];
  const results: InstructorHours[] = [];
  for (const [index, identification] of targets.entries()) {
    try {
    if (index > 0) {
      // Tras consultar un instructor, el portal reemplaza el formulario por el
      // resultado. Hay que volver a abrir la pantalla del reporte para que el
      // campo de identificación vuelva a existir antes de la siguiente consulta.
      await markStep(window, 7, '📈 Reabriendo Consulta de Tiempos de Instructor');
      await clickScript(window, `(${findInstructorActivityTimeOption.toString()})()`, 'No se encontró la opción Consulta de Tiempos de Instructor por Actividad de Formación.');
      await markStep(window, 8, '📅 Rellenando fechas del reporte');
      await booleanScript(window, `(${fillReportDates.toString()})(${JSON.stringify({ startDate: credentials.startDate, endDate: credentials.endDate })})`, 'No se encontraron los campos de fechas del informe.');
      await booleanScript(window, `(${selectLearningResultsOption.toString()})()`, 'No se encontró la opción RESULTADOS DE APRENDIZAJE de Actividad de Formación.');
      await clickScript(window, `(${findProgramLookupButton.toString()})()`, 'No se encontró el botón de selección de programa de formación.');
      await booleanScript(window, `(${markIdentificationTypeSelect.toString()})()`, 'No se encontró el campo Tipo de Identificación.');
      await wait(400);
      await booleanScript(window, `(${selectCitizenshipId.toString()})()`, 'No se encontró la opción Cédula de ciudadanía.');
      await wait(600);
      await markStep(window, 12, `🪪 Consultando instructor ${index + 1} de ${targets.length}`);
    } else {
      await markStep(window, 12, '🪪 Escribiendo la identificación del instructor');
    }
    await booleanScript(window, `(${fillInstructorIdentification.toString()})(${JSON.stringify(identification)})`, 'No se encontró el campo de identificación del instructor.');
    onProgress?.(identification, null);

    await markStep(window, 13, '🔍 Pulsando Consultar');
    await booleanScript(window, `(${clickInstructorSearchInput.toString()})()`, 'No se encontró o no se pudo pulsar el botón Consultar.');

    await markStep(window, 14, '👨‍🏫 Seleccionando el instructor del resultado');
    await booleanScript(window, `(${clickInstructorResultLink.toString()})()`, 'No se encontró el enlace del instructor en los resultados.');

    await markStep(window, 15, '✅ Consultar del reporte');
    await booleanScript(window, `(${submitInstructorTimesReport.toString()})()`, 'No se encontró el botón Consultar del reporte de tiempos.');

    await markStep(window, 16, '🧮 Leyendo horas adicionales del resultado');
    console.log(`[AIA][SofiaPlus] Paso 16: buscando el span de horas adicionales (${identification})...`);
    const totalHours = await executeInFrames<string | null>(
      window,
      `(${readTotalHours.toString()})()`,
      (value): value is string => typeof value === 'string' && value.length > 0,
      40,
    ) ?? null;
    if (totalHours) {
      console.log(`[AIA][SofiaPlus] Horas adicionales leídas del span (${identification}): ${totalHours}`);
    } else {
      console.warn(`[AIA][SofiaPlus] No se encontró el span de horas adicionales para ${identification}.`);
    }
    onProgress?.(identification, totalHours);
    results.push({ identification, totalHours });
    } catch (error) {
      console.error(`[AIA][SofiaPlus] Falló la consulta de ${identification}; se detiene el bucle.`, error);
      results.push({ identification, totalHours: null });
      break;
    }
  }
  return results;
}
