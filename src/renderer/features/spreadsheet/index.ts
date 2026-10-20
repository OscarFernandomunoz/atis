// API pública de la función de hojas de cálculo: vista previa y escritura de horas.
export {
  findRequiredColumnIndex,
  getVisibleIdentifications,
  highlightRow,
  initDropzoneSpotlight,
  initFileHandling,
  refreshExcelPreview,
  type FileElements,
} from './preview/index.js';
export { colorHoursCellInPreview, writeHoursIntoExcel } from './update/index.js';
