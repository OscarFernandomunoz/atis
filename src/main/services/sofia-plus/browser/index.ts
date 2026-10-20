// API pública de la capa de navegador de SofiaPlus:
// ventanas, parches de página, frames y acciones de clic.
export { patchBlockUiScript } from './block-ui-patch.js';
export { booleanScript, clickScript } from './click.js';
export { markClickPoint } from './click-marker.js';
export { executeInAllFrames, executeInEveryFrame, executeInFrames, getTrackedChildWindows, trackChildWindow } from './frames.js';
export { patchWaitSaveScript } from './wait-save-patch.js';
export { clearPageMarkers, clearPageMarkersScript } from './markers.js';
export { patchOpenerShimScript } from './opener-shim-patch.js';
export { patchSofiaPageGuards } from './page-guards.js';
export { ACTION_DELAY_MS, wait } from './timing.js';
export { trackSofiaWindow } from './window-tracker.js';
