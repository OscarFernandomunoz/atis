import { app } from 'electron';
import { join } from 'node:path';

/**
 * Resuelve una ruta absoluta dentro de la aplicación.
 *
 * Se parte de `app.getAppPath()` y no de `process.cwd()`: el directorio de
 * trabajo puede ser distinto del proyecto (o estar manipulado) y la app debe
 * cargar siempre su propio preload, HTML e imágenes, no archivos ajenos.
 */
export function appFile(...segments: string[]): string {
  return join(app.getAppPath(), ...segments);
}
