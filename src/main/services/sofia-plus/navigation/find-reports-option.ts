import type { ClickPoint } from '../types.js';

// Abre la opción de Reportes para continuar con el módulo consultado.
// (Sin helpers de módulo: la función se serializa con `.toString()` y se ejecuta dentro del portal.)
export async function findReportsOption(): Promise<ClickPoint | null> {
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
  const control = Array.from(document.querySelectorAll<HTMLElement>(
    'a[href], a[onclick], button, [role="menuitem"], [role="option"], li',
  )).find((element) => element.textContent?.trim().toLocaleLowerCase() === 'reportes'
    && element.getClientRects().length > 0);
  if (!control) return null;
  const clickable = control.matches('a, button')
    ? control
    : control.querySelector<HTMLElement>('a[href], a[onclick], button') ?? control;
  clickable.click();
  return pointFor(clickable);
}
