import type { FileElements } from '../excel-preview.js';
import { sameHeader } from './helpers.js';

// Realza las celdas "Horas Adicionales" en la vista previa HTML.
// Busca TODAS las celdas con el nombre "Horas Adicionales" por filas y columnas
// y las pinta de amarillo "pollito" sin importar el valor de horas.
export function colorHoursCellInPreview(elements: FileElements): void {
  // Color amarillo "pollito" para TODAS las celdas "Horas Adicionales"
  const background = '#ffff00';
  const textColor = '#000000';

  // ==========================================
  // PASO 0: ALERTA INMEDIATA - Para asegurar que SÍ vemos que se ejecuta
  // ==========================================
  setTimeout(() => {
    alert('[EXCEL] *** FUNCION INICIANDO ***\n\n'
      + 'Si ves esta alerta, la función se ejecutó correctamente.\n'
      + 'Revisa también la segunda alerta con el resultado.');

    // ==========================================
    // PASO 1: Verificar el elemento preview
    // ==========================================
    console.log('[EXCEL] Paso 1: Verificando elemento preview...');
    console.log('[EXCEL] elements.excelPreview existe:', !!elements.excelPreview);

    // Mostrar en alerta el contenido HTML del preview (o que tiene)
    const htmlPreview = elements.excelPreview.innerHTML ? 
      elements.excelPreview.innerHTML.substring(0, 300) : 'VACÍO/NULL';
    alert('[EXCEL] Contenido HTML del preview (primeros 300 chars):\n' + htmlPreview);

    // ==========================================
    // PASO 2: Buscar tablas
    // ==========================================
    const tables = elements.excelPreview.querySelectorAll('table') as unknown as HTMLTableElement[];
    alert('[EXCEL] Total tablas encontradas en preview: ' + tables.length);

    if (tables.length === 0) {
      console.log('[EXCEL] No hay tablas aún - el preview puede cargándose');
      alert('[EXCEL] No hay tablas en el preview aún.\n'
        + 'Esto puede ser normal si acabas de subir el archivo.\n'
        + 'Intenta esperar un momento y vuelva a subir.');
      return;
    }

    // ==========================================
    // PASO 3: Recorrer todas las celdas
    // ==========================================
    let totalCeldas = 0;
    let encontradas = 0;
    const muestras: string[] = [];

    for (let t = 0; t < tables.length; t++) {
      const table: HTMLTableElement = tables[t]!;
      // Obtener filas del thead (usando tipo adecuado)
      const headRows: HTMLTableRowElement[] = table.tHead ? Array.from(table.tHead.rows) : [];
      // Obtener filas del tbody (usando tipo adecuado)
      const bodyRows: HTMLTableRowElement[] = table.tBodies[0] ? Array.from(table.tBodies[0].rows) : [];
      const allRows: HTMLTableRowElement[] = [...headRows, ...bodyRows];

      for (let r = 0; r < allRows.length; r++) {
        const row = allRows[r];
        if (!row) continue;

        const celdas = row.cells;
        totalCeldas += celdas.length;

        for (let c = 0; c < celdas.length; c++) {
        const cell = celdas[c];
        if (!cell) continue;
        totalCeldas++;
        const texto = (cell.textContent || '').trim();

          // Guardar muestra (primeras 10)
          if (muestras.length < 10) {
            muestras.push('Fila=' + r + ' Col=' + c + ':"' + texto + '"');
          }

          // Verificar coincidencia con "Horas Adicionales"
          if (sameHeader(texto, 'Horas Adicionales')) {
            encontradas++;
            // Aplicar color amarillo "pollito"
            cell.style.backgroundColor = background;
            cell.style.color = textColor;
            cell.style.fontWeight = '700';
          }
        }
      }
    }

    // ==========================================
    // PASO 4: Alerta FINAL CON TODO EL RESULTADO
    // ==========================================
    const msgMuestras = muestras.join('\n');
    alert('[EXCEL] *** RESULTADO FINAL ***\n\n'
      + 'Total celdas revisadas: ' + totalCeldas + '\n'
      + 'Celdas "Horas Adicionales" encontradas: ' + encontradas + '\n\n'
      + 'Muestras de textos de celdas (primeras 10):\n' + msgMuestras + '\n\n'
      + 'Si el número es 0, revisa los textos de arriba.');

    console.log('[EXCEL] FIN - Total celdas revisadas: ' + totalCeldas + ', encontradas: ' + encontradas);
  }, 500); // Retraso de 500ms para asegurar que el preview esté cargado
}