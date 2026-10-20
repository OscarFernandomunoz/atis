import type { FileUploadState } from '../../../app/types.js';
import { logger } from '../../../app/logger.js';
import { refreshExcelPreview, type FileElements } from '../preview/index.js';
import { editOriginalWorkbookMultiple, highlightAllHoursCells } from './exceljs-edit.js';
import { rebuildFromRowsMultiple } from './xls-rebuild.js';
import { HOURS_THRESHOLD } from '../helpers.js';
import { colorHoursCellInPreview } from './preview-color.js';
import { showDownloadButton } from './download-button.js';

interface InstructorResult {
  identification: string;
  totalHours: string | null;
}

// Anota las horas de TODOS los instructores con color rojo/verde y refresca la
// vista previa. Siempre conserva el diseño del archivo original subido; solo se
// negocia la ruta (Excel COM, ExcelJS directo o reconstrucción como último recurso).
export async function writeHoursIntoExcel(
  results: InstructorResult[],
  elements: FileElements,
  state: FileUploadState,
): Promise<boolean> {
  if (!state.file) {
    logger.warn('Excel', 'No hay archivo cargado en state.');
    return false;
  }
  const targets = results.filter((r): r is { identification: string; totalHours: string } => Boolean(r.totalHours));
  if (targets.length === 0) {
    logger.warn('Excel', 'No hay horas para aplicar.');
    elements.statusMessage.textContent = 'No hay horas para aplicar. No se modificó el archivo.';
    return false;
  }

  const originalBuffer = await state.file.arrayBuffer();

  // Primera opción: Excel COM múltiple preserva el diseño original al 100%.
  let updatedBuffer: ArrayBuffer | null = null;
  let usedRoute: 'com' | 'exceljs' | 'rebuild' | null = null;

  try {
    updatedBuffer = await window.electronAPI.applyHoursMultipleToExcel({
      data: originalBuffer,
      fileName: state.file.name,
      targets,
    });
    if (updatedBuffer) {
      usedRoute = 'com';
    }
  } catch (error) {
    logger.warn('Excel', 'Error en la ruta COM múltiple; se intentará ExcelJS.', error);
  }

  // Segunda opción: ExcelJS directo sobre el archivo, conservando estilos y filtros.
  if (!updatedBuffer) {
    try {
      updatedBuffer = await editOriginalWorkbookMultiple(originalBuffer, targets);
      if (updatedBuffer) {
        usedRoute = 'exceljs';
      }
    } catch (error) {
      logger.warn('Excel', 'Error en la ruta ExcelJS; se usará el fallback .xls.', error);
    }
  }

  if (!updatedBuffer) {
    try {
      updatedBuffer = await rebuildFromRowsMultiple(originalBuffer, targets);
      if (updatedBuffer) {
        usedRoute = 'rebuild';
      }
    } catch (error) {
      logger.warn('Excel', 'Falló la reconstrucción del archivo.', error);
    }
  }

  if (!updatedBuffer) {
    logger.warn('Excel', 'No se pudieron aplicar horas.');
    elements.statusMessage.textContent = 'No se pudieron aplicar las horas. No se modificó el archivo.';
    return false;
  }

  // El archivo generado conserva TODAS las filas del original: la automatización solo
  // escribe las horas de los instructores consultados, pero no elimina al resto. Así,
  // al refrescar la vista previa tampoco desaparecen sus carnets ni sus filas.
  const baseName = state.file.name.replace(/\.[^.]+$/, '');
  const ext = usedRoute === 'rebuild' ? '.xlsx' : (state.file.name.match(/\.[^.]+$/)?.[0] ?? '.xlsx');
  const isXls = ext.toLowerCase() === '.xls';
  const updatedFile = new File([updatedBuffer], `${baseName}-actualizado${ext}`, {
    type: isXls ? 'application/vnd.ms-excel' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  state.file = updatedFile;
  await refreshExcelPreview(updatedFile, elements, state);
  // Colorar TODAS las celdas "Horas Adicionales" en el preview (una sola llamada)
  colorHoursCellInPreview(elements);
  const highlightedBuffer = await highlightAllHoursCells(updatedBuffer);
  state.file = new File([highlightedBuffer || updatedBuffer], `${baseName}-actualizado${ext}`, {
    type: isXls ? 'application/vnd.ms-excel' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  showDownloadButton(elements, () => {
    const url = URL.createObjectURL(updatedFile);
    const link = document.createElement('a');
    link.href = url;
    link.download = updatedFile.name;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 5000);
  });

  const preservedDesign = usedRoute === 'com' || usedRoute === 'exceljs';
  elements.statusMessage.textContent = preservedDesign
    ? `Horas escritas para ${targets.length} instructor(es) con color (rojo < ${HOURS_THRESHOLD}, verde ≥ ${HOURS_THRESHOLD}). Diseño y filtros conservados. Archivo: ${updatedFile.name}.`
    : `Horas escritas para ${targets.length} instructor(es). Aviso: el archivo era .xls y se reconstruyó, así que pudo perder el diseño/filtros. Archivo: ${updatedFile.name}.`;
  return true;
}


