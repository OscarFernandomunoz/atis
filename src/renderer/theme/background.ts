/**
 * Fondo ambiental dinámico.
 *
 * En cada arranque se compone un degradado distinto inspirado en YouTube Music:
 * sobre una base negra flotan focos de color difuminados, sesgados hacia la
 * parte superior como el encabezado de la app. El resultado se publica en la
 * variable CSS `--app-gradient` y es el CSS quien decide dónde pintarlo
 * (`body::before`); así este módulo no depende del layout ni del tema activo.
 */

/** Familias de tono base; cada foco se deriva de una de ellas con leves desvíos. */
const BASE_HUES = [0, 14, 32, 190, 212, 262, 288, 330] as const;

/**
 * Centros horizontales que se reparten entre los focos: uno a cada lado y uno
 * al centro. Así el color cubre todo el ancho en lugar de amontonarse a un lado.
 */
const HORIZONTAL_ANCHORS = [8, 50, 92] as const;

interface Blob {
  /** Centro horizontal en porcentaje del viewport. */
  x: number;
  /** Centro vertical en porcentaje del viewport (negativo = por encima del borde). */
  y: number;
  /** Radio horizontal del foco en porcentaje; ancho para alcanzar los bordes. */
  radiusX: number;
  /** Radio vertical del foco en porcentaje. */
  radiusY: number;
  /** Punto (relativo al radio) donde el color termina de desvanecerse. */
  fadeStop: number;
  /** Tono final, ya desplazado respecto de la familia elegida. */
  hue: number;
  /** Opacidad del color sobre el negro; baja para que el negro siga dominando. */
  alpha: number;
}

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomInRange(min, max + 1));
}

/** `noUncheckedIndexedAccess` obliga a cubrir el índice fuera de rango. */
function pick<T>(values: readonly T[]): T {
  return values[randomInt(0, values.length - 1)] as T;
}

/** Copia desordenada de los anclajes para que la posición no sea siempre la misma. */
function shuffledAnchors(): number[] {
  const anchors: number[] = [...HORIZONTAL_ANCHORS];
  for (let i = anchors.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i);
    const current = anchors[i] as number;
    anchors[i] = anchors[j] as number;
    anchors[j] = current;
  }
  return anchors;
}

function createBlobs(): Blob[] {
  const baseHue = pick(BASE_HUES);

  return shuffledAnchors().map((anchor) => ({
    x: anchor + randomInt(-6, 6),
    y: randomInt(-14, 42),
    radiusX: randomInt(95, 150),
    radiusY: randomInt(55, 95),
    fadeStop: randomInt(72, 90),
    hue: (baseHue + randomInt(-60, 60) + 360) % 360,
    alpha: Number(randomInRange(0.14, 0.26).toFixed(2)),
  }));
}

function blobToLayer(blob: Blob): string {
  const color = `hsl(${blob.hue} 88% 52% / ${blob.alpha})`;
  return `radial-gradient(${blob.radiusX}% ${blob.radiusY}% at ${blob.x}% ${blob.y}%, ${color} 0%, transparent ${blob.fadeStop}%)`;
}

/** Compone los focos; el negro de base lo aporta `background-color` en el CSS. */
export function createRandomBackground(): string {
  return createBlobs().map(blobToLayer).join(', ');
}

/** Publica el degradado en el documento; se llama una sola vez al iniciar. */
export function initDynamicBackground(): void {
  document.documentElement.style.setProperty('--app-gradient', createRandomBackground());
}
