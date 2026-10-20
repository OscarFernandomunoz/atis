import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const INCLUDE_DIRECTIVE = /^[ \t]*<!--\s*@include\s+(.+?)\s*-->[ \t]*$/gm;

/**
 * Expande las directivas `<!-- @include ruta -->` del HTML.
 * El HTML final se genera en `dist`, así que Electron sigue cargando un único archivo.
 */
function renderHtml(filePath: string, seen: Set<string> = new Set()): string {
  const absolutePath = resolve(filePath);

  if (seen.has(absolutePath)) {
    throw new Error(`Inclusión circular de HTML: ${absolutePath}`);
  }

  seen.add(absolutePath);
  const source = readFileSync(absolutePath, 'utf8');
  const rendered = source.replace(INCLUDE_DIRECTIVE, (_match: string, relativePath: string) => {
    const partialPath = resolve(dirname(absolutePath), relativePath);
    return renderHtml(partialPath, seen);
  });
  seen.delete(absolutePath);

  return rendered;
}

function copyHtml(rootDir: string, distRendererDir: string): void {
  const htmlSrc = resolve(rootDir, 'src/renderer/index.html');

  if (!existsSync(htmlSrc)) {
    return;
  }

  mkdirSync(distRendererDir, { recursive: true });
  writeFileSync(resolve(distRendererDir, 'index.html'), renderHtml(htmlSrc));
}

/** Copia el HTML renderizado, los estilos y las imágenes al directorio de distribución. */
export function copyStaticAssets(rootDir: string): void {
  const distRendererDir = resolve(rootDir, 'dist/renderer');
  const distImagesDir = resolve(distRendererDir, 'images');

  mkdirSync(distImagesDir, { recursive: true });
  copyHtml(rootDir, distRendererDir);

  const stylesSrc = resolve(rootDir, 'src/renderer/styles');
  if (existsSync(stylesSrc)) {
    cpSync(stylesSrc, resolve(distRendererDir, 'styles'), { recursive: true });
  }

  const logoSource = resolve(rootDir, 'public/images/logo.png');
  if (existsSync(logoSource)) {
    copyFileSync(logoSource, resolve(distImagesDir, 'logo.png'));
  }

  // Fotografías de paisajes que usa el carrusel de meses.
  const landscapesSrc = resolve(rootDir, 'public/images/landscapes');
  if (existsSync(landscapesSrc)) {
    cpSync(landscapesSrc, resolve(distImagesDir, 'landscapes'), { recursive: true });
  }
}
