import type { Instructor } from './parse.js';
import { isContractStartNearToday } from '../spreadsheet/helpers.js';
import { createSelectionCheckbox } from './selection.js';
import { effectiveHours } from './hours.js';
import {
  createInstructorHoursBadge,
  rememberCardAdditionalHours,
  rememberCardCompensationHours,
  rememberCardRequiredHours,
} from './card-hours.js';

// Retrato genérico para credenciales sin foto de perfil (estilo intranet).
const PHOTO_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">'
  + '<circle cx="12" cy="8.2" r="4" />'
  + '<path d="M12 14.2c-4.3 0-7.7 2.7-8.6 6.5-.2.9.5 1.8 1.5 1.8h14.2c1 0 1.7-.9 1.5-1.8-.9-3.8-4.3-6.5-8.6-6.5Z" />'
  + '</svg>';

// El mismo retrato se repite en cada carnet: se parsea una vez y se clona. Con
// cientos de filas, volver a interpretar el SVG en cada ficha se nota.
const PHOTO_TEMPLATE = document.createElement('template');
PHOTO_TEMPLATE.innerHTML = PHOTO_SVG;

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
  // La cédula queda a mano para refrescar las horas del portal en vivo.
  card.dataset.identification = instructor.identification;
  rememberCardAdditionalHours(
    card,
    instructor.additionalHoursByMonth,
    instructor.academicHoursByMonth,
  );
  rememberCardCompensationHours(
    card,
    instructor.hoursToCompensateByMonth,
    instructor.hoursToCompensate,
  );
  rememberCardRequiredHours(
    card,
    instructor.requiredContractHoursByMonth,
    instructor.requiredContractHours,
  );
  card.appendChild(el('span', 'carnet-band'));

  const top = el('div', 'carnet-top');
  const photo = el('div', 'carnet-photo');
  photo.append(PHOTO_TEMPLATE.content.cloneNode(true));
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
  // Los instructores cuyo contrato arranca dentro de la ventana de aviso
  // (por empezar o recién empezado) llevan su propia línea: en la del rol no
  // cabe sin recortarse junto a la casilla.
  if (isContractStartNearToday(instructor.contractStart)) {
    identity.appendChild(el('span', 'carnet-new-badge', 'Nuevo instructor'));
  }
  top.appendChild(identity);
  card.appendChild(top);

  const hours = effectiveHours(instructor);
  // Las horas quedan en el dataset para que el pie del reproductor calcule el
  // avance al pasar el cursor, sin volver a interpretar la insignia.
  card.dataset.hours = hours;
  card.dataset.baseHours = hours;
  card.dataset.requiredContractHours = instructor.requiredContractHours;
  const meta = el('div', 'carnet-meta');
  meta.appendChild(el('span', 'carnet-doc', `C.C. ${instructor.identification}`));
  meta.appendChild(createInstructorHoursBadge(hours, instructor.requiredContractHours));
  card.appendChild(meta);

  const requiredHours = el('span', 'carnet-contract-hours');
  requiredHours.hidden = true;
  card.appendChild(requiredHours);

  const compensationHours = el('span', 'carnet-compensation-hours');
  compensationHours.hidden = true;
  card.appendChild(compensationHours);

  const monthlyHours = el('div', 'carnet-monthly-hours');
  monthlyHours.hidden = true;
  card.appendChild(monthlyHours);
  const baseHours = el('span', 'carnet-base-hours');
  baseHours.hidden = true;
  card.appendChild(baseHours);

  const foot = el('div', 'carnet-foot');
  foot.appendChild(el('span', 'carnet-foot-label', 'Programa'));
  foot.appendChild(el('span', 'carnet-foot-value', instructor.program));
  card.appendChild(foot);

  return card;
}
