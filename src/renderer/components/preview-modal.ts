import type { AppElements } from '../types.js';

export type PreviewModalElements = Pick<
  AppElements,
  'previewModal' | 'previewBackdrop' | 'previewCloseButton' | 'previewOpenButton' | 'playerTableButton'
>;

/**
 * Ventana interna para consultar la tabla del Excel.
 *
 * La tabla ya no vive en la página: se abre bajo demanda con el botón de la
 * cabecera o con el de la barra del reproductor, y se cierra con la equis, con
 * el fondo difuminado o con Escape. Al cerrar se devuelve el foco al botón que
 * la abrió para no perder el sitio del teclado.
 */
export function initPreviewModal(elements: PreviewModalElements): void {
  const isOpen = (): boolean => !elements.previewModal.hidden;
  // El foco vuelve al botón que abrió la ventana, sea el de la cabecera o el del reproductor.
  let opener: HTMLButtonElement = elements.previewOpenButton;

  const open = (trigger: HTMLButtonElement): void => {
    opener = trigger;
    elements.previewModal.hidden = false;
    elements.previewCloseButton.focus();
  };

  const close = (): void => {
    if (!isOpen()) return;
    elements.previewModal.hidden = true;
    opener.focus();
  };

  elements.previewOpenButton.addEventListener('click', () => open(elements.previewOpenButton));
  elements.playerTableButton.addEventListener('click', () => open(elements.playerTableButton));
  elements.previewCloseButton.addEventListener('click', close);
  elements.previewBackdrop.addEventListener('click', close);
  document.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape') close();
  });
}
