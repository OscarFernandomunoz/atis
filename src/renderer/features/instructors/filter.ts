// Filtro por programa: pills que ocultan las credenciales de los demás programas.
// Al final va el toggle "Nuevos": oculta a quien no entra en la ventana de aviso
// y se combina con los demás filtros, así que alterna y no excluye.
export function buildProgramFilter(
  container: HTMLElement,
  programs: string[],
  applyFilter: (program: string | null) => void,
  applyNewOnly?: (soloNuevos: boolean) => void,
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

  // El toggle de nuevos se identifica por dataset: su clic alterna su propio
  // estado (pressed) sin desactivar la pill de programa que esté activa.
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'program-chip chip-new';
  toggle.textContent = 'Nuevos';
  toggle.dataset.new = '1';
  buttons.push(toggle);

  const setActive = (active: HTMLButtonElement): void => {
    // Solo el grupo de programas es excluyente: el toggle "Nuevos" queda aparte,
    // así que al cambiar de programa no pierde su estado encendido.
    buttons.forEach((button) => {
      if (button === toggle) return;
      const isActive = button === active;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
  };

  // Al repintar, "Nuevos" arranca apagado (sin filtro combinado).
  toggle.setAttribute('aria-pressed', 'false');

  // Se asigna en cada render para no acumular listeners al repintar.
  container.onclick = (event): void => {
    const target = (event.target as HTMLElement).closest<HTMLButtonElement>('.program-chip');
    if (!target) return;
    if (target === toggle) {
      const activo = !toggle.classList.contains('is-active');
      toggle.classList.toggle('is-active', activo);
      toggle.setAttribute('aria-pressed', String(activo));
      applyNewOnly?.(activo);
      return;
    }
    setActive(target);
    applyFilter(target.dataset.program || null);
  };

  const first = buttons[0];
  if (first) setActive(first);
  container.replaceChildren(...buttons);
}
