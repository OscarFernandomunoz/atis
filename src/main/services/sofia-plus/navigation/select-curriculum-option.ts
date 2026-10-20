// Selecciona la opción de Gestión Desarrollo Curricular dentro del menú desplegable o en controles visibles.
// (Sin helpers de módulo: la función se serializa con `.toString()` y se ejecuta dentro del portal.)
export async function selectCurriculumOption(): Promise<boolean> {
  const target = 'gestión desarrollo curricular';
  const normalize = (text: string): string => text.trim().toLocaleLowerCase();
  for (const select of Array.from(document.querySelectorAll<HTMLSelectElement>('select'))) {
    const option = Array.from(select.options).find((item) => normalize(item.textContent ?? '') === target);
    if (option && select.getClientRects().length > 0) {
      select.value = option.value;
      select.dispatchEvent(new Event('input', { bubbles: true }));
      select.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
  }
  const control = Array.from(document.querySelectorAll<HTMLElement>(
    'a, button, [role="menuitem"], [role="option"], li',
  )).find((element) => normalize(element.textContent ?? '') === target && element.getClientRects().length > 0);
  if (control) control.click();
  return Boolean(control);
}
