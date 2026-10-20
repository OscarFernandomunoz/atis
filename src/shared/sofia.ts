/** Dominio del portal de SofiaPlus. */
const SOFIA_HOST = 'senasofiaplus.edu.co';

/** Partición aislada que usa la automatización del portal. */
export const SOFIA_PARTITION = 'sofia-automation';

/** URL base del portal. */
export const SOFIA_PUBLIC_URL = `http://${SOFIA_HOST}/sofia-public/`;

/**
 * Comprueba que una URL pertenezca realmente al dominio de SofiaPlus.
 *
 * No basta con buscar el texto en cualquier parte de la URL: una dirección
 * como `https://ejemplo.com/?senasofiaplus` también lo contiene. Se compara el
 * hostname exacto (o un subdominio) y se exige HTTP/HTTPS.
 */
export function isSofiaPlusUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    const host = url.hostname.toLowerCase();
    return host === SOFIA_HOST || host.endsWith(`.${SOFIA_HOST}`);
  } catch {
    return false;
  }
}

/**
 * ¿La ventana remota puede navegar a esta URL?
 *
 * `about:blank` se permite porque el portal crea ventanas emergentes vacías
 * antes de escribirles contenido; el resto debe ser del propio portal.
 */
export function isSofiaNavigationAllowed(raw: string): boolean {
  return raw === 'about:blank' || isSofiaPlusUrl(raw);
}
