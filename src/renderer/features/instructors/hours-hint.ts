import type { AppElements } from '../../app/types.js';
import { HOURS_THRESHOLD, parseHoursValue } from '../spreadsheet/helpers.js';

/**
 * Avance de un carnet respecto a la meta de horas del reporte.
 *
 * El pie del reproductor reserva la derecha para esta pista: al pasar el cursor
 * (o enfocar con el teclado) una credencial, muestra cuánto le falta para llegar
 * a la meta o cuánto se pasó. Se lee del dataset de la ficha para que las horas
 * en vivo de SofiaPlus, que reemplazan la insignia, también cuenten.
 */

type HoursKind = 'ok' | 'low' | 'none';

interface HoursHint {
  main: string;
  kind: HoursKind;
}

const HOURS_FORMAT = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 });

let grid: HTMLElement | null = null;
let hint: HTMLElement | null = null;
let hintMain: HTMLElement | null = null;
let hintWho: HTMLElement | null = null;
let hovered: HTMLElement | null = null;

function formatHours(value: number): string {
  return HOURS_FORMAT.format(value);
}

function describeHours(hours: string): HoursHint {
  const value = parseHoursValue(hours);
  if (hours.trim() === '' || !Number.isFinite(value)) {
    return { main: 'Sin horas registradas', kind: 'none' };
  }

  // Dos decimales bastan para comparar: evita que un residuo flotante convierta
  // un carnet que está justo en la meta en "se pasó" por una milésima.
  const difference = Math.round((HOURS_THRESHOLD - value) * 100) / 100;
  if (difference > 0) {
    return { main: `Faltan ${formatHours(difference)} h para las ${HOURS_THRESHOLD} h`, kind: 'low' };
  }
  if (difference < 0) {
    return { main: `Se pasó por ${formatHours(Math.abs(difference))} h de la meta de ${HOURS_THRESHOLD} h`, kind: 'ok' };
  }
  return { main: `Cumple la meta de ${HOURS_THRESHOLD} h`, kind: 'ok' };
}

function paint(card: HTMLElement): void {
  if (!hint || !hintMain || !hintWho) return;

  const identification = card.dataset.identification ?? '';
  const name = card.querySelector('.carnet-name')?.textContent?.trim() ?? '';
  const view = describeHours(card.dataset.hours ?? '');

  hintMain.textContent = view.main;
  hintWho.textContent = [identification ? `C.C. ${identification}` : '', name]
    .filter(Boolean)
    .join(' · ');
  hint.dataset.kind = view.kind;
  hint.hidden = false;
}

function clearHint(): void {
  hovered = null;
  if (hint) hint.hidden = true;
}

function cardFrom(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null;
  return target.closest<HTMLElement>('.carnet');
}

function isInside(card: HTMLElement, target: EventTarget | null): boolean {
  return target instanceof Node && card.contains(target);
}

// Repinta la pista si la insignia del carnet cambió mientras estaba enfocado.
export function refreshHoursHint(): void {
  if (!hovered) return;
  if (!hovered.isConnected || hovered.hidden) {
    clearHint();
    return;
  }
  paint(hovered);
}

// Al repintar el tablero las fichas anteriores dejan de existir: se oculta la
// pista para no quedarse mostrando datos de un carnet que ya no está en pantalla.
export function forgetHoursHint(): void {
  clearHint();
}

export function initHoursHint(elements: Pick<AppElements, 'cardsGrid' | 'playerHoursHint'>): void {
  grid = elements.cardsGrid;
  hint = elements.playerHoursHint;
  hintMain = hint?.querySelector<HTMLElement>('.player-hours-main') ?? null;
  hintWho = hint?.querySelector<HTMLElement>('.player-hours-who') ?? null;
  if (!grid || !hint || !hintMain || !hintWho) return;

  grid.addEventListener('pointerover', (event) => {
    const card = cardFrom(event.target);
    if (!card || card === hovered) return;
    hovered = card;
    paint(card);
  });

  grid.addEventListener('pointerout', (event) => {
    const card = cardFrom(event.target);
    if (!card || card !== hovered) return;
    if (isInside(card, event.relatedTarget)) return;
    clearHint();
  });

  grid.addEventListener('focusin', (event) => {
    const card = cardFrom(event.target);
    if (!card || card === hovered) return;
    hovered = card;
    paint(card);
  });

  grid.addEventListener('focusout', (event) => {
    const card = cardFrom(event.target);
    if (!card || card !== hovered) return;
    if (isInside(card, event.relatedTarget)) return;
    clearHint();
  });
}
