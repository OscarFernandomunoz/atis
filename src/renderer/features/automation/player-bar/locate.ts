import type { AppElements } from '../../../app/types.js';

// El carnet en consulta se enciende un momento al llegar desde la barra, para que
// la vista no se quede solo con el desplazamiento.
const LOCATED_CLASS = 'is-located';
const HIGHLIGHT_MS = 2600;

type LocateElements = Pick<AppElements, 'playerLocateButton' | 'cardsGrid'>;

let highlightTimer: number | null = null;
let highlighted: HTMLElement | null = null;

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// El botón solo tiene sentido mientras haya una cédula en consulta.
export function setLocateAvailable(button: HTMLButtonElement, available: boolean): void {
  button.disabled = !available;
}

export function initPlayerLocate(elements: LocateElements): void {
  const button = elements.playerLocateButton;
  const grid = elements.cardsGrid;
  if (!button || !grid) return;

  button.addEventListener('click', () => {
    const card = grid.querySelector<HTMLElement>('.carnet.is-consulting');
    if (!card) return;

    card.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'center',
    });

    // Si se salta a otra ficha antes de que termine el aviso, la anterior se apaga.
    if (highlighted && highlighted !== card) highlighted.classList.remove(LOCATED_CLASS);
    highlighted = card;

    // Reinicia la animación si se pulsa el botón dos veces sobre el mismo carnet.
    card.classList.remove(LOCATED_CLASS);
    card.getBoundingClientRect();
    card.classList.add(LOCATED_CLASS);

    if (highlightTimer !== null) window.clearTimeout(highlightTimer);
    highlightTimer = window.setTimeout(() => {
      card.classList.remove(LOCATED_CLASS);
      if (highlighted === card) highlighted = null;
      highlightTimer = null;
    }, HIGHLIGHT_MS);
  });
}
