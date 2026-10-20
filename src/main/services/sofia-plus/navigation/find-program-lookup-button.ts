import type { ClickPoint } from '../types.js';

// Abre la ventana de selección de programa de formación (lupa del campo Programa de Formación).
// (Sin helpers de módulo: la función se serializa con `.toString()` y se ejecuta dentro del portal.)
export async function findProgramLookupButton(): Promise<ClickPoint | null> {
  const pointFor = (element: HTMLElement): ClickPoint => {
    const rect = element.getBoundingClientRect();
    let x = rect.left + (rect.width / 2);
    let y = rect.top + (rect.height / 2);
    let currentWindow: Window = window;
    while (currentWindow.frameElement) {
      const frameElement = currentWindow.frameElement;
      if (!frameElement) break;
      const frameRect = frameElement.getBoundingClientRect();
      x += frameRect.left + frameElement.clientLeft;
      y += frameRect.top + frameElement.clientTop;
      currentWindow = currentWindow.parent;
    }
    return { x, y };
  };
  const normalize = (value: string): string => value.trim().toLocaleLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const byNormalizedId = Array.from(document.querySelectorAll<HTMLElement>('[id], [name]'))
    .find((element) => normalize(element.id).includes('programaformacionolk')
      || normalize(element.getAttribute('name') ?? '').includes('programaformacionolk')) ?? null;
  const picker = document.querySelector<HTMLElement>('[id$=":programaFormacionOLK"], [id$="programaFormacionOLK"]')
    ?? byNormalizedId;
  if (!(picker instanceof HTMLElement)) return null;
  const clickable = picker.closest('a') ?? picker;
  clickable.click();
  return pointFor(clickable);
}
