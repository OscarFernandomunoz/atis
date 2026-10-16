import { createMonthCard, type MonthCardView } from './card.js';
import { writeDateRange } from './date-range.js';
import { MONTHS } from './months.js';
import { isMonthSelected, toggleMonth, type MonthRange } from './selection.js';

/** Rellena el carrusel y enlaza cada mes con el rango de fechas del formulario. */
export function initMonthsShowcase(): void {
  const track = document.getElementById('monthsTrack');
  if (!track) return;

  const startInput = document.getElementById('fechaInicio') as HTMLInputElement | null;
  const endInput = document.getElementById('fechaFin') as HTMLInputElement | null;
  const year = new Date().getFullYear();

  const views: MonthCardView[] = MONTHS.map((month) => createMonthCard(month));
  track.replaceChildren(...views.map((view) => view.card));

  let range: MonthRange | null = null;

  const render = (): void => {
    views.forEach(({ card, button, month }) => {
      const selected = isMonthSelected(range, month.index);
      card.classList.toggle('is-selected', selected);
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-checked', String(selected));
    });
  };

  views.forEach(({ button, month }) => {
    button.addEventListener('click', () => {
      range = toggleMonth(range, month.index);
      render();
      // Solo se tocan las fechas al elegir meses: no pisa un rango escrito a mano al cargar.
      if (startInput && endInput) writeDateRange({ start: startInput, end: endInput }, range, year);
    });
  });

  render();
}
