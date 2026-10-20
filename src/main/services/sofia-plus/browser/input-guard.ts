import type { BrowserWindow } from 'electron';
import type { WebContents } from 'electron';

// Profundidad de las entradas que inyecta la automatización. `sendInputEvent` reenvía el
// evento de forma síncrona, así que durante esa llamada el guard sabe que el clic no es
// del usuario y debe dejar pasar el evento hasta la página.
let automationInputDepth = 0;

export function withAutomationInput<T>(action: () => T): T {
  automationInputDepth += 1;
  try {
    return action();
  } finally {
    automationInputDepth -= 1;
  }
}

function isAutomationInput(): boolean {
  return automationInputDepth > 0;
}

const guardedContents = new WeakSet<WebContents>();

// Bloquea el mouse y el teclado del usuario en una ventana del portal. La automatización
// sigue funcionando: sus clics se envían con sendInputEvent y se marcan con
// withAutomationInput, y el resto de acciones se ejecutan por JavaScript dentro de la página.
export function blockUserInput(window: BrowserWindow): void {
  const contents = window.webContents;
  if (guardedContents.has(contents)) return;
  guardedContents.add(contents);

  contents.on('before-mouse-event', (event) => {
    if (isAutomationInput()) return;
    event.preventDefault();
  });

  contents.on('before-input-event', (event) => {
    if (isAutomationInput()) return;
    event.preventDefault();
  });
}
