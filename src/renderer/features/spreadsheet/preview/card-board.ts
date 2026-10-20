import type { AppElements } from '../../../app/types.js';
import type { CardBoard } from '../../instructors/index.js';

// Elementos que necesita la vista previa; se recortan del DOM completo para no
// acoplar el módulo a la barra de reproducción ni a los campos de acceso.
export type FileElements = Pick<AppElements, 'dropzone' | 'fileInput' | 'dropzoneText' | 'excelPreview' | 'cardsGrid' | 'programFilter' | 'hoursFilter' | 'cardsSearch' | 'cardsSelectAll' | 'cardsCount' | 'cardsEmpty' | 'statusMessage'>;

export function cardBoard(elements: FileElements): CardBoard {
  return {
    grid: elements.cardsGrid,
    programFilter: elements.programFilter,
    hoursFilter: elements.hoursFilter,
    search: elements.cardsSearch,
    selectAll: elements.cardsSelectAll,
    count: elements.cardsCount,
    empty: elements.cardsEmpty,
  };
}
