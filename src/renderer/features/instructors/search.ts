// Búsqueda por nombre, documento o programa. Se normaliza para ignorar
// mayúsculas y acentos, así "jose" también encuentra a "José".

/** Pausa tras la última tecla antes de filtrar, en milisegundos. */
const SEARCH_DEBOUNCE_MS = 120;

export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

export function bindSearch(input: HTMLInputElement, onQuery: (query: string) => void): void {
  let timer: number | null = null;

  const clearTimer = (): void => {
    if (timer === null) return;
    window.clearTimeout(timer);
    timer = null;
  };

  // Se reasignan en cada render para no acumular listeners al repintar.
  input.oninput = (): void => {
    clearTimer();
    // Filtrar cientos de carnets en cada tecla corta la escritura; se espera a
    // que el usuario haga una pausa breve y se filtra una sola vez.
    timer = window.setTimeout(() => {
      timer = null;
      onQuery(normalizeText(input.value));
    }, SEARCH_DEBOUNCE_MS);
  };
  // Escape limpia el buscador aunque el navegador no dispare "input", y no debe
  // esperar al debounce: la limpieza tiene que verse de inmediato.
  input.onkeydown = (event): void => {
    if (event.key === 'Escape' && input.value !== '') {
      clearTimer();
      input.value = '';
      onQuery('');
    }
  };
}
