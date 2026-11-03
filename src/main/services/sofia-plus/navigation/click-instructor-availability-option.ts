// Activa el enlace Consultar Disponibilidad de Instructor en el frame del menú.
// La función se serializa con `.toString()` y se ejecuta dentro del portal.
export async function clickInstructorAvailabilityOption(): Promise<boolean> {
  const normalize = (value: string): string => value.replace(/\s+/g, ' ').trim().toLocaleLowerCase();
  const control = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href], a[id]'))
    .find((anchor) => {
      if (anchor.getClientRects().length === 0) return false;
      const href = (anchor.getAttribute('href') ?? '').toLocaleLowerCase();
      const id = (anchor.getAttribute('id') ?? '').toLocaleLowerCase();
      const label = normalize(anchor.textContent ?? '');
      return href.includes('consultardisponibilidadinstructor.faces')
        || id === '764211opcion'
        || label === 'consultar disponibilidad de instructor';
    });
  if (!control) return false;

  control.focus();
  const options: MouseEventInit = {
    bubbles: true,
    cancelable: true,
    view: window,
    button: 0,
    detail: 1,
  };
  control.dispatchEvent(new MouseEvent('mousedown', options));
  control.dispatchEvent(new MouseEvent('mouseup', options));
  control.click();
  console.log(`[SofiaPlus] Enlace de disponibilidad activado: ${control.outerHTML.slice(0, 400)}`);
  return true;
}
