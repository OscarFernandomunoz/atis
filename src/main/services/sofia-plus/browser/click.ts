import type { BrowserWindow } from 'electron';
import { showClickMarker } from './click-marker.js';
import { executeInFrames } from './frames.js';
import { withAutomationInput } from './input-guard.js';
import { patchSofiaPageGuards } from './page-guards.js';
import { ACTION_DELAY_MS, wait } from './timing.js';
import type { ClickPoint } from '../types.js';

// En `true` los pasos que dependen de un clic por coordenadas solo dibujan el puntero
// visual donde se haría clic, sin pulsarlo. Debe estar en `false` para que el flujo
// recorra el portal de principio a fin.
const DEMO_MODE = false;

// Simula un movimiento y clic del mouse en la posición detectada en la pantalla del navegador.
function clickAtPoint(window: BrowserWindow, point: ClickPoint): void {
  // El guard de entrada distingue estos clics de los del usuario: sin la marca, el bloqueo
  // los descartaría igual que cualquier otro evento de mouse.
  withAutomationInput(() => {
    window.webContents.sendInputEvent({ type: 'mouseMove', x: point.x, y: point.y });
    window.webContents.sendInputEvent({ type: 'mouseDown', x: point.x, y: point.y, button: 'left' });
    window.webContents.sendInputEvent({ type: 'mouseUp', x: point.x, y: point.y, button: 'left' });
  });
}

// Ejecuta una acción basada en un script que debe devolver una posición y luego hace clic en esa coordenada.
export async function clickScript(
  window: BrowserWindow,
  script: string,
  errorMessage: string,
  targetDescription?: string,
): Promise<void> {
  await wait(ACTION_DELAY_MS);
  await patchSofiaPageGuards(window);
  const point = await executeInFrames<ClickPoint | null>(window, script, Boolean);
  if (targetDescription) {
    console.log(`[AIA][SofiaPlus] ${targetDescription}: ${point ? 'encontrado' : 'no encontrado'}.`);
  }
  if (!point) throw new Error(errorMessage);

  const label = errorMessage.replace('No se encontró ', '');
  if (DEMO_MODE) {
    await showClickMarker(window, point, label, true);
  } else {
    // Siempre se resalta el punto donde cae el clic real, para que el usuario vea
    // en pantalla cada interacción del flujo.
    await showClickMarker(window, point, label);
    await wait(300);
    clickAtPoint(window, point);
  }
}

// Ejecuta un script que debe devolver un valor booleano para confirmar que una acción o elemento existe.
// `attempts` controla cuántas veces se reintenta (cada intento espera ~300 ms entre frames);
// los pasos que dependen de una respuesta AJAX del servidor pueden subirlo.
export async function booleanScript(
  window: BrowserWindow,
  script: string,
  errorMessage: string,
  attempts = 30,
): Promise<void> {
  await wait(ACTION_DELAY_MS);
  await patchSofiaPageGuards(window);
  const result = await executeInFrames<boolean>(window, script, Boolean, attempts);
  if (!result) throw new Error(errorMessage);
}
