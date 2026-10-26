// API pública de la función de hojas de cálculo: vista previa y escritura de horas.
export {
  applyMonthWindow,
  getVisibleIdentifications,
  highlightRow,
  initDropzoneSpotlight,
  initFileHandling,
} from './preview/index.js';
export { colorHoursCellInPreview, writeHoursIntoExcel } from './update/index.js';
