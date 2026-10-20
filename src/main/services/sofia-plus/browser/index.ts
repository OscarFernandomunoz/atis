// API pública de la capa de navegador de SofiaPlus:
// ventanas, parches de página, frames y acciones de clic.
export { booleanScript, clickScript } from './click.js';
export { markClickPoint } from './click-marker/index.js';
export { executeInFrames, getTrackedChildWindows } from './frames.js';
export { patchSofiaPageGuards } from './page-guards.js';
export { wait } from './timing.js';
export { trackSofiaWindow } from './window-tracker.js';
