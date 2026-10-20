// Color por programa: los mismos pasteles que usa el carrusel de meses, repartidos
// por orden de aparición y alternando fríos y cálidos para que programas
// consecutivos no se parezcan. Se referencian por token (`tokens.css`) para no
// duplicar la paleta de la app en dos sitios.
const PROGRAM_COLORS = [
  'var(--pastel-1)', // rosa
  'var(--pastel-2)', // menta
  'var(--pastel-3)', // ámbar
  'var(--pastel-4)', // lavanda
  'var(--pastel-5)', // turquesa
  'var(--pastel-6)', // coral
  'var(--pastel-7)', // celeste
  'var(--pastel-8)', // oliva
  'var(--pastel-9)', // lila
  'var(--pastel-10)', // melocotón
  'var(--pastel-11)', // verde
  'var(--pastel-12)', // salmón
] as const;

/** Lavanda: el pastel que menos compite con los números de horas. */
export const FALLBACK_COLOR = 'var(--pastel-4)';

export function programColors(programs: string[]): Map<string, string> {
  const colors = new Map<string, string>();
  programs.forEach((program) => {
    if (colors.has(program)) return;
    colors.set(program, PROGRAM_COLORS[colors.size % PROGRAM_COLORS.length] ?? FALLBACK_COLOR);
  });
  return colors;
}
