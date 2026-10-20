/**
 * Resplandor que sigue al puntero dentro de la zona de carga.
 *
 * La posición se publica en variables CSS (`--dz-pointer-x/y`) y es el CSS quien
 * pinta el degradado; así el efecto no obliga a recalcular estilos en cada píxel.
 * Se limita a un frame por pintado para no encadenar cálculos.
 */
export function initDropzoneSpotlight(dropzone: HTMLElement): void {
  let frame: number | null = null;

  const move = (event: PointerEvent): void => {
    if (frame !== null) return;
    frame = window.requestAnimationFrame(() => {
      frame = null;
      const rect = dropzone.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      dropzone.style.setProperty('--dz-pointer-x', `${x}%`);
      dropzone.style.setProperty('--dz-pointer-y', `${y}%`);
    });
  };

  const reset = (): void => {
    if (frame !== null) {
      window.cancelAnimationFrame(frame);
      frame = null;
    }
    dropzone.style.setProperty('--dz-pointer-x', '50%');
    dropzone.style.setProperty('--dz-pointer-y', '50%');
  };

  dropzone.addEventListener('pointermove', move);
  dropzone.addEventListener('pointerleave', reset);
}
