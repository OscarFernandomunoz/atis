import type { AppElements, FileUploadState } from '../../app/types.js';
import { logger } from '../../app/logger.js';
import { colorHoursCellInPreview, getVisibleIdentifications, highlightRow, writeHoursIntoExcel } from '../spreadsheet/index.js';
import { findInstructorName, rememberLiveHours, selectedIdentifications, updateCardHours } from '../instructors/index.js';
import { notify } from '../notifications/index.js';
import { startConsulting, stopConsulting } from './consulting.js';
import { setLocateAvailable, setPlayerProgress, setPlayerState, setPlayerTrack } from './player-bar/index.js';

type SubmitElements = Pick<AppElements,
  | 'playButton' | 'playerLocateButton' | 'playerIdentification' | 'playerInstructorName' | 'playerProgressCurrent' | 'playerProgressTotal' | 'playerTrack' | 'playerProgressFill'
  | 'statusMessage' | 'dropzone' | 'dropzoneText' | 'fileInput' | 'excelPreview' | 'cardsGrid'
  | 'programFilter' | 'hoursFilter' | 'cardsSearch' | 'cardsSelectAll' | 'cardsCount' | 'cardsEmpty'
  | 'inputUser' | 'inputPass' | 'inputStartDate' | 'inputEndDate'>;

export function initSubmit(elements: SubmitElements, state: FileUploadState): void {
  // El formulario no se envía: la automatización se dispara con el botón de la
  // barra inferior. Evita que Enter recargue la interfaz y borre el estado.
  document.getElementById('accessForm')?.addEventListener('submit', (event) => {
    event.preventDefault();
  });

  const button = elements.playButton;
  // La barra del reproductor monta el botón; si aún no está, no hay nada que inicializar.
  if (!button) return;

  // Mientras la automatización corre el botón no se deshabilita: pasa a pausar y reanudar.
  let running = false;
  // Solo el flujo de SofiaPlus es pausable; el volcado posterior al Excel no.
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
    // Con la automatización en marcha el botón pausa o reanuda en lugar de reiniciar.
    if (running) {
      if (pausable) applyPause(!isPaused);
      return;
    }

    if (!elements.inputUser.value || !elements.inputPass.value) {
      elements.statusMessage.textContent = 'Faltan las credenciales de acceso a SofiaPlus.';
      await notify('Faltan las credenciales', 'Ingresa el usuario y la contraseña de SofiaPlus para iniciar la automatización.');
      return;
    }
    if (!state.file) {
      elements.dropzone.classList.add('dropzone-error');
      elements.statusMessage.textContent = 'Debes subir un archivo Excel de nómina (.xls o .xlsx) para continuar.';
      await notify('Falta el archivo de nómina', 'Sube el archivo Excel antes de iniciar sesión.');
      return;
    }
    const visibleIdentifications = getVisibleIdentifications(elements);
    if (visibleIdentifications.length === 0) {
      elements.statusMessage.textContent = 'No hay cédulas visibles en la vista previa. Ajusta el filtro de búsqueda.';
      await notify('Sin cédulas visibles', 'No hay cédulas visibles con el filtro actual. Ajusta o limpia el filtro para continuar.');
      return;
    }

    // La automatización solo procesa lo marcado con las casillas (dentro de lo visible).
    const selected = selectedIdentifications(elements.cardsGrid);
    const targets = visibleIdentifications.filter((identification) => selected.has(identification));
    if (targets.length === 0) {
      elements.statusMessage.textContent = 'Marca con la casilla los instructores que quieres procesar.';
      await notify('Sin instructores seleccionados', 'Selecciona al menos un instructor para iniciar la automatización.');
      return;
    }

    // El progreso se cuenta por cédula única: onProgress avisa dos veces por instructor.
    const total = targets.length;
    const processedIds = new Set<string>();
    setPlayerTrack(elements, null);
    setPlayerProgress(elements, 0, total);

    running = true;
    pausable = true;
    isPaused = false;
    setPlayerState(elements, 'loading');
    elements.statusMessage.textContent = 'Abriendo SofiaPlus, llenando los campos e iniciando sesión...';
    try {
      const results = await window.electronAPI.openSofiaAndFill({
        username: elements.inputUser.value,
        password: elements.inputPass.value,
        startDate: elements.inputStartDate.value,
        endDate: elements.inputEndDate.value,
        identification: targets[0] ?? '',
        identifications: targets,
      }, (identification, hours) => {
        setPlayerTrack(elements, identification, identification ? findInstructorName(identification) : null);
        highlightRow(elements, identification);
        if (identification) {
          // onProgress avisa dos veces por cédula: al empezar la consulta (sin horas)
          // y al terminar (con las horas, o con null si el portal no las devolvió).
          if (processedIds.has(identification)) {
            stopConsulting(elements.cardsGrid, elements.excelPreview);
            setLocateAvailable(elements.playerLocateButton, false);
          } else {
            startConsulting(elements.cardsGrid, elements.excelPreview, identification);
            setLocateAvailable(elements.playerLocateButton, true);
            processedIds.add(identification);
            setPlayerProgress(elements, processedIds.size, total);
          }
        }
        if (identification && hours) {
          // El carnet pasa a mostrar las horas que reporta SofiaPlus (el span del reporte).
          rememberLiveHours(identification, hours);
          updateCardHours(elements.cardsGrid, identification, hours);
          colorHoursCellInPreview(elements);
        }
      });
      // Terminó el flujo de SofiaPlus: se cierra la pausa mientras se vuelca al Excel.
      pausable = false;
      button.disabled = true;
      setPlayerState(elements, 'success');
      const found = results.filter((r) => r.totalHours);
      logger.info('Excel', 'Resultados SofiaPlus.', results);
      elements.statusMessage.textContent = found.length > 0
        ? `Horas leídas para ${found.length} de ${results.length} instructores. Actualizando el Excel...`
        : 'Sin horas del portal. No se modificó el Excel.';
      try {
        const updated = await writeHoursIntoExcel(results, elements, state);
        logger.info('Excel', `writeHoursIntoExcel devolvió: ${String(updated)}`);
        if (!updated && found.length > 0) {
          elements.statusMessage.textContent = 'No se encontraron cédulas coincidentes en el Excel.';
        }
      } catch (updateError) {
        logger.error('Excel', 'No se pudo actualizar el Excel.', updateError);
        const updateMessage = `No se pudo actualizar el Excel: ${updateError instanceof Error ? updateError.message : String(updateError)}`;
        elements.statusMessage.textContent = updateMessage;
        await notify('No se pudo actualizar el Excel', updateMessage);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const userMessage = message.includes('rol necesario') ? message : 'No se pudo abrir SofiaPlus. Revisa tu conexión e inténtalo nuevamente.';
      elements.statusMessage.textContent = userMessage;
      setPlayerState(elements, 'error');
      await notify('Error en la automatización', userMessage);
    } finally {
      // Al terminar (o fallar) ningún instructor queda marcado como en consulta.
      stopConsulting(elements.cardsGrid, elements.excelPreview);
      setLocateAvailable(elements.playerLocateButton, false);
      running = false;
      pausable = false;
      button.disabled = false;
      // Si algo termina con la automatización en pausa, se libera la puerta del proceso principal.
      if (isPaused) {
        isPaused = false;
        window.electronAPI.setAutomationPaused(false);
      }
      elements.playerTrack.classList.remove('is-paused');
      window.setTimeout(() => setPlayerState(elements, 'idle'), 2800);
    }
  });
}
