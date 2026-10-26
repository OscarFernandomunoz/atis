import { parseHoursValue } from '../spreadsheet/helpers.js';
import { availabilityHours, contractHoursKind, hoursView } from './hours.js';
import { refreshHoursHint } from './hours-hint.js';

const additionalHoursByCard = new WeakMap<HTMLElement, Readonly<Record<number, string>>>();
const HOURS_FORMAT = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 });
let selectedMonths: readonly number[] | null = null;

function el(tag: string, className: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function rememberCardAdditionalHours(card: HTMLElement, values: Readonly<Record<number, string>>): void {
  additionalHoursByCard.set(card, values);
}

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
      restoreAcademicHours(node);
      return;
    }

    let additionalTotal = 0;
    let hasAdditionalHours = false;
    months.forEach((month) => {
      const hours = availabilityHours(node.dataset.identification ?? '', month) ?? values[month] ?? '';
      const numericHours = parseHoursValue(hours);
      if (Number.isFinite(numericHours)) {
        additionalTotal += numericHours;
        hasAdditionalHours = true;
      }
    });
    if (!hasAdditionalHours) {
      monthlyHours.hidden = true;
      baseHours.hidden = true;
      restoreAcademicHours(node);
      return;
    }

    const additionalHours = el('span', 'carnet-monthly-hour');
    additionalHours.textContent = `Horas Adicionales: ${HOURS_FORMAT.format(additionalTotal)} h`;
    monthlyHours.replaceChildren(additionalHours);
    monthlyHours.hidden = false;
    const base = node.dataset.baseHours ?? '';
    const label = node.dataset.hoursSource === 'sofiaplus' ? 'Horas de SofiaPlus' : 'Horas académicas';
    baseHours.textContent = `${label}: ${base || '—'}${base ? ' h' : ''}`;
    baseHours.hidden = false;
    const academicTotal = parseHoursValue(base);
    const totalText = Number.isFinite(academicTotal)
      ? HOURS_FORMAT.format(academicTotal + additionalTotal)
      : base;
    const badge = node.querySelector('.carnet-total-hours');
    if (badge) {
      badge.replaceWith(createHoursBadge(
        totalText,
        true,
        node.dataset.requiredContractHours ?? '',
      ));
    }
  });
  refreshHoursHint();
  grid.dispatchEvent(new Event('carnet-hours-updated'));
}

function restoreAcademicHours(card: HTMLElement): void {
  const badge = card.querySelector('.carnet-total-hours');
  if (badge) {
    badge.replaceWith(createHoursBadge(
      card.dataset.baseHours ?? '',
      false,
      card.dataset.requiredContractHours ?? '',
    ));
  }
  card.dataset.hours = card.dataset.baseHours ?? '';
}

export function updateCardHours(grid: HTMLElement, identification: string, hours: string): void {
  Array.from(grid.children).forEach((node) => {
    if (!(node instanceof HTMLElement) || node.dataset.identification !== identification) return;
    node.dataset.baseHours = hours;
    node.dataset.hoursSource = 'sofiaplus';
  });
  updateCardAdditionalHours(grid, selectedMonths);
  refreshHoursHint();
}

export function createInstructorHoursBadge(hours: string, requiredHours: string): HTMLElement {
  return createHoursBadge(hours, false, requiredHours);
}
