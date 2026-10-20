/**
 * Resplandor que sigue al puntero dentro de la zona de carga.
 *
 * El foco es una capa propia (`.dropzone-spotlight`) que solo cambia de
 * `transform`: mover una capa compuesta es mucho más barato que reescribir el
 * degradado de la tarjeta con variables CSS en cada píxel. Los movimientos se
 * agrupan en un frame y siempre se pinta la última posición recibida.
 */
export function initDropzoneSpotlight(dropzone: HTMLElement): void {
  const glow = dropzone.querySelector<HTMLElement>('.dropzone-spotlight');
  if (!glow) return;
  // Con movimiento reducido el foco se queda quieto en el centro, sin seguir al
  // puntero ni registrar trabajo en cada movimiento.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let frame: number | null = null;
  let pointerX = 0;
  let pointerY = 0;

  const paint = (): void => {
    frame = null;
    const rect = dropzone.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    // El foco está centrado con márgenes negativos: el desplazamiento se mide
    // desde el centro de la tarjeta.
    const x = pointerX - rect.left - rect.width / 2;
    const y = pointerY - rect.top - rect.height / 2;
    glow.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };

  const schedule = (): void => {
    if (frame === null) frame = window.requestAnimationFrame(paint);
  };

  const move = (event: PointerEvent): void => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    schedule();
  };

  const reset = (): void => {
    if (frame !== null) {
      window.cancelAnimationFrame(frame);
      frame = null;
    }
    glow.style.transform = 'translate3d(0, 0, 0)';
  };

  dropzone.addEventListener('pointermove', move, { passive: true });
  dropzone.addEventListener('pointerleave', reset);
}
