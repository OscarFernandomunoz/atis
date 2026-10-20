import type { ClickPoint } from '../types.js';

// Este módulo localiza los menús y selecciones de SofiaPlus para avanzar por el flujo de navegación guiado.
// (Sin helpers de módulo: la función se serializa con `.toString()` y se ejecuta dentro del portal.)

// Busca la opción de Aspirante dentro de los selectores o controles visibles del portal.
export async function openAspiranteOptions(): Promise<ClickPoint | null> {
  const findVisibleText = (selector: string, text: string): HTMLElement | null => {
    const target = text.trim().toLocaleLowerCase();
    return Array.from(document.querySelectorAll<HTMLElement>(selector)).find((element) => {
      const value = element.textContent?.trim().toLocaleLowerCase();
      return value === target && element.getClientRects().length > 0;
    }) ?? null;
  };
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
  const selects = Array.from(document.querySelectorAll<HTMLSelectElement>('select'))
    .filter((element) => element.getClientRects().length > 0);
  const aspiranteSelect = selects.find((select) => Array.from(select.options).some((option) => (
    option.textContent?.trim().toLowerCase() === 'aspirante'
  )));
  if (aspiranteSelect) return pointFor(aspiranteSelect);

  const control = findVisibleText('button, [role="button"], [role="combobox"]', 'aspirante');
  return control ? pointFor(control) : null;
}
