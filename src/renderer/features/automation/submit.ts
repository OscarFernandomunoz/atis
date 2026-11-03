import type { AppElements } from '../../app/types.js';
import { logger } from '../../app/logger.js';
import { notify, notifyInApp } from '../notifications/index.js';
import {
  setLocateAvailable,
  setPlayerProgress,
  setPlayerState,
  setPlayerTrack,
} from './player-bar/index.js';
import {
  identificationsForAutomation,
  rememberAvailabilityHours,
  updateCardAdditionalHours,
} from '../instructors/index.js';
import { showAvailabilityResults } from './availability-results.js';
import { getCurrentMonths, updatePreviewAvailabilityHours } from '../spreadsheet/index.js';
import { MONTH_BLOCK_LABELS } from '../spreadsheet/preview/constants.js';

type SubmitElements = Pick<AppElements,
  'playButton' | 'playerStopButton' | 'playerTrack' | 'statusMessage' | 'inputUser' | 'inputPass'
  | 'playerIdentification' | 'playerInstructorName' | 'playerProgressCurrent'
  | 'playerProgressTotal' | 'playerProgressFill' | 'playerLocateButton'
  | 'inputStartDate' | 'inputEndDate' | 'cardsGrid'
  | 'excelPreview'
  | 'availabilityResultsButton' | 'availabilityResultsModal' | 'availabilityResultsBackdrop'
  | 'availabilityResultsCloseButton' | 'availabilityResultsCount' | 'availabilityResultsList'
>;

