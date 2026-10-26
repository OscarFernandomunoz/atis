import type { Instructor } from './parse.js';
import { isContractStartNearToday } from '../spreadsheet/helpers.js';
import { createSelectionCheckbox } from './selection.js';
import { contractHoursKind, effectiveHours, hoursView } from './hours.js';
import { refreshHoursHint } from './hours-hint.js';
import { parseHoursValue } from '../spreadsheet/helpers.js';

// Retrato genérico para credenciales sin foto de perfil (estilo intranet).
const PHOTO_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">'
  + '<circle cx="12" cy="8.2" r="4" />'
  + '<path d="M12 14.2c-4.3 0-7.7 2.7-8.6 6.5-.2.9.5 1.8 1.5 1.8h14.2c1 0 1.7-.9 1.5-1.8-.9-3.8-4.3-6.5-8.6-6.5Z" />'
  + '</svg>';

// El mismo retrato se repite en cada carnet: se parsea una vez y se clona. Con
// cientos de filas, volver a interpretar el SVG en cada ficha se nota.
const PHOTO_TEMPLATE = document.createElement('template');
PHOTO_TEMPLATE.innerHTML = PHOTO_SVG;
const additionalHoursByCard = new WeakMap<HTMLElement, Readonly<Record<number, string>>>();
const HOURS_FORMAT = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 });
let selectedMonths: readonly number[] | null = null;

function el(tag: string, className: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// Insignia de horas con color según el cumplimiento del contrato.
function createHoursBadge(hours: string, total = false, requiredHours = ''): HTMLElement {
  const view = hoursView(hours);
  const kind = contractHoursKind(hours, requiredHours);
  const colorKind = kind === 'equal' ? 'ok' : kind === 'over' ? 'over' : kind === 'low' ? 'low' : view.kind;
  const badge = el('span', `carnet-hours is-${colorKind}`);
  badge.classList.add('carnet-total-hours');
  if (total) badge.appendChild(el('span', 'carnet-hours-label', 'Total'));
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
  additionalHoursByCard.set(card, instructor.additionalHoursByMonth);
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
  meta.appendChild(createHoursBadge(hours, false, instructor.requiredContractHours));
  card.appendChild(meta);

  if (instructor.requiredContractHours) {
    const requiredHours = el('span', 'carnet-contract-hours');
    requiredHours.textContent = `Horas requeridas por contrato: ${instructor.requiredContractHours} h`;
    card.appendChild(requiredHours);
  }

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

export function updateCardAdditionalHours(grid: HTMLElement, months: readonly number[] | null): void {
  selectedMonths = months;
  Array.from(grid.children).forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    const monthlyHours = node.querySelector<HTMLElement>('.carnet-monthly-hours');
    const baseHours = node.querySelector<HTMLElement>('.carnet-base-hours');
    const values = additionalHoursByCard.get(node);
    if (!monthlyHours || !baseHours || !values || !months?.length) {
      if (monthlyHours) monthlyHours.hidden = true;
      if (baseHours) baseHours.hidden = true;
      const badge = node.querySelector('.carnet-total-hours');
      if (badge) {
        badge.replaceWith(createHoursBadge(
          node.dataset.baseHours ?? '',
          false,
          node.dataset.requiredContractHours ?? '',
        ));
      }
      node.dataset.hours = node.dataset.baseHours ?? '';
      return;
    }

    const selectedMonths = months.filter((month) => Object.hasOwn(values, month));
    if (!selectedMonths.length) {
      monthlyHours.hidden = true;
      baseHours.hidden = true;
      const badge = node.querySelector('.carnet-total-hours');
      if (badge) {
        badge.replaceWith(createHoursBadge(
          node.dataset.baseHours ?? '',
          false,
          node.dataset.requiredContractHours ?? '',
        ));
      }
      node.dataset.hours = node.dataset.baseHours ?? '';
      return;
    }

    let additionalTotal = 0;
    let hasAdditionalHours = false;
    selectedMonths.forEach((month) => {
      const hours = values[month]?.trim() || '—';
      const numericHours = parseHoursValue(hours);
      if (Number.isFinite(numericHours)) {
        additionalTotal += numericHours;
        hasAdditionalHours = true;
      }
    });
    const additionalHours = el('span', 'carnet-monthly-hour');
    const additionalText = hasAdditionalHours ? HOURS_FORMAT.format(additionalTotal) : '—';
    additionalHours.textContent = `Horas Adicionales: ${additionalText}${hasAdditionalHours ? ' h' : ''}`;
    monthlyHours.replaceChildren(additionalHours);
    monthlyHours.hidden = false;
    const base = node.dataset.baseHours ?? '';
    const label = node.dataset.hoursSource === 'sofiaplus' ? 'Horas de SofiaPlus' : 'Horas académicas';
    baseHours.textContent = `${label}: ${base || '—'}${base ? ' h' : ''}`;
    baseHours.hidden = false;

    const baseTotal = parseHoursValue(base);
    const total = Number.isFinite(baseTotal) ? baseTotal + additionalTotal : Number.NaN;
    const totalText = Number.isFinite(total) ? HOURS_FORMAT.format(total) : base;
    const badge = node.querySelector('.carnet-total-hours');
    if (badge) {
      badge.replaceWith(createHoursBadge(totalText, true, node.dataset.requiredContractHours ?? ''));
    }
  });
  refreshHoursHint();
  grid.dispatchEvent(new Event('carnet-hours-updated'));
}

// Repinta las horas de las credenciales de una cédula (puede haber varias por programa).
export function updateCardHours(grid: HTMLElement, identification: string, hours: string): void {
  Array.from(grid.children).forEach((node) => {
    if (!(node instanceof HTMLElement) || node.dataset.identification !== identification) return;
    node.dataset.baseHours = hours;
    node.dataset.hoursSource = 'sofiaplus';
  });
  updateCardAdditionalHours(grid, selectedMonths);
  // Si el cursor sigue sobre la ficha, la pista del pie muestra las horas nuevas.
  refreshHoursHint();
}
