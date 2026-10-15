/**
 * Carrusel de paisajes colombianos, uno por mes, al estilo de las tarjetas de
 * Spotify: foto enmarcada con una franja de color y el nombre del mes.
 *
 * Se genera desde una única lista para que añadir o cambiar una foto sea tocar
 * solo los datos. Los colores de cada franja viven en el CSS por posición.
 */

interface MonthCard {
  /** Nombre del mes que se muestra en la franja. */
  label: string;
  /** Ruta de la fotografía, relativa a `index.html`. */
  image: string;
}

const MONTHS: MonthCard[] = [
  { label: 'Enero', image: 'images/landscapes/enero.jpg' },
  { label: 'Febrero', image: 'images/landscapes/febrero.jpg' },
  { label: 'Marzo', image: 'images/landscapes/marzo.jpg' },
  { label: 'Abril', image: 'images/landscapes/abril.jpg' },
  { label: 'Mayo', image: 'images/landscapes/mayo.jpg' },
  { label: 'Junio', image: 'images/landscapes/junio.jpg' },
  { label: 'Julio', image: 'images/landscapes/julio.jpg' },
  { label: 'Agosto', image: 'images/landscapes/agosto.jpg' },
  { label: 'Septiembre', image: 'images/landscapes/septiembre.jpg' },
  { label: 'Octubre', image: 'images/landscapes/octubre.jpg' },
  { label: 'Noviembre', image: 'images/landscapes/noviembre.jpg' },
  { label: 'Diciembre', image: 'images/landscapes/diciembre.jpg' },
];

/** Insignia de la esquina: una montaña con sol, guiño a los paisajes. */
const BADGE_ICON = `
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="16" cy="8" r="2.4" stroke="currentColor" stroke-width="1.8" />
    <path d="M3.5 18.5 9 11l4 5.2 2.6-3.1 4.9 5.4Z" stroke="currentColor" stroke-width="1.8"
      stroke-linejoin="round" />
  </svg>
`;

function createCard(month: MonthCard): HTMLElement {
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

  const badge = document.createElement('span');
  badge.className = 'month-card-badge';
  badge.setAttribute('aria-hidden', 'true');
  badge.innerHTML = BADGE_ICON;

  const label = document.createElement('span');
  label.className = 'month-card-label';
  label.textContent = month.label;

  media.append(photo, badge);
  card.append(media, label);
  return card;
}

/** Rellena el carrusel si el contenedor existe en el documento. */
export function initMonthsShowcase(): void {
  const track = document.getElementById('monthsTrack');
  if (!track) return;

  track.replaceChildren(...MONTHS.map(createCard));
}
