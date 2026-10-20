import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import {
  GREEN_FILL,
  HOURS_COLUMN_NAME,
  HOURS_THRESHOLD,
  RED_FILL,
  hoursCellValue,
  isCedulaHeader,
  parseHoursValue,
  sameHeader,
} from '../helpers.js';

// Versión múltiple que conserva TODAS las filas del libro y solo escribe las horas de
// las cédulas consultadas. Es importante no filtrar: el archivo actualizado debe seguir
// mostrando a todos los instructores, no solo a los que se procesaron.
export async function rebuildFromRowsMultiple(
  data: ArrayBuffer,
  targets: Array<{ identification: string; totalHours: string }>,
): Promise<ArrayBuffer | null> {
  const source = XLSX.read(data, { type: 'array' });
  const out = new ExcelJS.Workbook();
  let updated = false;
  for (const sheetName of source.SheetNames) {
    const sheet = source.Sheets[sheetName];
    const rows = sheet ? XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' }) : [];
    const ws = out.addWorksheet(sheetName);
    ws.addRows(rows);
    for (const { identification, totalHours } of targets) {
      if (colorHoursCellInRows(ws, identification, totalHours)) updated = true;
    }
  }
  if (!updated) return null;
  return (await out.xlsx.writeBuffer()) as unknown as ArrayBuffer;
}

// Colorea la celda de horas en una fila específica.
function colorHoursCellInRows(
  ws: ExcelJS.Worksheet,
  cedula: string,
  hours: string,
): boolean {
  const value = parseHoursValue(hours);
  const fillArgb = Number.isFinite(value) && value < HOURS_THRESHOLD ? RED_FILL : GREEN_FILL;
  let cedulaCol = -1;
  let hoursCol = -1;
  ws.eachRow((row) => {
    if (cedulaCol !== -1 && hoursCol !== -1) return;
    row.eachCell((cell, colNumber) => {
      if (cedulaCol === -1 && isCedulaHeader(cell.text ?? '')) cedulaCol = colNumber;
      if (hoursCol === -1 && sameHeader(cell.text ?? '', HOURS_COLUMN_NAME)) hoursCol = colNumber;
    });
  });
  if (cedulaCol === -1 || hoursCol === -1) return false;
  let found = false;
  ws.eachRow((row) => {
    if (found) return;
    if ((row.getCell(cedulaCol).text ?? '').trim() === cedula.trim()) {
      const cell = row.getCell(hoursCol);
      cell.value = hoursCellValue(hours);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillArgb } };
      found = true;
    }
  });
  return found;
}
