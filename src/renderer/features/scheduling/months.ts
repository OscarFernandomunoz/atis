// Paisajes de Colombia, uno por mes. `index` coincide con el mes del año: 0 = enero.
export interface MonthCard {
  /** Posición en el año: 0 = enero, 11 = diciembre. */
  index: number;
  /** Nombre del mes que se muestra en la franja. */
  label: string;
  /** Ruta de la fotografía, relativa a `index.html`. */
  image: string;
}

export const MONTHS: MonthCard[] = [
  { index: 0, label: 'Enero', image: 'images/landscapes/january.webp' },
  { index: 1, label: 'Febrero', image: 'images/landscapes/february.webp' },
  { index: 2, label: 'Marzo', image: 'images/landscapes/march.webp' },
  { index: 3, label: 'Abril', image: 'images/landscapes/april.webp' },
  { index: 4, label: 'Mayo', image: 'images/landscapes/may.webp' },
  { index: 5, label: 'Junio', image: 'images/landscapes/june.webp' },
  { index: 6, label: 'Julio', image: 'images/landscapes/july.webp' },
  { index: 7, label: 'Agosto', image: 'images/landscapes/august.webp' },
  { index: 8, label: 'Septiembre', image: 'images/landscapes/september.webp' },
  { index: 9, label: 'Octubre', image: 'images/landscapes/october.webp' },
  { index: 10, label: 'Noviembre', image: 'images/landscapes/november.webp' },
  { index: 11, label: 'Diciembre', image: 'images/landscapes/december.webp' },
];
