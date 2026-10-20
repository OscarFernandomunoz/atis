// Script que se inyecta en la página de SofiaPlus. Bloquea lo que no pasa por los eventos
// de mouse/teclado del proceso principal: rueda (desplazamiento), menú contextual,
// selección de texto y arrastre. Solo actúa sobre eventos reales del usuario; los eventos
// sintéticos que dispara la automatización (click(), dispatchEvent, etc.) pasan sin cambios.
export function patchUserInputScript(): string {
  return `(() => {
    if (window.__sofiaUserInputPatch) return true;
    window.__sofiaUserInputPatch = true;

    const block = (event) => {
      if (!event.isTrusted) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    };

    for (const type of [
      'wheel',
      'contextmenu',
      'dragstart',
      'dragenter',
      'dragover',
      'drop',
      'selectstart',
      'touchstart',
      'touchmove',
      'touchend',
    ]) {
      window.addEventListener(type, block, { capture: true, passive: false });
    }
    return true;
  })()`;
}