export function initSubmit(elements: SubmitElements): void {
  // El formulario no se envía: la automatización se dispara con el botón de la
  // barra inferior. Evita que Enter recargue la interfaz y borre el estado.
  document.getElementById('accessForm')?.addEventListener('submit', (event) => {
    event.preventDefault();
  });

  const button = elements.playButton;
  if (!button) return;

  let running = false;
  let pausable = false;
  let isPaused = false;
  let stopRequested = false;
  let statusBeforePause = '';

  const applyPause = (value: boolean): void => {
    isPaused = value;
    window.electronAPI.setAutomationPaused(value);
    setPlayerState(elements, value ? 'paused' : 'loading');
    elements.playerTrack.classList.toggle('is-paused', value);
    if (value) {
      statusBeforePause = elements.statusMessage.textContent ?? '';
      elements.statusMessage.textContent = 'Automatización en pausa. Vuelve a pulsar el botón para reanudar donde quedó.';
    } else {
      elements.statusMessage.textContent = statusBeforePause || 'Reanudando la automatización...';
    }
  };

  button.addEventListener('click', async () => {
    if (running) {
      if (pausable) applyPause(!isPaused);
      return;
    }

    if (!elements.inputUser.value || !elements.inputPass.value) {
      elements.statusMessage.textContent = 'Faltan las credenciales de acceso a SofiaPlus.';
      logger.warn('SofiaPlus', 'No se inició la automatización: faltan las credenciales.');
      notifyInApp('Faltan las credenciales', 'Ingresa el usuario y la contraseña de SofiaPlus para iniciar la automatización.');
      return;
    }

    if (!elements.inputStartDate.value) {
      elements.statusMessage.textContent = 'Selecciona una fecha de inicio antes de iniciar la automatización.';
      logger.warn('SofiaPlus', 'No se inició la automatización: falta la fecha de inicio.');
      notifyInApp('Falta la fecha de inicio', 'Selecciona la fecha de inicio para consultar la disponibilidad.');
      return;
    }

    if (!elements.inputEndDate.value) {
      elements.statusMessage.textContent = 'Selecciona una fecha de fin antes de iniciar la automatización.';
      logger.warn('SofiaPlus', 'No se inició la automatización: falta la fecha de fin.');
      notifyInApp('Falta la fecha de fin', 'Selecciona la fecha de fin para consultar la disponibilidad.');
      return;
    }

    const selectedMonths = getCurrentMonths();
    if (selectedMonths?.length !== 1) {
      elements.statusMessage.textContent = 'Selecciona un solo mes para consultar y actualizar sus horas adicionales.';
      logger.warn('SofiaPlus', 'No se inició la automatización: debe seleccionarse un solo mes.');
      notifyInApp('Selecciona un solo mes', 'Elige un único mes en el carrusel antes de iniciar la consulta.');
      return;
    }

    const identifications = identificationsForAutomation(elements.cardsGrid);
    if (identifications.length === 0) {
      elements.statusMessage.textContent = 'Carga un Excel con cédulas válidas antes de iniciar la automatización.';
      logger.warn('SofiaPlus', 'No se inició la automatización: no hay cédulas válidas para consultar.');
      notifyInApp('No hay cédulas para consultar', 'Carga un Excel con cédulas válidas antes de iniciar la automatización.');
      return;
    }

    running = true;
    pausable = true;
    isPaused = false;
    setPlayerState(elements, 'loading');
    elements.statusMessage.textContent = `Abriendo SofiaPlus para consultar ${identifications.length} cédula(s)...`;

    try {
      const availabilityResults = await window.electronAPI.openSofiaAndFill({
        username: elements.inputUser.value,
        password: elements.inputPass.value,
        identifications,
        startDate: elements.inputStartDate.value,
        endDate: elements.inputEndDate.value,
      });
      if (stopRequested) return;
      pausable = false;
      const completed = availabilityResults.filter((result) => result.error === null).length;
      const failed = availabilityResults.length - completed;
      setPlayerState(elements, failed === 0 ? 'success' : 'error');
      const targetMonth = selectedMonths[0];
      if (targetMonth === undefined) throw new Error('No se pudo determinar el mes seleccionado.');
      const monthName = MONTH_BLOCK_LABELS[targetMonth]?.toLocaleLowerCase() ?? `mes ${targetMonth + 1}`;
      availabilityResults.forEach(({ identification, entries, error }) => {
        if (error) {
          logger.warn('SofiaPlus', `Falló la consulta de la cédula ${identification}: ${error}`);
          return;
        }
        const totalMinutes = entries.reduce((total, entry) => total + (entry.durationMinutes ?? 0), 0);
        const totalHours = totalMinutes / 60;
        const hasRecognizedHours = entries.length === 0
          || entries.some((entry) => entry.durationMinutes !== null);
        if (!hasRecognizedHours) return;
        const formattedHours = String(Number(totalHours.toFixed(2)));
        rememberAvailabilityHours(identification, targetMonth, formattedHours);
        const updatedRows = updatePreviewAvailabilityHours(
          elements.excelPreview,
          identification,
          totalHours,
          targetMonth,
        );
        if (updatedRows === 0) {
          logger.warn('SofiaPlus', `No se actualizaron Horas Adicionales de ${monthName} para la cédula ${identification}; verifica el Excel.`);
        } else if (entries.length === 0) {
          logger.info('SofiaPlus', `No se encontraron bloques naranjas para la cédula ${identification}; se registraron 0 Horas Adicionales de ${monthName}.`);
        } else {
          logger.info('SofiaPlus', `Se actualizaron ${updatedRows} fila(s) de Horas Adicionales de ${monthName} para la cédula ${identification}.`);
        }
      });
      updateCardAdditionalHours(elements.cardsGrid, selectedMonths);
      const blockCount = availabilityResults.reduce((total, result) => total + result.entries.length, 0);
      elements.statusMessage.textContent = `Consultadas ${completed} de ${availabilityResults.length} cédulas; `
        + `${blockCount} bloques naranjas leídos${failed > 0 ? `; ${failed} consulta(s) fallida(s), revisa el detalle.` : '.'}`;
      showAvailabilityResults(elements, availabilityResults);
      logger.info('SofiaPlus', `Consultas finalizadas: ${completed}/${availabilityResults.length} cédulas.`);
    } catch (error) {
      if (stopRequested) return;
      const message = error instanceof Error ? error.message : String(error);
      const userMessage = message.includes('rol necesario')
        || message.includes('No se encontraron bloques naranjas')
        ? message
        : 'No se pudo abrir SofiaPlus. Revisa tu conexión e inténtalo nuevamente.';
      logger.error('SofiaPlus', 'Error importante durante la automatización.', error);
      elements.statusMessage.textContent = userMessage;
      setPlayerState(elements, 'error');
      await notify('Error en la automatización', userMessage);
    } finally {
      const wasStopped = stopRequested;
      running = false;
      pausable = false;
      if (isPaused) {
        isPaused = false;
        window.electronAPI.setAutomationPaused(false);
      }
      elements.playerTrack.classList.remove('is-paused');
      if (wasStopped) {
        setPlayerState(elements, 'idle');
        setPlayerTrack(elements, null);
        setPlayerProgress(elements, 0, 0);
        setLocateAvailable(elements.playerLocateButton, false);
        elements.statusMessage.textContent = 'Automatización detenida. Pulsa reproducir para comenzar desde cero.';
        stopRequested = false;
      } else {
        window.setTimeout(() => setPlayerState(elements, 'idle'), 2800);
      }
    }
  });

  elements.playerStopButton.addEventListener('click', () => {
    if (!running || stopRequested) return;
    stopRequested = true;
    pausable = false;
    elements.playerStopButton.disabled = true;
    elements.playerStopButton.setAttribute('aria-label', 'Deteniendo automatización...');
    elements.statusMessage.textContent = 'Deteniendo SofiaPlus. Al volver a reproducir, comenzará desde cero...';
    window.electronAPI.stopAutomation();
  });
}
