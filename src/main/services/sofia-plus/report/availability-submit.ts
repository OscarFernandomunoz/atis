// Pulsa el botón «Consultar Instructor» del formulario de disponibilidad.
//
// ⚠️ Función autocontenida: se serializa con `.toString()` y se ejecuta dentro de la
// página de SofiaPlus; todo auxiliar va en el cuerpo de la función.
export function clickAvailabilitySubmit(): boolean {
  const normalize = (value: string): string => value.trim().toLocaleLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const form = document.getElementById('formConsultarDisponibilidad');
  if (!form) {
    console.error('[Reporte] No se encontró el formulario Consultar Disponibilidad.');
    return false;
  }

  const button = Array.from(form.querySelectorAll<HTMLInputElement>('input'))
    .find((candidate) => {
      const label = normalize(candidate.value || candidate.getAttribute('aria-label') || '');
      const id = normalize(candidate.id);
      return (candidate.type === 'button' || candidate.type === 'submit')
        && id.endsWith(':consultardisponibilidad')
        && label === 'consultar instructor'
        && candidate.getClientRects().length > 0
        && !candidate.disabled;
    });
  if (!button) {
    console.error('[Reporte] No se encontró el botón visible Consultar Instructor.');
    return false;
  }

  console.log(`[Reporte] Pulsando Consultar Instructor: id="${button.id}".`);
  button.focus();
  button.click();
  return true;
}
