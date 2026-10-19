/**
 * Desvanecido de continuación del carrusel.
 *
 * Mientras queden tarjetas por descubrir, el borde derecho de la pista se
 * difumina; al llegar al final del recorrido (o cuando todo cabe en pantalla)
 * el desvanecido desaparece para no ocultar la última tarjeta.
 */

const AT_END_CLASS = 'is-at-end';

/** Absorbe el redondeo de píxeles que hacen los navegadores al hacer scroll. */
const END_THRESHOLD = 2;

function isAtEnd(track: HTMLElement): boolean {
  const remaining = track.scrollWidth - track.clientWidth - track.scrollLeft;
  return remaining <= END_THRESHOLD;
}

export function initScrollFade(track: HTMLElement): void {
  const update = (): void => {
    track.classList.toggle(AT_END_CLASS, isAtEnd(track));
  };

  track.addEventListener('scroll', update, { passive: true });
  // El ancho disponible cambia con la ventana; hay que reevaluar el final.
  new ResizeObserver(update).observe(track);
  update();
}
