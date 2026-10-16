import type { AppElements, FileUploadState } from '../types.js';
import { writeHoursIntoExcel } from './excel-update/index.js';
import { highlightRow, getVisibleIdentifications } from './excel-preview.js';
import { colorHoursCellInPreview } from './excel-update/preview-color.js';
import { findInstructorName, selectedIdentifications } from './instructor-cards/index.js';
import { setPlayerProgress, setPlayerState, setPlayerTrack } from './player-bar/index.js';

type SubmitElements = Pick<AppElements,
  | 'playButton' | 'playerIdentification' | 'playerInstructorName' | 'playerProgressCurrent' | 'playerProgressTotal' | 'playerTrack' | 'playerProgressFill'
  | 'statusMessage' | 'dropzone' | 'dropzoneText' | 'fileInput' | 'excelPreview' | 'cardsGrid'
  | 'programFilter' | 'hoursFilter' | 'cardsSearch' | 'cardsSelectAll' | 'cardsCount' | 'cardsEmpty'
  | 'inputUser' | 'inputPass' | 'inputStartDate' | 'inputEndDate'>;

export function initSubmit(elements: SubmitElements, state: FileUploadState): void {
  const button = elements.playButton;
  // La barra del reproductor monta el botón; si aún no está, no hay nada que inicializar.
  if (!button) return;

  button.addEventListener('click', async () => {
    if (!elements.inputUser.value || !elements.inputPass.value) { alert('Ingrese las credenciales de acceso.'); return; }
    if (!state.file) {
      elements.dropzone.classList.add('dropzone-error');
      elements.statusMessage.textContent = 'Debes subir un archivo Excel de nómina (.xls o .xlsx) para continuar.';
      alert('Sube el archivo Excel de nómina antes de iniciar sesión.');
      return;
    }
    const visibleIdentifications = getVisibleIdentifications(elements);
    if (visibleIdentifications.length === 0) {
      elements.statusMessage.textContent = 'No hay cédulas visibles en la vista previa. Ajusta el filtro de búsqueda.';
      alert('No hay cédulas visibles con el filtro actual. Ajusta o limpia el filtro para continuar.');
      return;
    }

    // La automatización solo procesa lo marcado con las casillas (dentro de lo visible).
    const selected = selectedIdentifications(elements.cardsGrid);
    const targets = visibleIdentifications.filter((identification) => selected.has(identification));
    if (targets.length === 0) {
      elements.statusMessage.textContent = 'Marca con la casilla los instructores que quieres procesar.';
      alert('Selecciona al menos un instructor para iniciar la automatización.');
      return;
    }

    // El progreso se cuenta por cédula única: onProgress avisa dos veces por instructor.
    const total = targets.length;
    const processedIds = new Set<string>();
    setPlayerTrack(elements, null);
    setPlayerProgress(elements, 0, total);

    state.isUploading = true;
    button.disabled = true;
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
        state.currentIdentification = identification;
        setPlayerTrack(elements, identification, identification ? findInstructorName(identification) : null);
        highlightRow(elements, identification);
        if (identification && hours) {
          colorHoursCellInPreview(elements);
        }
        if (identification) {
          processedIds.add(identification);
          setPlayerProgress(elements, processedIds.size, total);
        }
      });
      setPlayerState(elements, 'success');
      const found = results.filter((r) => r.totalHours);
      console.log('[AIA][Excel] Resultados SofiaPlus:', results);
      elements.statusMessage.textContent = found.length > 0
        ? `Horas leídas para ${found.length} de ${results.length} instructores. Actualizando el Excel...`
        : 'Sin horas del portal. No se modificó el Excel.';
      try {
        const updated = await writeHoursIntoExcel(results, elements, state);
        console.log('[AIA][Excel] writeHoursIntoExcel devolvió:', updated);
        if (!updated && found.length > 0) {
          elements.statusMessage.textContent = 'No se encontraron cédulas coincidentes en el Excel.';
        }
      } catch (updateError) {
        console.error('[AIA][Excel] No se pudo actualizar el Excel.', updateError);
        elements.statusMessage.textContent = `No se pudo actualizar el Excel: ${updateError instanceof Error ? updateError.message : String(updateError)}`;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const userMessage = message.includes('rol necesario') ? message : 'No se pudo abrir SofiaPlus. Revisa tu conexión e inténtalo nuevamente.';
      elements.statusMessage.textContent = userMessage;
      setPlayerState(elements, 'error');
      alert(userMessage);
    } finally {
      state.isUploading = false;
      button.disabled = false;
      window.setTimeout(() => setPlayerState(elements, 'idle'), 2800);
    }
  });
}
