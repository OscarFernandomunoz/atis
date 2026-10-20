import * as XLSX from 'xlsx';
import type { FileUploadState } from '../../../app/types.js';
import { clearInstructorCards, forgetLiveHours, renderInstructorCards } from '../../instructors/index.js';
import { notify } from '../../notifications/index.js';
import { cardBoard, type FileElements } from './card-board.js';
import { findRequiredColumnIndex, getAllIdentifications, validateRequiredColumn } from './column.js';
import { DROPZONE_HINT, REQUIRED_COLUMN_LABEL, REQUIRED_COLUMN_NAME } from './constants.js';
import { createFilterBar, createTable } from './table.js';
import { applyCardFilter } from './view.js';

export function initFileHandling(elements: FileElements, state: FileUploadState): void {
  elements.dropzone.addEventListener('click', () => elements.fileInput.click());
  elements.dropzone.addEventListener('keydown', (event: KeyboardEvent) => {
    // La tarjeta actúa como botón: Enter y Espacio deben abrir el selector.
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    elements.fileInput.click();
  });
  elements.dropzone.addEventListener('dragover', (event: DragEvent) => {
    event.preventDefault();
    elements.dropzone.classList.add('dragover');
  });
  elements.dropzone.addEventListener('dragleave', (event: DragEvent) => {
    // Al pasar sobre un hijo el navegador emite dragleave: solo se apaga al salir.
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && elements.dropzone.contains(nextTarget)) return;
    elements.dropzone.classList.remove('dragover');
  });
  elements.dropzone.addEventListener('drop', (event: DragEvent) => {
    event.preventDefault();
    elements.dropzone.classList.remove('dragover');
    const droppedFile = event.dataTransfer?.files[0];
    if (droppedFile) validateAndSetFile(droppedFile, elements, state);
  });
  elements.fileInput.addEventListener('change', (event: Event) => {
    const input = event.target as HTMLInputElement;
    const selectedFile = input.files?.[0];
    if (selectedFile) validateAndSetFile(selectedFile, elements, state);
  });
}

function validateAndSetFile(file: File, elements: FileElements, state: FileUploadState): void {
  elements.dropzone.classList.remove('dropzone-valid', 'dropzone-error');
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension !== 'xls' && extension !== 'xlsx') {
    void notify('Archivo no válido', 'Solo se permiten archivos Excel en formato .xls o .xlsx');
    return;
  }
  elements.dropzoneText.innerHTML = `Archivo seleccionado: <strong>${file.name}</strong> (${(file.size / 1024).toFixed(1)} KB)`;
  elements.statusMessage.textContent = `Archivo "${file.name}" cargado. Validando ${REQUIRED_COLUMN_NAME}...`;
  // Un archivo nuevo empieza sin horas leídas del portal.
  forgetLiveHours();
  void refreshExcelPreview(file, elements, state);
}

export async function refreshExcelPreview(file: File, elements: FileElements, state: FileUploadState): Promise<void> {
  elements.excelPreview.replaceChildren();
  elements.excelPreview.textContent = 'Leyendo información del Excel...';
  clearInstructorCards(cardBoard(elements));
  try {
    const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
    // Detectar si alguna hoja tiene filtro autofilter aplicado (Excel nativo)
    const sheetFilterInfos = workbook.SheetNames.map((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const autofilter = sheet ? sheet['!autofilter'] : null;
      return {
        sheetName,
        autofilter,
        rows: sheet ? XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' }) : [],
      };
    });
    const validationResults = sheetFilterInfos.map(({ sheetName, rows }) => validateRequiredColumn(rows, sheetName));
    const validSheetCount = validationResults.filter((result) => result === null).length;
    if (validSheetCount === 0) {
      rejectFile(elements, state, validationResults.find(Boolean) ?? `Ninguna hoja contiene ${REQUIRED_COLUMN_LABEL} con datos válidos.`);
      return;
    }
    const identifications = [...new Set(sheetFilterInfos
      .flatMap(({ rows }) => getAllIdentifications(rows)))];
    const firstIdentification = identifications[0] ?? null;
    const fragment = document.createDocumentFragment();
    sheetFilterInfos.forEach(({ sheetName, rows, autofilter }) => {
      const section = document.createElement('section');
      const title = document.createElement('h3');
      title.textContent = sheetName;
      section.appendChild(title);
      if (!rows.length) {
        const empty = document.createElement('p');
        empty.textContent = 'Esta hoja está vacía.';
        section.appendChild(empty);
      } else {
        const table = createTable(rows, findRequiredColumnIndex(rows)?.columnIndex ?? -1);
        // Agregar barra de filtros que respeta filas ocultas
        section.appendChild(createFilterBar(table));
        const wrapper = document.createElement('div');
        wrapper.className = 'excel-table-wrapper';
        wrapper.appendChild(table);
        section.appendChild(wrapper);
        // Si el archivo tiene filtro autofilter nativo, agregar indicación visual
        if (autofilter) {
          const filterNote = document.createElement('p');
          filterNote.className = 'excel-filter-note';
          filterNote.textContent = `• Hoja tiene filtro autofilter aplicado (rango: ${autofilter.ref})`;
          section.appendChild(filterNote);
        }
      }
      fragment.appendChild(section);
    });
    state.file = file;
    if (firstIdentification) {
      elements.statusMessage.textContent = `${identifications.length} cédula(s) de instructores extraídas del Excel. ${REQUIRED_COLUMN_LABEL} presente.`;
    }
    elements.dropzone.classList.remove('dropzone-error');
    elements.dropzone.classList.add('dropzone-valid');
    elements.excelPreview.replaceChildren(fragment);
    // Con las tablas ya montadas, el filtro de carnets oculta las filas que no aplican.
    renderInstructorCards(cardBoard(elements), sheetFilterInfos.map(({ rows }) => rows), (visible) => {
      applyCardFilter(elements, visible);
    });
    if (!firstIdentification) {
      elements.statusMessage.textContent = `Información de ${file.name} lista para revisar. ${REQUIRED_COLUMN_LABEL} presente, pero no se encontraron cédulas válidas.`;
    }
  } catch {
    rejectFile(elements, state, 'No se pudo leer este archivo Excel.');
  }
}

function rejectFile(elements: FileElements, state: FileUploadState, message: string): void {
  state.file = null;
  elements.fileInput.value = '';
  elements.dropzone.classList.add('dropzone-error');
  elements.dropzoneText.textContent = DROPZONE_HINT;
  elements.excelPreview.textContent = message;
  clearInstructorCards(cardBoard(elements));
  elements.statusMessage.textContent = message;
  void notify('No se pudo leer el archivo', message);
}
