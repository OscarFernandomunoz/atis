import type { SofiaAvailabilityEntry } from '../../../../shared/index.js';

// Pulsa el enlace «Ver Disponibilidad» de la primera fila consultada.
//
// ⚠️ Función autocontenida: se serializa con `.toString()` y se ejecuta dentro de la
// página de SofiaPlus; todo auxiliar va en el cuerpo de la función.
export function clickAvailabilityResult(): boolean {
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>(
    'a[id*="lstDisponibilidad"][id$=":detalleCL"]',
  ));
  const link = links.find((candidate) => candidate.id.includes(':lstDisponibilidad:0:detalleCL')
    && candidate.getClientRects().length > 0)
    ?? links.find((candidate) => candidate.getClientRects().length > 0
      && candidate.querySelector('img[alt="Ver Disponibilidad"]'));
  if (!link) {
    console.error('[Reporte] No se encontró el enlace Ver Disponibilidad (lstDisponibilidad:0:detalleCL).');
    return false;
  }

  console.log(`[Reporte] Abriendo enlace Ver Disponibilidad: id="${link.id}".`);
  link.focus();
  link.click();
  link.style.display = 'none';
  return true;
}

// Lee los bloques naranjas del calendario y conserva fecha y texto visible completo.
export function readOrangeAvailability(): SofiaAvailabilityEntry[] {
  const isOrange = (element: HTMLElement): boolean => {
    const color = getComputedStyle(element).backgroundColor;
    const channels = color.match(/[\d.]+/g)?.map(Number);
    if (!channels || channels.length < 3) return false;
    const [red = 0, green = 0, blue = 0] = channels;
    return red >= 180 && green >= 70 && green <= 200 && blue <= 110
      && red > green * 1.15 && green > blue * 1.35;
  };
  const textOf = (element: HTMLElement): string => (element.innerText || element.textContent || '')
    .split(/\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
  const getDate = (element: HTMLElement): string => {
    let current: HTMLElement | null = element;
    for (let depth = 0; current && depth < 9; depth += 1, current = current.parentElement) {
      const match = textOf(current).match(/\b\d{2}\/\d{2}\/\d{2,4}\b/);
      if (match) return match[0];
    }
    return '';
  };
  const getDurationMinutes = (details: string): number | null => {
    const match = details.match(/\b([01]?\d|2[0-3]):([0-5]\d)\s*[-–—]\s*([01]?\d|2[0-3]):([0-5]\d)\b/);
    if (!match) return null;
    const startHour = Number(match[1]);
    const startMinute = Number(match[2]);
    const endHour = Number(match[3]);
    const endMinute = Number(match[4]);
    let duration = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
    if (duration < 0) duration += 24 * 60;
    return duration;
  };

  const orangeBlocks = Array.from(document.querySelectorAll<HTMLElement>('body *')).filter((element) => {
    if (!isOrange(element) || element.getClientRects().length === 0 || !textOf(element)) return false;
    let parent = element.parentElement;
    while (parent && parent !== document.body) {
      if (isOrange(parent)) return false;
      parent = parent.parentElement;
    }
    return true;
  });
  const pointerLayerId = '__sofiaOrangeBlockPointers__';
  if (orangeBlocks.length > 0 && document.documentElement) {
    document.getElementById(pointerLayerId)?.remove();
    const pointerLayer = document.createElement('div');
    pointerLayer.id = pointerLayerId;
    pointerLayer.style.cssText = [
      'all:initial',
      'display:block',
      'position:fixed',
      'inset:0',
      'width:100vw',
      'height:100vh',
      'z-index:2147483646',
      'pointer-events:none',
    ].join(';');
    orangeBlocks.forEach((block, index) => {
      const rect = block.getBoundingClientRect();
      if (rect.bottom <= 0 || rect.right <= 0 || rect.top >= window.innerHeight || rect.left >= window.innerWidth) return;
      const marker = document.createElement('div');
      marker.style.cssText = [
        'all:initial',
        'position:absolute',
        `left:${Math.max(0, rect.left)}px`,
        `top:${Math.max(0, rect.top)}px`,
        'width:30px',
        'height:34px',
        'filter:drop-shadow(0 1px 2px rgba(0,0,0,.9))',
      ].join(';');
      const cursor = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      cursor.setAttribute('viewBox', '0 0 20 26');
      cursor.setAttribute('width', '20');
      cursor.setAttribute('height', '26');
      cursor.style.cssText = 'position:absolute;left:0;top:0;overflow:visible';
      const shape = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      shape.setAttribute('d', 'M1 1v20l5-5 4 8 3-2-4-8h7z');
      shape.setAttribute('fill', '#fff');
      shape.setAttribute('stroke', '#111');
      shape.setAttribute('stroke-width', '1.5');
      cursor.appendChild(shape);
      const number = document.createElement('span');
      number.textContent = String(index + 1);
      number.style.cssText = [
        'position:absolute',
        'left:14px',
        'top:18px',
        'min-width:16px',
        'height:16px',
        'padding:0 2px',
        'border-radius:999px',
        'background:#153c22',
        'border:1px solid #fff',
        'color:#fff',
        'font:600 10px/16px sans-serif',
        'text-align:center',
        'box-sizing:border-box',
      ].join(';');
      const durationMinutes = getDurationMinutes(textOf(block));
      const duration = document.createElement('span');
      duration.textContent = durationMinutes === null ? '— h' : `${durationMinutes / 60} h`;
      duration.style.cssText = [
        'position:absolute',
        'left:34px',
        'top:2px',
        'padding:3px 6px',
        'border-radius:999px',
        'background:#fff',
        'border:1px solid #a64b00',
        'color:#542600',
        'font:700 11px/1.2 sans-serif',
        'white-space:nowrap',
        'box-sizing:border-box',
      ].join(';');
      marker.append(cursor, number, duration);
      pointerLayer.appendChild(marker);
    });
    document.documentElement.appendChild(pointerLayer);
  }

  const entries = new Map<string, SofiaAvailabilityEntry>();
  orangeBlocks.forEach((block) => {
    const details = textOf(block);
    if (!details) return;
    const date = getDate(block);
    const entry: SofiaAvailabilityEntry = {
      date: date || 'Fecha no identificada',
      details,
      durationMinutes: getDurationMinutes(details),
    };
    // Algunos calendarios mantienen nodos visibles duplicados para una misma celda.
    // La fecha y el contenido identifican el bloque; así no se suma dos veces.
    const key = `${entry.date}\u0000${entry.details.toLocaleLowerCase()}`;
    entries.set(key, entry);
  });
  const result = [...entries.values()];
  if (result.length > 0) {
    const totalMinutes = result.reduce((total, entry) => total + (entry.durationMinutes ?? 0), 0);
    console.log(`[Reporte] Total de horas en bloques naranjas: ${totalMinutes / 60} horas.`);
  }
  return result;
}
