import type { AppElements } from '../../app/types.js';
import { logger } from '../../app/logger.js';
import { notify } from '../notifications/index.js';
import { setPlayerState } from './player-bar/index.js';
import {
  identificationsForAutomation,
  rememberAvailabilityHours,
  updateCardAdditionalHours,
} from '../instructors/index.js';
import { showAvailabilityResults } from './availability-results.js';
import { getCurrentMonths, updatePreviewAvailabilityHours } from '../spreadsheet/index.js';
import { MONTH_BLOCK_LABELS } from '../spreadsheet/preview/constants.js';

type SubmitElements = Pick<AppElements,
  'playButton' | 'playerTrack' | 'statusMessage' | 'inputUser' | 'inputPass'
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
      await notify('Faltan las credenciales', 'Ingresa el usuario y la contraseña de SofiaPlus para iniciar la automatización.');
      return;
    }

    if (!elements.inputStartDate.value) {
      elements.statusMessage.textContent = 'Selecciona una fecha de inicio antes de iniciar la automatización.';
      await notify('Falta la fecha de inicio', 'Selecciona la fecha de inicio para consultar la disponibilidad del instructor.');
      return;
    }

    if (!elements.inputEndDate.value) {
      elements.statusMessage.textContent = 'Selecciona una fecha de fin antes de iniciar la automatización.';
      await notify('Falta la fecha de fin', 'Selecciona la fecha de fin para consultar la disponibilidad del instructor.');
      return;
    }

    const selectedMonths = getCurrentMonths();
    if (selectedMonths?.length !== 1) {
      elements.statusMessage.textContent = 'Selecciona un solo mes para consultar y actualizar sus horas adicionales.';
      await notify(
        'Selecciona un solo mes',
        'La consulta devuelve un total para todo el rango. Elige un único mes en el carrusel para actualizar la columna de ese mes.',
      );
      return;
    }

    const identifications = identificationsForAutomation(elements.cardsGrid);
    if (identifications.length === 0) {
      elements.statusMessage.textContent = 'Carga un Excel con cédulas válidas antes de iniciar la automatización.';
      await notify('No hay cédulas para consultar', 'Carga un Excel con cédulas válidas antes de iniciar la automatización.');
      return;
    }

    running = true;
    pausable = true;
    isPaused = false;
    setPlayerState(elements, 'loading');
    elements.statusMessage.textContent = 'Abriendo SofiaPlus y navegando hasta Gestión de Ambientes...';

    try {
      const availabilityEntries = await window.electronAPI.openSofiaAndFill({
        username: elements.inputUser.value,
        password: elements.inputPass.value,
        identifications,
        startDate: elements.inputStartDate.value,
        endDate: elements.inputEndDate.value,
      });
      pausable = false;
      setPlayerState(elements, 'success');
      const identification = identifications[0];
      const totalMinutes = availabilityEntries.reduce(
        (total, entry) => total + (entry.durationMinutes ?? 0),
        0,
      );
      const totalHours = totalMinutes / 60;
      const recognizedHours = availabilityEntries.some((entry) => entry.durationMinutes !== null);
      if (identification && recognizedHours) {
        const formattedHours = String(Number(totalHours.toFixed(2)));
        const targetMonth = selectedMonths[0];
        if (targetMonth === undefined) throw new Error('No se pudo determinar el mes seleccionado.');
        rememberAvailabilityHours(identification, targetMonth, formattedHours);
        updateCardAdditionalHours(elements.cardsGrid, selectedMonths);
        const updatedRows = updatePreviewAvailabilityHours(
          elements.excelPreview,
          identification,
          totalHours,
          targetMonth,
        );
        const monthName = MONTH_BLOCK_LABELS[targetMonth]?.toLocaleLowerCase() ?? `mes ${targetMonth + 1}`;
        if (updatedRows === 0) {
          logger.warn('SofiaPlus', `No se actualizó Horas Adicionales de ${monthName}; verifica la cédula y el encabezado mensual.`);
        } else {
          logger.info('SofiaPlus', `Se actualizaron ${updatedRows} fila(s) de Horas Adicionales de ${monthName}.`);
        }
      }
      elements.statusMessage.textContent = `Se leyeron ${availabilityEntries.length} bloques naranjas de disponibilidad.`;
      showAvailabilityResults(elements, availabilityEntries);
      logger.info('SofiaPlus', 'Navegación completada hasta Gestión de Ambientes.');
      await notify(
        'Consulta de disponibilidad completada',
        `Se encontraron ${availabilityEntries.length} bloques naranjas. Consulta el detalle en la ventana principal.`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const userMessage = message.includes('rol necesario')
        || message.includes('No se encontraron bloques naranjas')
        ? message
        : 'No se pudo abrir SofiaPlus. Revisa tu conexión e inténtalo nuevamente.';
      elements.statusMessage.textContent = userMessage;
      setPlayerState(elements, 'error');
      await notify('Error en la automatización', userMessage);
    } finally {
      running = false;
      pausable = false;
      if (isPaused) {
        isPaused = false;
        window.electronAPI.setAutomationPaused(false);
      }
      elements.playerTrack.classList.remove('is-paused');
      window.setTimeout(() => setPlayerState(elements, 'idle'), 2800);
    }
  });
}
