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
  { index: 0, label: 'Enero', image: 'images/landscapes/enero.jpg' },
  { index: 1, label: 'Febrero', image: 'images/landscapes/febrero.jpg' },
  { index: 2, label: 'Marzo', image: 'images/landscapes/marzo.jpg' },
  { index: 3, label: 'Abril', image: 'images/landscapes/abril.jpg' },
  { index: 4, label: 'Mayo', image: 'images/landscapes/mayo.jpg' },
  { index: 5, label: 'Junio', image: 'images/landscapes/junio.jpg' },
  { index: 6, label: 'Julio', image: 'images/landscapes/julio.jpg' },
  { index: 7, label: 'Agosto', image: 'images/landscapes/agosto.jpg' },
  { index: 8, label: 'Septiembre', image: 'images/landscapes/septiembre.jpg' },
  { index: 9, label: 'Octubre', image: 'images/landscapes/octubre.jpg' },
  { index: 10, label: 'Noviembre', image: 'images/landscapes/noviembre.jpg' },
  { index: 11, label: 'Diciembre', image: 'images/landscapes/diciembre.jpg' },
];
