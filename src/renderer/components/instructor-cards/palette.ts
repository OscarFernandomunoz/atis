// Color por programa (paleta sin verdes): se reparte por orden de aparición,
// alternando fríos y cálidos para que programas consecutivos no se parezcan.
const PROGRAM_COLORS = [
  '#38bdf8', // celeste
  '#fb923c', // naranja
  '#a78bfa', // violeta
  '#fbbf24', // ámbar
  '#e879f9', // magenta
  '#60a5fa', // azul
  '#fb7185', // coral
  '#c084fc', // púrpura
  '#facc15', // amarillo
  '#818cf8', // índigo
] as const;

const FALLBACK_COLOR = '#60a5fa';

export function programColors(programs: string[]): Map<string, string> {
  const colors = new Map<string, string>();
  programs.forEach((program) => {
    if (colors.has(program)) return;
    colors.set(program, PROGRAM_COLORS[colors.size % PROGRAM_COLORS.length] ?? FALLBACK_COLOR);
  });
  return colors;
}
