// Puerta de pausa compartida por el flujo de SofiaPlus. La automatización consulta
// `waitIfPaused` en cada frontera de paso: si está en pausa se queda esperando ahí
// mismo y reanuda exactamente en ese punto cuando el renderer la despausa.
let paused = false;
// Una sola promesa compartida: da igual cuántos pasos esperen, todos despiertan juntos.
let resumePromise: Promise<void> | null = null;
let resumeResolve: (() => void) | null = null;

function release(): void {
  resumeResolve?.();
  resumePromise = null;
  resumeResolve = null;
}

export function setAutomationPaused(value: boolean): void {
  paused = value;
  if (!paused) release();
}

// Deja la puerta abierta antes de arrancar un flujo nuevo.
export function resetAutomationPause(): void {
  paused = false;
  release();
}

export function waitIfPaused(): Promise<void> {
  if (!paused) return Promise.resolve();
  resumePromise ??= new Promise((resolve) => {
    resumeResolve = resolve;
  });
  return resumePromise;
}
