import { parseHoursValue } from '../spreadsheet/helpers.js';
import { availabilityHours, contractHoursKind, hoursView } from './hours.js';
import { refreshHoursHint } from './hours-hint.js';

const additionalHoursByCard = new WeakMap<HTMLElement, Readonly<Record<number, string>>>();
const academicHoursByCard = new WeakMap<HTMLElement, Readonly<Record<number, string>>>();
const compensationHoursByCard = new WeakMap<
  HTMLElement,
  { byMonth: Readonly<Record<number, string>>; fallback: string }
>();
const requiredHoursByCard = new WeakMap<
  HTMLElement,
  { byMonth: Readonly<Record<number, string>>; fallback: string }
>();
const HOURS_FORMAT = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 });
let selectedMonths: readonly number[] | null = null;

function el(tag: string, className: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function rememberCardAdditionalHours(
  card: HTMLElement,
  values: Readonly<Record<number, string>>,
  academicValues: Readonly<Record<number, string>>,
): void {
  additionalHoursByCard.set(card, values);
  academicHoursByCard.set(card, academicValues);
}

export function rememberCardCompensationHours(
  card: HTMLElement,
  byMonth: Readonly<Record<number, string>>,
  fallback: string,
): void {
  compensationHoursByCard.set(card, { byMonth, fallback });
}

export function rememberCardRequiredHours(
  card: HTMLElement,
  byMonth: Readonly<Record<number, string>>,
  fallback: string,
): void {
  requiredHoursByCard.set(card, { byMonth, fallback });
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
    updateCardCompensationHours(node, months);
    const requiredHours = updateCardRequiredHours(node, months);
    const monthlyHours = node.querySelector<HTMLElement>('.carnet-monthly-hours');
    const baseHours = node.querySelector<HTMLElement>('.carnet-base-hours');
    const additionalValues = additionalHoursByCard.get(node) ?? {};
    const academicValues = academicHoursByCard.get(node) ?? {};
    const selected = months ?? [];
    const additionalTotal = sumMonthValues(selected.map((month) => (
      availabilityHours(node.dataset.identification ?? '', month) ?? additionalValues[month] ?? ''
    )));
    const academicMonthly = sumMonthValues(selected.map((month) => academicValues[month] ?? ''));
    const base = academicMonthly.value === null
      ? node.dataset.baseHours ?? ''
      : HOURS_FORMAT.format(academicMonthly.value);
    if (monthlyHours) {
      const additional = el('span', 'carnet-monthly-hour');
      additional.textContent = `Horas Adicionales: ${additionalTotal.value === null
        ? '—'
        : `${HOURS_FORMAT.format(additionalTotal.value)} h`}`;
      monthlyHours.replaceChildren(additional);
      monthlyHours.hidden = false;
    }
    if (!baseHours) return;
    const label = node.dataset.hoursSource === 'sofiaplus' ? 'Horas de SofiaPlus' : 'Horas académicas';
    baseHours.textContent = `${label}: ${base || '—'}${base ? ' h' : ''}`;
    baseHours.hidden = false;
    const academicTotal = parseHoursValue(base);
    const hasAdditional = additionalTotal.value !== null;
    const total = Number.isFinite(academicTotal)
      ? academicTotal + (additionalTotal.value ?? 0)
      : Number.NaN;
    const totalText = Number.isFinite(total)
      ? HOURS_FORMAT.format(total)
      : hasAdditional
        ? HOURS_FORMAT.format(additionalTotal.value ?? 0)
        : base;
    const badge = node.querySelector('.carnet-total-hours');
    if (badge) {
      badge.replaceWith(createHoursBadge(
        totalText,
        hasAdditional,
        requiredHours,
      ));
    }
    node.dataset.hours = totalText;
  });
  refreshHoursHint();
  grid.dispatchEvent(new Event('carnet-hours-updated'));
}

function updateCardRequiredHours(card: HTMLElement, months: readonly number[] | null): string {
  const element = card.querySelector<HTMLElement>('.carnet-contract-hours');
  const values = requiredHoursByCard.get(card);
  if (!element || !values) return card.dataset.requiredContractHours ?? '';
  const month = months?.[0];
  const hasMonthlyValues = Object.keys(values.byMonth).length > 0;
  const hours = month === undefined
    ? (hasMonthlyValues ? '' : values.fallback)
    : values.byMonth[month] ?? (hasMonthlyValues ? '' : values.fallback);
  element.textContent = `Horas requeridas por contrato: ${hours || '—'}${hours ? ' h' : ''}`;
  element.hidden = false;
  card.dataset.requiredContractHours = hours;
  return hours;
}

function sumMonthValues(values: readonly string[]): { value: number | null } {
  let total = 0;
  let found = false;
  values.forEach((hours) => {
    const value = parseHoursValue(hours);
    if (!Number.isFinite(value)) return;
    total += value;
    found = true;
  });
  return { value: found ? total : null };
}

function updateCardCompensationHours(card: HTMLElement, months: readonly number[] | null): void {
  const element = card.querySelector<HTMLElement>('.carnet-compensation-hours');
  const values = compensationHoursByCard.get(card);
  if (!element || !values) return;
  const month = months?.[0];
  const hasMonthlyValues = Object.keys(values.byMonth).length > 0;
  const hours = month === undefined
    ? (hasMonthlyValues ? '' : values.fallback)
    : values.byMonth[month] ?? (hasMonthlyValues ? '' : values.fallback);
  element.textContent = `Horas por compensar: ${hours || '—'}`;
  element.hidden = false;
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
