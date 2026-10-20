// Búsqueda por nombre, documento o programa. Se normaliza para ignorar
// mayúsculas y acentos, así "jose" también encuentra a "José".
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

export function bindSearch(input: HTMLInputElement, onQuery: (query: string) => void): void {
  // Se reasignan en cada render para no acumular listeners al repintar.
  input.oninput = (): void => { onQuery(normalizeText(input.value)); };
  // Escape limpia el buscador aunque el navegador no dispare "input".
  input.onkeydown = (event): void => {
    if (event.key === 'Escape' && input.value !== '') {
      input.value = '';
      onQuery('');
    }
  };
}
