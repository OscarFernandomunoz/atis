// Barra de fórmulas estilo Excel: nombre `fx` y caja de texto con el contenido
// crudo de la celda seleccionada (la fórmula tal cual, o el valor editable).

export interface FormulaBar {
  root: HTMLDivElement;
  input: HTMLInputElement;
  label: HTMLSpanElement;
}

export function createFormulaBar(): FormulaBar {
  const root = document.createElement('div');
  root.className = 'excel-formula-bar';
  const label = document.createElement('span');
  label.className = 'excel-formula-bar-fx';
  label.textContent = 'fx';
  const input = document.createElement('input');
  input.type = 'text';
  input.spellcheck = false;
  input.placeholder = 'Celda seleccionada: haz clic en una celda de la tabla.';
  input.setAttribute('aria-label', 'Contenido de la celda seleccionada');
  root.append(label, input);
  return { root, input, label };
}
