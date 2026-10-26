import type { AppElements } from '../../app/types.js';
import type { SofiaIdentificationAvailability } from '../../../shared/index.js';

type ResultsElements = Pick<
  AppElements,
  | 'availabilityResultsButton'
  | 'availabilityResultsModal'
  | 'availabilityResultsBackdrop'
  | 'availabilityResultsCloseButton'
  | 'availabilityResultsCount'
  | 'availabilityResultsList'
>;

const CLOSE_ANIMATION_MS = 320;

function formatDuration(minutes: number): string {
  const hours = minutes / 60;
  return `${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(hours)} h`;
}

export function initAvailabilityResults(elements: ResultsElements): void {
  let opener: HTMLElement = elements.availabilityResultsButton;
  let closeTimer: number | null = null;

  const close = (): void => {
    if (elements.availabilityResultsModal.hidden || closeTimer !== null) return;
    elements.availabilityResultsModal.classList.add('is-closing');
    closeTimer = window.setTimeout(() => {
      closeTimer = null;
      elements.availabilityResultsModal.hidden = true;
      elements.availabilityResultsModal.classList.remove('is-closing');
      opener.focus();
    }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : CLOSE_ANIMATION_MS);
  };

  elements.availabilityResultsButton.addEventListener('click', () => {
    opener = elements.availabilityResultsButton;
    elements.availabilityResultsModal.hidden = false;
    elements.availabilityResultsCloseButton.focus();
  });
  elements.availabilityResultsCloseButton.addEventListener('click', close);
  elements.availabilityResultsBackdrop.addEventListener('click', close);
  document.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape') close();
  });
}

export function showAvailabilityResults(
  elements: ResultsElements,
  results: readonly SofiaIdentificationAvailability[],
): void {
  const entries = results.flatMap((result) => result.entries);
  const totalMinutes = entries.reduce((total, entry) => total + (entry.durationMinutes ?? 0), 0);
  const recognized = entries.filter((entry) => entry.durationMinutes !== null).length;
  const completed = results.filter((result) => result.error === null).length;
  elements.availabilityResultsCount.textContent = `${completed} de ${results.length} cédulas consultadas · `
    + `${entries.length} bloque(s) naranja(s) · Total: ${formatDuration(totalMinutes)} `
    + `(${recognized}/${entries.length} horarios reconocidos).`;

  const cards = results.flatMap((result) => {
    const heading = document.createElement('h3');
    heading.className = 'availability-identification-heading';
    heading.textContent = `C.C. ${result.identification}`;
    if (result.error) {
      const failure = document.createElement('p');
      failure.className = 'availability-identification-error';
      failure.textContent = `No se pudo completar esta consulta: ${result.error}`;
      return [heading, failure];
    }

    if (result.entries.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'availability-identification-empty';
      empty.textContent = 'No se encontraron bloques naranjas de disponibilidad.';
      return [heading, empty];
    }

    const blocks = result.entries.map((entry) => {
      const card = document.createElement('article');
      card.className = 'availability-result-card';
      const date = document.createElement('h4');
      date.textContent = entry.date;
      const details = document.createElement('p');
      details.textContent = entry.details;
      const duration = document.createElement('strong');
      duration.className = 'availability-result-duration';
      duration.textContent = entry.durationMinutes === null
        ? 'Duración no reconocida'
        : `Duración: ${formatDuration(entry.durationMinutes)}`;
      card.append(date, details, duration);
      return card;
    });
    return [heading, ...blocks];
  });
  elements.availabilityResultsList.replaceChildren(...cards);
  elements.availabilityResultsButton.hidden = false;
  elements.availabilityResultsModal.hidden = false;
  elements.availabilityResultsCloseButton.focus();
}
