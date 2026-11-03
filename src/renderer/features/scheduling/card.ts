import type { MonthCard } from './months.js';

// Check que aparece cuando el mes está seleccionado.
const CHECK_ICON = `
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="m6 12.4 4 4 8-8.6" stroke="currentColor" stroke-width="2.4"
      stroke-linecap="round" stroke-linejoin="round" />
  </svg>
`;

// La tarjeta completa es el control; el círculo solo refleja el estado.
export interface MonthCardView {
  card: HTMLButtonElement;
  month: MonthCard;
}

// Tarjeta de un mes: foto, nombre y el indicador de selección en la esquina.
export function createMonthCard(month: MonthCard): MonthCardView {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'month-card';
  card.setAttribute('role', 'radio');
  card.setAttribute('aria-checked', 'false');
  card.setAttribute('aria-label', `Seleccionar ${month.label}`);

  const media = document.createElement('span');
  media.className = 'month-card-media';

  const photo = document.createElement('img');
  photo.className = 'month-card-photo';
  photo.src = month.image;
  photo.alt = `Paisaje de Colombia en ${month.label.toLowerCase()}`;
  // Las medidas intrínsecas reservan el hueco de la foto antes de decodificarla:
  // el carrusel no cambia de altura cuando terminan de cargar las imágenes.
  photo.width = 198;
  photo.height = 150;
  photo.loading = 'lazy';
  photo.decoding = 'async';
  // El carrusel vive bajo el pliegue: sus fotos no deben competir con la carga
  // inicial del formulario y de la barra del reproductor.
  photo.fetchPriority = 'low';

  const indicator = document.createElement('span');
  indicator.className = 'month-card-select';
  indicator.setAttribute('aria-hidden', 'true');
  indicator.innerHTML = CHECK_ICON;

  const label = document.createElement('span');
  label.className = 'month-card-label';
  label.textContent = month.label;

  media.append(photo, indicator);
  card.append(media, label);
  return { card, month };
}
