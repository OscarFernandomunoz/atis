// Filtro por programa: pills que ocultan las credenciales de los demás programas.
export function buildProgramFilter(
  container: HTMLElement,
  programs: string[],
  applyFilter: (program: string | null) => void,
): void {
  const uniquePrograms = [...new Set(programs)];
  const options: Array<{ label: string; value: string | null }> = [
    { label: 'Todo', value: null },
    ...uniquePrograms.map((program) => ({ label: program, value: program })),
  ];

  const buttons = options.map(({ label, value }) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'program-chip';
    button.textContent = label;
    button.dataset.program = value ?? '';
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
    const target = (event.target as HTMLElement).closest<HTMLButtonElement>('.program-chip');
    if (!target) return;
    setActive(target);
    applyFilter(target.dataset.program || null);
  };

  const first = buttons[0];
  if (first) setActive(first);
  container.replaceChildren(...buttons);
}
