/**
 * Aparición progresiva de los carnets al entrar en pantalla.
 *
 * Cada credencial se anima una sola vez: la primera vez que cruza la vista.
 * Después queda visible aunque salga y vuelva a entrar, así el gesto no se
 * repite al recorrer la rejilla. El deslizamiento arranca desde el lado por el
 * que aparece la ficha (`--reveal-from`) y el retardo en cascada
 * (`--reveal-delay`) completa cada fila de izquierda a derecha. La animación
 * vive en CSS (`.cards-animate .carnet`); aquí sólo se decide cuándo, desde
 * dónde y con qué retardo.
 */

/** Observador activo por rejilla: al repintar hay que soltar el anterior. */
const observers = new WeakMap<HTMLElement, IntersectionObserver>();

/** Fichas que ya escuchan el final de su animación (se engancha una sola vez). */
const settleListeners = new WeakSet<HTMLElement>();

/** Escalón entre credenciales de una misma tanda. */
const REVEAL_STEP_MS = 55;
/** Tope del retardo para que una tanda grande no tarde una eternidad. */
const REVEAL_MAX_DELAY_MS = 330;
/** Distancia del deslizamiento inicial, en píxeles. */
const REVEAL_SHIFT_PX = 26;

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Rearma la ficha: queda oculta hasta su primera entrada en pantalla. */
function rearm(card: HTMLElement): void {
  card.classList.remove('is-revealed', 'is-settled');
  card.style.removeProperty('--reveal-delay');
}

/** Lanza la animación; `fromTop` invierte el deslizamiento al entrar desde arriba. */
function unveil(card: HTMLElement, delay: number, fromTop: boolean): void {
  card.style.setProperty('--reveal-delay', `${delay}ms`);
  card.style.setProperty('--reveal-from', `${fromTop ? -REVEAL_SHIFT_PX : REVEAL_SHIFT_PX}px`);
  card.classList.remove('is-settled');
  card.classList.add('is-revealed');
  if (settleListeners.has(card)) return;
  settleListeners.add(card);
  card.addEventListener('animationend', (event) => {
    // Las animaciones de los hijos también burbujean: sólo cuenta la propia.
    if (event.target !== card) return;
    // Al terminar se suelta la animación para que el hover use su transición.
    card.classList.remove('is-revealed');
    card.classList.add('is-settled');
  });
}

/** Enseña la rejilla sin animación (motion reducido o navegador sin observer). */
function unveilAll(grid: HTMLElement, cards: HTMLElement[]): void {
  grid.classList.remove('cards-animate');
  cards.forEach((card) => card.classList.add('is-settled'));
}

export function revealCards(grid: HTMLElement): void {
  forgetCardReveal(grid);

  const cards = Array.from(grid.querySelectorAll<HTMLElement>('.carnet'));
  if (!cards.length) return;
  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    unveilAll(grid, cards);
    return;
  }

  // Sin esta clase los carnets se verían completos desde el primer frame.
  grid.classList.add('cards-animate');
  cards.forEach(rearm);

  // Sin margen en el borde inferior: así la última fila se revela siempre al
  // llegar al final del scroll, aunque el contenido termine pegado al borde.
  const observer = new IntersectionObserver((entries) => {
    let step = 0;
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const card = entry.target as HTMLElement;
      // Fuera del observador tras el primer cruce: la animación no se repite.
      observer.unobserve(card);
      const rootTop = entry.rootBounds?.top ?? 0;
      unveil(card, Math.min(step * REVEAL_STEP_MS, REVEAL_MAX_DELAY_MS), entry.boundingClientRect.top < rootTop);
      step += 1;
    });
  }, { threshold: 0 });

  cards.forEach((card) => observer.observe(card));
  observers.set(grid, observer);
}

/** Suelta el observador y deja la rejilla en su estado normal. */
export function forgetCardReveal(grid: HTMLElement): void {
  observers.get(grid)?.disconnect();
  observers.delete(grid);
  grid.classList.remove('cards-animate');
}
