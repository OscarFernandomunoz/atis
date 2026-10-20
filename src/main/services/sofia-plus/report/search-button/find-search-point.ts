import type { ClickPoint } from '../../types.js';

// Solo UBICA el input "Consultar" (btnSearch) del diálogo de instructor y devuelve sus
// coordenadas: no hace clic. Sirve para marcar la esfera sin ejecutar la acción real.
//
// ⚠️ Se serializa con `.toString()` y se ejecuta dentro del portal: debe ser autocontenida.
export async function findInstructorSearchPoint(): Promise<ClickPoint | null> {
  // El control Consultar buscado vive SOLO en el iframe/modal del funcionario. Sin este
  // filtro, el mismo marco principal también devolvía match (input[value="Consultar"] del
  // formulario grande) y la esfera caía encima del botón equivocado.
  if (!/funcionario|modalFuncionario|fwk-webcommon/i.test(location.href + location.pathname)) {
    return null;
  }
  const SEARCH_INPUT_SELECTOR =
    'input[id$=":jbtnSearch"], input[id$=":btnSearch"], input[value="Consultar"]';
  const isUsable = (control: HTMLElement): boolean =>
    control.getClientRects().length > 0 && !control.hasAttribute('disabled');
  const searchScore = (control: HTMLElement): number => {
    const id = (control.id ?? '').toLowerCase();
    const matchesCapturedId = id.endsWith(':jbtnsearch') || id.endsWith(':btnsearch');
    if (!matchesCapturedId) return 0;
    return control.matches('input.btn.btn-info.btn-block') ? 130 : 100;
  };
  const candidates = Array.from(document.querySelectorAll<HTMLInputElement>(SEARCH_INPUT_SELECTOR))
    .filter(isUsable)
    .map((control) => ({ control, score: searchScore(control) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);
  const best = candidates[0]?.control;
  if (!best) return null;

  // El puntero visible lo dibuja el marcador centralizado en la ventana principal, así que
  // aquí solo se convierte el centro local del iframe a coordenadas de la ventana superior.
  const rect = best.getBoundingClientRect();
  let x = rect.left + rect.width / 2;
  let y = rect.top + rect.height / 2;
  let currentWindow: Window = window;
  while (currentWindow.frameElement) {
    const frameElement = currentWindow.frameElement;
    if (!frameElement) break;
    const frameRect = frameElement.getBoundingClientRect();
    x += frameRect.left + frameElement.clientLeft;
    y += frameRect.top + frameElement.clientTop;
    currentWindow = currentWindow.parent;
  }
  console.log(`[Reporte] Botón Consultar ubicado en el iframe. Centro global (${Math.round(x)}, ${Math.round(y)}).`);
  return { x, y };
}
