import type { Instructor } from './parse.js';
import { createSelectionCheckbox } from './selection.js';
import { effectiveHours, hoursView } from './hours.js';

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

// Insignia de horas con su color según el umbral; un guion si no hay dato.
function createHoursBadge(hours: string): HTMLElement {
  const view = hoursView(hours);
  const badge = el('span', `carnet-hours is-${view.kind}`);
  badge.appendChild(el('span', 'carnet-hours-value', view.text));
  if (view.hasHours) badge.appendChild(el('span', 'carnet-hours-unit', 'h'));
  return badge;
}

export function createInstructorCard(instructor: Instructor, accent: string): HTMLElement {
  const card = el('article', 'carnet');
  // Color propio del programa, para el relleno y los acentos de la credencial.
  card.style.setProperty('--card-accent', accent);
  // El programa se guarda en el dataset para que el filtro pueda ocultar/mostrar la credencial.
  card.dataset.program = instructor.program;
  // La cédula queda a mano para refrescar las horas del portal en vivo.
  card.dataset.identification = instructor.identification;
  card.appendChild(el('span', 'carnet-band'));

  const top = el('div', 'carnet-top');
  const photo = el('div', 'carnet-photo');
  photo.innerHTML = PHOTO_SVG;
  top.appendChild(photo);

  // Nombre y rol comparten bloque para que la credencial se lea como una ficha,
  // no como un retrato suelto con datos debajo.
  const identity = el('div', 'carnet-identity');
  const head = el('div', 'carnet-identity-head');
  // El rol y el estado de consulta comparten sitio: al consultar la cédula el
  // texto cambia sin mover el resto de la credencial.
  const role = el('span', 'carnet-role');
  role.appendChild(el('span', 'carnet-role-label', 'Contratista'));
  role.appendChild(el('span', 'carnet-role-consulting', 'Consultando…'));
  head.appendChild(role);
  // La casilla sustituye al logo y queda alineada con la esquina de la ficha.
  // Va en la línea del rol para no restarle ancho al nombre.
  head.appendChild(createSelectionCheckbox(instructor));
  identity.appendChild(head);
  identity.appendChild(el('h3', 'carnet-name', instructor.name));
  top.appendChild(identity);
  card.appendChild(top);

  const meta = el('div', 'carnet-meta');
  meta.appendChild(el('span', 'carnet-doc', `C.C. ${instructor.identification}`));
  meta.appendChild(createHoursBadge(effectiveHours(instructor)));
  card.appendChild(meta);

  const foot = el('div', 'carnet-foot');
  foot.appendChild(el('span', 'carnet-foot-label', 'Programa'));
  foot.appendChild(el('span', 'carnet-foot-value', instructor.program));
  card.appendChild(foot);

  return card;
}

// Repinta las horas de las credenciales de una cédula (puede haber varias por programa).
export function updateCardHours(grid: HTMLElement, identification: string, hours: string): void {
  Array.from(grid.children).forEach((node) => {
    if (!(node instanceof HTMLElement) || node.dataset.identification !== identification) return;
    const badge = node.querySelector('.carnet-hours');
    if (badge) badge.replaceWith(createHoursBadge(hours));
  });
}
