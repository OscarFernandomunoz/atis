// API pública de la vista previa del archivo de nómina.
export { initFileHandling, refreshExcelPreview } from './controller.js';
export { getVisibleIdentifications, highlightRow } from './view.js';
export { initDropzoneSpotlight } from './spotlight.js';
export type { FileElements } from './card-board.js';
export { applyMonthWindow, getCurrentMonths, updatePreviewAvailabilityHours } from './months.js';
