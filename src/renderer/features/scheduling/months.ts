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
  { index: 0, label: 'Enero', image: 'images/landscapes/january.jpg' },
  { index: 1, label: 'Febrero', image: 'images/landscapes/february.jpg' },
  { index: 2, label: 'Marzo', image: 'images/landscapes/march.jpg' },
  { index: 3, label: 'Abril', image: 'images/landscapes/april.jpg' },
  { index: 4, label: 'Mayo', image: 'images/landscapes/may.jpg' },
  { index: 5, label: 'Junio', image: 'images/landscapes/june.jpg' },
  { index: 6, label: 'Julio', image: 'images/landscapes/july.jpg' },
  { index: 7, label: 'Agosto', image: 'images/landscapes/august.jpg' },
  { index: 8, label: 'Septiembre', image: 'images/landscapes/september.jpg' },
  { index: 9, label: 'Octubre', image: 'images/landscapes/october.jpg' },
  { index: 10, label: 'Noviembre', image: 'images/landscapes/november.jpg' },
  { index: 11, label: 'Diciembre', image: 'images/landscapes/december.jpg' },
];
