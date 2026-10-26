/**
 * Estado visual del instructor que la automatización está consultando ahora mismo.
 *
 * La consulta en SofiaPlus tarda varios segundos por cédula. Mientras tanto el
 * carnet y la fila de la tabla se encienden y muestran el texto «Consultando…»,
 * para que no parezca que la automatización se quedó quieta.
 */

const CARD_CONSULTING_CLASS = 'is-consulting';
const ROW_CONSULTING_CLASS = 'excel-row-consulting';
const BADGE_CLASS = 'excel-consulting-badge';

export function initConsulting(grid: HTMLElement, preview: HTMLElement): void {
  window.electronAPI.onSofiaConsulting((identification) => {
    if (identification) startConsulting(grid, preview, identification);
    else stopConsulting(grid, preview);
  });
}

function createBadge(identification: string): HTMLElement {
  const badge = document.createElement('span');
  badge.className = BADGE_CLASS;
  badge.setAttribute('role', 'status');
  const dot = document.createElement('span');
  dot.className = 'excel-consulting-dot';
  dot.setAttribute('aria-hidden', 'true');
  badge.append(dot, `Consultando C.C. ${identification}`);
  return badge;
}

function matchingRows(preview: HTMLElement, identification: string): HTMLTableRowElement[] {
  return Array.from(preview.querySelectorAll<HTMLTableRowElement>('tr[data-identification]'))
    .filter((row) => row.dataset.identification === identification);
}

// Enciende el carnet y la fila de la cédula en consulta. El aviso se añade a la
// barra de filtros de la hoja que contiene la fila, que es la que está a la vista.
export function startConsulting(grid: HTMLElement, preview: HTMLElement, identification: string): void {
  stopConsulting(grid, preview);

  grid.querySelectorAll<HTMLElement>('.carnet').forEach((card) => {
    if (card.dataset.identification === identification) card.classList.add(CARD_CONSULTING_CLASS);
  });

  const sections = new Set<HTMLElement>();
  matchingRows(preview, identification).forEach((row) => {
    row.classList.add(ROW_CONSULTING_CLASS);
    const section = row.closest<HTMLElement>('section');
    if (section) sections.add(section);
  });

  // Una cédula puede repetirse en varias hojas: cada tabla avisa de su consulta.
  sections.forEach((section) => {
    section.querySelector<HTMLElement>('.excel-filter-bar')?.appendChild(createBadge(identification));
  });
}

// Apaga el estado en todos los carnets y filas, no solo en el último consultado.
export function stopConsulting(grid: HTMLElement, preview: HTMLElement): void {
  grid.querySelectorAll<HTMLElement>(`.${CARD_CONSULTING_CLASS}`)
    .forEach((card) => card.classList.remove(CARD_CONSULTING_CLASS));
  preview.querySelectorAll<HTMLElement>(`.${ROW_CONSULTING_CLASS}`)
    .forEach((row) => row.classList.remove(ROW_CONSULTING_CLASS));
  preview.querySelectorAll<HTMLElement>(`.${BADGE_CLASS}`)
    .forEach((badge) => badge.remove());
}
