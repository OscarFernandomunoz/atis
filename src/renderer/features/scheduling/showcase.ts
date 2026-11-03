import { createMonthCard, type MonthCardView } from './card.js';
import { writeDateRange } from './date-range.js';
import { MONTHS } from './months.js';
import { initScrollFade } from './scroll-fade.js';
import { isMonthSelected, toggleMonth, type MonthRange } from './selection.js';

/** Rellena el carrusel y enlaza cada mes con las fechas del formulario.
 *
 * `onMonthsChange` recibe el mes activo (0 = enero) o null cuando queda sin
 * selección: el preview de la nómina muestra solo los bloques de ese mes. */
export function initMonthsShowcase(onMonthsChange?: (months: number[] | null) => void): void {
  const track = document.getElementById('monthsTrack');
  if (!track) return;
  track.setAttribute('role', 'radiogroup');
  track.setAttribute('aria-label', 'Mes a consultar');

  const startInput = document.getElementById('fechaInicio') as HTMLInputElement | null;
  const endInput = document.getElementById('fechaFin') as HTMLInputElement | null;
  const year = new Date().getFullYear();

  const views: MonthCardView[] = MONTHS.map((month) => createMonthCard(month));
  track.replaceChildren(...views.map((view) => view.card));
  initScrollFade(track);

  let range: MonthRange | null = null;

  const render = (): void => {
    views.forEach(({ card, month }) => {
      const selected = isMonthSelected(range, month.index);
      card.classList.toggle('is-selected', selected);
      card.setAttribute('aria-checked', String(selected));
    });
  };

  views.forEach(({ card, month }) => {
    card.addEventListener('click', () => {
      range = toggleMonth(range, month.index);
      render();
      // Solo se tocan las fechas al elegir meses: no pisa un rango escrito a mano al cargar.
      if (startInput && endInput) writeDateRange({ start: startInput, end: endInput }, range, year);
      const vigente = range;
      const months = vigente
        ? Array.from({ length: vigente.end - vigente.start + 1 }, (_, offset) => vigente.start + offset)
        : null;
      onMonthsChange?.(months);
    });
  });

  render();
}
