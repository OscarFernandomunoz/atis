import { createInstructorCard } from './card.js';
import { buildProgramFilter } from './filter.js';
import { effectiveHours, hoursKind } from './hours.js';
import { buildHoursFilter, type HoursFilter } from './hours-filter.js';
import { FALLBACK_COLOR, programColors } from './palette.js';
import { parseInstructors } from './parse.js';
import { forgetCardReveal, revealCards } from './reveal.js';
import { forgetInstructors, rememberInstructors } from './roster.js';
import { bindSearch, normalizeText } from './search.js';
import { bindSelection, refreshSelectAll, resetSelection, selectedIdentifications } from './selection.js';

// Partes del tablero de carnets que el render necesita tocar.
export interface CardBoard {
  grid: HTMLElement;
  programFilter: HTMLElement;
  hoursFilter: HTMLElement;
  search: HTMLInputElement;
  selectAll: HTMLInputElement;
  count: HTMLElement;
  empty: HTMLElement;
}

// Reconstruye el tablero de carnets a partir de las filas de cada hoja del Excel.
// `onVisibleChange` recibe las cédulas que pasan los filtros y la selección de
// casillas (o `null` si no hay ningún filtro activo), para que la vista previa
// y la automatización usen ese subconjunto.
export function renderInstructorCards(
  board: CardBoard,
  sheets: unknown[][][],
  onVisibleChange?: (identifications: string[] | null) => void,
): void {
  const instructors = parseInstructors(sheets);
  // Deja el nombre a mano para que la barra del reproductor lo muestre al procesar cada cédula.
  rememberInstructors(instructors);
  const colors = programColors(instructors.map((instructor) => instructor.program));
  const cards = instructors.map((instructor) => createInstructorCard(
    instructor,
    colors.get(instructor.program) ?? FALLBACK_COLOR,
  ));
  board.grid.replaceChildren(...cards);
  // La casilla "seleccionar todo" actúa sobre las credenciales visibles de cada filtro.
  // Al marcar una casilla se repinta el filtro para que la vista previa muestre solo lo marcado.
  bindSelection(board.grid, board.selectAll, () => apply());

  const kinds = instructors.map((instructor) => hoursKind(effectiveHours(instructor)));
  const index = instructors.map((instructor) => normalizeText(
    `${instructor.name} ${instructor.identification} ${instructor.program}`,
  ));

  // Los tres filtros se combinan: programa + horas + búsqueda.
  let program: string | null = null;
  let hours: HoursFilter = 'all';
  let query = '';

  const apply = (): void => {
    let visible = 0;
    const visibleIdentifications = new Set<string>();
    cards.forEach((card, position) => {
      const shown = (program === null || card.dataset.program === program)
        && (hours === 'all' || kinds[position] === hours)
        && (query === '' || (index[position] ?? '').includes(query));
      card.hidden = !shown;
      if (shown) {
        visible += 1;
        const identification = instructors[position]?.identification;
        if (identification) visibleIdentifications.add(identification);
      }
    });
    board.empty.hidden = visible !== 0;
    board.count.textContent = visible === cards.length
      ? `${cards.length} ${cards.length === 1 ? 'instructor' : 'instructores'}`
      : `${visible} de ${cards.length} instructores`;
    const hasFilter = program !== null || hours !== 'all' || query !== '';
    // Las cédulas marcadas con la casilla son un filtro más de la vista previa:
    // solo se muestran las filas de lo seleccionado que además pasa los filtros.
    const selection = selectedIdentifications(board.grid);
    if (selection.size > 0) {
      onVisibleChange?.([...visibleIdentifications].filter((identification) => selection.has(identification)));
    } else {
      onVisibleChange?.(hasFilter ? [...visibleIdentifications] : null);
    }
    // Al cambiar los filtros, "seleccionar todo" se recalcula sobre las visibles.
    refreshSelectAll(board.grid, board.selectAll);
  };

  buildProgramFilter(board.programFilter, instructors.map((instructor) => instructor.program), (value) => {
    program = value;
    apply();
  });
  buildHoursFilter(board.hoursFilter, (value) => {
    hours = value;
    apply();
  });
  bindSearch(board.search, (value) => {
    query = value;
    apply();
  });
  apply();
  // La rejilla recién pintada entra en pantalla con la animación en cascada.
  revealCards(board.grid);
}

export function clearInstructorCards(board: CardBoard): void {
  forgetInstructors();
  forgetCardReveal(board.grid);
  resetSelection(board.grid, board.selectAll);
  board.grid.replaceChildren();
  board.programFilter.replaceChildren();
  board.programFilter.onclick = null;
  board.hoursFilter.onclick = null;
  board.search.value = '';
  board.count.textContent = '';
  board.empty.hidden = true;
}
