import { selectedIdentifications } from './selection.js';
import { renderInstructorCards, type CardBoard, type CardRenderState } from './render.js';
import type { HoursFilter } from './hours-filter.js';

function currentState(board: CardBoard): CardRenderState {
  const activeProgram = board.programFilter.querySelector<HTMLButtonElement>(
    '.program-chip.is-active:not(.chip-new)',
  );
  const activeHours = board.hoursFilter.querySelector<HTMLButtonElement>('.hours-chip.is-active');
  const hours = activeHours?.dataset.hours;
  const validHours: HoursFilter[] = ['all', 'equal', 'low', 'over', 'none'];

  return {
    program: activeProgram?.dataset.program || null,
    hours: validHours.includes(hours as HoursFilter) ? hours as HoursFilter : 'all',
    newOnly: Boolean(board.programFilter.querySelector('.chip-new.is-active')),
    query: board.search.value,
    selectedIdentifications: selectedIdentifications(board.grid),
  };
}

export function refreshInstructorCards(
  board: CardBoard,
  sheets: unknown[][][],
  onVisibleChange: (identifications: string[] | null) => void,
): void {
  renderInstructorCards(board, sheets, onVisibleChange, currentState(board));
}
