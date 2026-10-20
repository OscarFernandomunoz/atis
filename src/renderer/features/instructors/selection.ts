import type { Instructor } from './parse.js';

// Casilla de selección que reemplaza el logo en la esquina de cada credencial.
const CHECK_SVG = '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">'
  + '<path d="m3.6 8.4 3 3 5.8-6.4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />'
  + '</svg>';

const CARD_CHECKBOX_SELECTOR = '.carnet-check';

// Crea la casilla para incluir o excluir una credencial de la automatización.
export function createSelectionCheckbox(instructor: Instructor): HTMLElement {
  const label = document.createElement('label');
  label.className = 'carnet-select';
  label.title = 'Incluir en la automatización';

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.className = 'carnet-check';
  input.dataset.identification = instructor.identification;
  input.setAttribute('aria-label', `Seleccionar a ${instructor.name}`);

  const box = document.createElement('span');
  box.className = 'carnet-select-box';
  box.setAttribute('aria-hidden', 'true');
  box.innerHTML = CHECK_SVG;

  label.append(input, box);
  return label;
}

// Cédulas de las credenciales marcadas. Se lee del DOM para no duplicar estado
// y así sobrevive a los repintados del tablero.
export function selectedIdentifications(grid: HTMLElement): Set<string> {
  const identifications = new Set<string>();
  grid.querySelectorAll<HTMLInputElement>(`${CARD_CHECKBOX_SELECTOR}:checked`).forEach((input) => {
    const identification = input.dataset.identification;
    if (identification) identifications.add(identification);
  });
  return identifications;
}

// Engancha la casilla "seleccionar todo" y el recuento de las credenciales visibles.
// `onChange` avisa de cada cambio de selección para que la vista previa pueda
// mostrar solo las cédulas marcadas, igual que hace con los filtros del tablero.
export function bindSelection(
  grid: HTMLElement,
  selectAll: HTMLInputElement,
  onChange?: () => void,
): void {
  grid.onchange = (event): void => {
    const target = event.target as HTMLElement | null;
    if (!target?.classList.contains('carnet-check')) return;
    refreshSelectAll(grid, selectAll);
    onChange?.();
  };
  selectAll.onchange = (): void => {
    setVisibleChecked(grid, selectAll.checked);
    refreshSelectAll(grid, selectAll);
    onChange?.();
  };
}

// Marca o desmarca solo las credenciales que pasan los filtros actuales.
function setVisibleChecked(grid: HTMLElement, checked: boolean): void {
  Array.from(grid.children).forEach((card) => {
    if (!(card instanceof HTMLElement) || card.hidden) return;
    const input = card.querySelector<HTMLInputElement>(CARD_CHECKBOX_SELECTOR);
    if (input) input.checked = checked;
  });
}

// Refleja en "seleccionar todo" si están todas, algunas o ninguna de las visibles marcadas.
export function refreshSelectAll(grid: HTMLElement, selectAll: HTMLInputElement): void {
  const boxes: HTMLInputElement[] = [];
  Array.from(grid.children).forEach((card) => {
    if (!(card instanceof HTMLElement) || card.hidden) return;
    const input = card.querySelector<HTMLInputElement>(CARD_CHECKBOX_SELECTOR);
    if (input) boxes.push(input);
  });
  const checked = boxes.filter((box) => box.checked).length;
  selectAll.checked = boxes.length > 0 && checked === boxes.length;
  selectAll.indeterminate = checked > 0 && checked < boxes.length;
}

// Deja la selección limpia al vaciar el tablero.
export function resetSelection(grid: HTMLElement, selectAll: HTMLInputElement): void {
  grid.onchange = null;
  selectAll.onchange = null;
  selectAll.checked = false;
  selectAll.indeterminate = false;
}
