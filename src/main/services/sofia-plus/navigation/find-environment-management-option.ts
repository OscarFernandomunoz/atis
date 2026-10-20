import type { ClickPoint } from '../types.js';

// Encuentra la opción de Gestión de Ambientes y la activa para continuar con el módulo consultado.
// (Sin helpers de módulo: la función se serializa con `.toString()` y se ejecuta dentro del portal.)
export async function findEnvironmentManagementOption(): Promise<ClickPoint | null> {
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
  )).find((element) => element.textContent?.trim().toLocaleLowerCase() === 'gestión de ambientes'
    && element.getClientRects().length > 0);
  if (!control) return null;
  const eventOptions = { bubbles: true, cancelable: true, view: window, button: 0, detail: 1 };
  control.dispatchEvent(new MouseEvent('mousedown', eventOptions));
  control.dispatchEvent(new MouseEvent('mouseup', eventOptions));
  control.dispatchEvent(new MouseEvent('click', eventOptions));
  control.click();
  return pointFor(control.matches('a, button') ? control : control.querySelector<HTMLElement>('a[href], a[onclick], button') ?? control);
}
