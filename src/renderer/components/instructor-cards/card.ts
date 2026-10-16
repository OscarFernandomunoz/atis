import { HOURS_THRESHOLD, parseHoursValue } from '../excel-update/helpers.js';
import type { Instructor } from './parse.js';
import { createSelectionCheckbox } from './selection.js';

// Retrato genérico para credenciales sin foto de perfil (estilo intranet).
const PHOTO_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">'
  + '<circle cx="12" cy="8.2" r="4" />'
  + '<path d="M12 14.2c-4.3 0-7.7 2.7-8.6 6.5-.2.9.5 1.8 1.5 1.8h14.2c1 0 1.7-.9 1.5-1.8-.9-3.8-4.3-6.5-8.6-6.5Z" />'
  + '</svg>';

function el(tag: string, className: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function createInstructorCard(instructor: Instructor, accent: string): HTMLElement {
  const card = el('article', 'carnet');
  // Color propio del programa, para el relleno y los acentos de la credencial.
  card.style.setProperty('--card-accent', accent);
  // El programa se guarda en el dataset para que el filtro pueda ocultar/mostrar la credencial.
  card.dataset.program = instructor.program;
  card.appendChild(el('span', 'carnet-band'));

  const top = el('div', 'carnet-top');
  // La casilla sustituye el logo: el usuario elige a quién incluir en la automatización.
  top.appendChild(createSelectionCheckbox(instructor));
  const photo = el('div', 'carnet-photo');
  photo.innerHTML = PHOTO_SVG;
  top.appendChild(photo);
  card.appendChild(top);

  card.appendChild(el('span', 'carnet-role', 'Contratista'));
  card.appendChild(el('h3', 'carnet-name', instructor.name));

  const meta = el('div', 'carnet-meta');
  meta.appendChild(el('span', 'carnet-doc', `C.C. ${instructor.identification}`));

  const hoursValue = parseHoursValue(instructor.hours);
  const hasHours = instructor.hours !== '' && Number.isFinite(hoursValue);
  const hours = el('span', 'carnet-hours');
  hours.classList.add(hasHours ? (hoursValue < HOURS_THRESHOLD ? 'is-low' : 'is-ok') : 'is-none');
  hours.appendChild(el('span', 'carnet-hours-value', hasHours ? instructor.hours : '—'));
  if (hasHours) hours.appendChild(el('span', 'carnet-hours-unit', 'h'));
  meta.appendChild(hours);
  card.appendChild(meta);

  const foot = el('div', 'carnet-foot');
  foot.appendChild(el('span', 'carnet-foot-label', 'Programa'));
  foot.appendChild(el('span', 'carnet-foot-value', instructor.program));
  card.appendChild(foot);

  return card;
}
