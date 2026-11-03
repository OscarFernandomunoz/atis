// Activa directamente el enlace Instructores en el frame donde exista.
// La función se serializa con `.toString()` y se ejecuta dentro del portal.
export async function clickInstructorsOption(): Promise<boolean> {
  const controls = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href]'));
  const control = controls.find((anchor) => {
    const href = (anchor.getAttribute('href') ?? '').replace(/\s+/g, '').toLocaleLowerCase();
    const label = (anchor.textContent ?? '').replace(/\s+/g, ' ').trim().toLocaleLowerCase();
    return href === 'javascript:void(0)'
      && label === 'instructores'
      && anchor.getClientRects().length > 0;
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
  console.log(`[SofiaPlus] Enlace Instructores activado: ${control.outerHTML.slice(0, 300)}`);
  return true;
}
