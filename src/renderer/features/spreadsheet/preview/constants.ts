// Columna de la que se extrae la cédula: la nómina puede traer cualquiera de los dos encabezados.
const REQUIRED_COLUMN_NUMBER = 3;
export const REQUIRED_COLUMN_NAME = `Columna ${REQUIRED_COLUMN_NUMBER}`;
const ALTERNATIVE_COLUMN_NAME = '# DE DOCUMENTO';
export const REQUIRED_COLUMN_NAMES = [REQUIRED_COLUMN_NAME, ALTERNATIVE_COLUMN_NAME];
export const REQUIRED_COLUMN_LABEL = `${REQUIRED_COLUMN_NAME} o ${ALTERNATIVE_COLUMN_NAME}`;
// Columnas de fechas del contrato: la vista las resalta porque son la referencia
// temporal del servicio del instructor.
export const CONTRACT_DATE_COLUMN_NAMES = ['INICIO DEL CONTRATO', 'FECHA FIN DEL CONTRATO'];
// Nombres de los bloques mensuales: cada mes tiene 5 columnas de horas agrupadas
// bajo una celda combinada con el nombre. El índice es el mes del año (0 = enero).
export const MONTH_BLOCK_LABELS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
export const DROPZONE_HINT = 'Arrastra y suelta tu archivo de nómina aquí o haz clic para seleccionarlo.';
