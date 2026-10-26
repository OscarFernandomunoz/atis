// API pública de la función de hojas de cálculo: vista previa y escritura de horas.
export {
  applyMonthWindow,
  getCurrentMonths,
  getVisibleIdentifications,
  highlightRow,
  initDropzoneSpotlight,
  initFileHandling,
  updatePreviewAvailabilityHours,
} from './preview/index.js';
export { colorHoursCellInPreview, writeHoursIntoExcel } from './update/index.js';
