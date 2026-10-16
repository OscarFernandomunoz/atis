import type { MonthCard } from './months.js';

// Check que aparece cuando el mes está seleccionado.
const CHECK_ICON = `
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="m6 12.4 4 4 8-8.6" stroke="currentColor" stroke-width="2.4"
      stroke-linecap="round" stroke-linejoin="round" />
  </svg>
`;

// La tarjeta y su selector, que el showcase necesita para marcar y enganchar el clic.
export interface MonthCardView {
  card: HTMLElement;
  button: HTMLButtonElement;
  month: MonthCard;
}

// Tarjeta de un mes: foto, nombre y el selector en la esquina superior izquierda.
export function createMonthCard(month: MonthCard): MonthCardView {
  const card = document.createElement('article');
  card.className = 'month-card';

  const media = document.createElement('div');
  media.className = 'month-card-media';

  const photo = document.createElement('img');
  photo.className = 'month-card-photo';
  photo.src = month.image;
  photo.alt = `Paisaje de Colombia en ${month.label.toLowerCase()}`;
  photo.loading = 'lazy';
  photo.decoding = 'async';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'month-card-select';
  button.setAttribute('role', 'checkbox');
  button.setAttribute('aria-checked', 'false');
  button.setAttribute('aria-label', `Seleccionar ${month.label}`);
  button.innerHTML = CHECK_ICON;

  const label = document.createElement('span');
  label.className = 'month-card-label';
  label.textContent = month.label;

  media.append(photo, button);
  card.append(media, label);
  return { card, button, month };
}
