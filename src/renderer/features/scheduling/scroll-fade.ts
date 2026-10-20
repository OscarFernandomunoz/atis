/**
 * Desvanecido de continuación del carrusel.
 *
 * Mientras queden tarjetas por descubrir, el borde derecho de la pista se
 * difumina; al llegar al final del recorrido (o cuando todo cabe en pantalla)
 * el desvanecido desaparece para no ocultar la última tarjeta.
 *
 * El scroll emite muchos eventos por segundo: el cálculo se agrupa en un frame
 * para no leer el layout en cada uno.
 */

const AT_END_CLASS = 'is-at-end';

/** Absorbe el redondeo de píxeles que hacen los navegadores al hacer scroll. */
const END_THRESHOLD = 2;

function isAtEnd(track: HTMLElement): boolean {
  const remaining = track.scrollWidth - track.clientWidth - track.scrollLeft;
  return remaining <= END_THRESHOLD;
}

export function initScrollFade(track: HTMLElement): void {
  let frame: number | null = null;

  const update = (): void => {
    frame = null;
    track.classList.toggle(AT_END_CLASS, isAtEnd(track));
  };

  const schedule = (): void => {
    if (frame === null) frame = window.requestAnimationFrame(update);
  };

  track.addEventListener('scroll', schedule, { passive: true });
  // El ancho disponible cambia con la ventana; hay que reevaluar el final.
  new ResizeObserver(schedule).observe(track);
  update();
}
