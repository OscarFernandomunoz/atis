import { HOURS_THRESHOLD } from '../excel-update/helpers.js';

// Filtro por horas: control segmentado independiente del filtro por programa.
export type HoursFilter = 'all' | 'ok' | 'low' | 'none';

const OPTIONS: Array<{ value: HoursFilter; label: string }> = [
  { value: 'all', label: 'Todas' },
  { value: 'ok', label: `≥ ${HOURS_THRESHOLD} h` },
  { value: 'low', label: `< ${HOURS_THRESHOLD} h` },
  { value: 'none', label: 'Sin horas' },
];

export function buildHoursFilter(container: HTMLElement, onFilter: (value: HoursFilter) => void): void {
  const buttons = OPTIONS.map(({ value, label }) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'hours-chip';
    button.dataset.hours = value;
    button.textContent = label;
    return button;
  });

  const setActive = (active: HTMLButtonElement): void => {
    buttons.forEach((button) => {
      const isActive = button === active;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
  };

  // Se asigna en cada render para no acumular listeners al repintar.
  container.onclick = (event): void => {
    const target = (event.target as HTMLElement).closest<HTMLButtonElement>('.hours-chip');
    if (!target) return;
    setActive(target);
    onFilter((target.dataset.hours ?? 'all') as HoursFilter);
  };

  const first = buttons[0];
  if (first) setActive(first);
  container.replaceChildren(...buttons);
}
