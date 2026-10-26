import type { AppElements } from '../../app/types.js';
import type { SofiaAvailabilityEntry } from '../../../shared/index.js';

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
  entries: readonly SofiaAvailabilityEntry[],
): void {
  const totalMinutes = entries.reduce((total, entry) => total + (entry.durationMinutes ?? 0), 0);
  const recognized = entries.filter((entry) => entry.durationMinutes !== null).length;
  elements.availabilityResultsCount.textContent = `${entries.length} bloque(s) naranja(s) · `
    + `Total: ${formatDuration(totalMinutes)} (${recognized}/${entries.length} horarios reconocidos).`;

  const cards = entries.map((entry) => {
    const card = document.createElement('article');
    card.className = 'availability-result-card';
    const date = document.createElement('h3');
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
  elements.availabilityResultsList.replaceChildren(...cards);
  elements.availabilityResultsButton.hidden = false;
  elements.availabilityResultsModal.hidden = false;
  elements.availabilityResultsCloseButton.focus();
}
