// Columna de la que se extrae la cédula: la nómina puede traer cualquiera de los dos encabezados.
export const REQUIRED_COLUMN_NUMBER = 3;
export const REQUIRED_COLUMN_NAME = `Columna ${REQUIRED_COLUMN_NUMBER}`;
export const ALTERNATIVE_COLUMN_NAME = '# DE DOCUMENTO';
export const REQUIRED_COLUMN_NAMES = [REQUIRED_COLUMN_NAME, ALTERNATIVE_COLUMN_NAME];
export const REQUIRED_COLUMN_LABEL = `${REQUIRED_COLUMN_NAME} o ${ALTERNATIVE_COLUMN_NAME}`;
export const DROPZONE_HINT = 'Arrastra y suelta tu archivo de nómina aquí o haz clic para seleccionarlo.';
