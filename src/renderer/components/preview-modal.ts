import type { AppElements } from '../types.js';

export type PreviewModalElements = Pick<
  AppElements,
  'previewModal' | 'previewBackdrop' | 'previewCloseButton' | 'previewOpenButton' | 'playerTableButton' | 'excelPreview'
>;

/**
 * Ventana interna para consultar la tabla del Excel.
 *
 * La tabla ya no vive en la página: se abre bajo demanda con el botón de la
 * cabecera o con el de la barra del reproductor, y se cierra con la equis, con
 * el fondo difuminado o con Escape. Tanto la entrada como la salida se animan.
 * Al cerrar se devuelve el foco al botón que la abrió para no perder el sitio
 * del teclado.
 */

/** Algo mayor que la animación de salida de `modal.css`, para no ocultar la ventana antes de que termine. */
const CLOSE_ANIMATION_MS = 320;

export function initPreviewModal(elements: PreviewModalElements): void {
  const isOpen = (): boolean => !elements.previewModal.hidden;
  // El foco vuelve al botón que abrió la ventana, sea el de la cabecera o el del reproductor.
  let opener: HTMLButtonElement = elements.previewOpenButton;
  let closeTimer: number | null = null;

  // La tabla se pintó mientras la ventana estaba oculta, así que su animación
  // ya se consumió. Se reinicia aquí para que vuelva a entrar con cada apertura,
  // venga del botón que venga.
  const restartTableAnimation = (): void => {
    elements.excelPreview.classList.remove('is-entering');
    // Lectura de layout forzada: sin este reflow el navegador no reinicia la animación.
    void elements.excelPreview.offsetWidth;
    elements.excelPreview.classList.add('is-entering');
  };

  const cancelClose = (): void => {
    if (closeTimer === null) return;
    window.clearTimeout(closeTimer);
    closeTimer = null;
    elements.previewModal.classList.remove('is-closing');
  };

  const open = (trigger: HTMLButtonElement): void => {
    cancelClose();
    opener = trigger;
    elements.previewModal.hidden = false;
    restartTableAnimation();
    elements.previewCloseButton.focus();
  };

  const close = (): void => {
    // Otra pulsación durante la salida no debe reiniciar el cierre.
    if (!isOpen() || closeTimer !== null) return;
    elements.previewModal.classList.add('is-closing');
    // Con motion reducido el CSS dura 1ms; no tiene sentido retener la ventana.
    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : CLOSE_ANIMATION_MS;
    closeTimer = window.setTimeout(() => {
      closeTimer = null;
      elements.previewModal.hidden = true;
      elements.previewModal.classList.remove('is-closing');
      opener.focus();
    }, delay);
  };

  elements.previewOpenButton.addEventListener('click', () => open(elements.previewOpenButton));
  elements.playerTableButton.addEventListener('click', () => open(elements.playerTableButton));
  elements.previewCloseButton.addEventListener('click', close);
  elements.previewBackdrop.addEventListener('click', close);
  document.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape') close();
  });
}
