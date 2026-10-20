import type { PlayerProgressElements } from './types.js';

// Refleja el avance real: instructores procesados, total y ancho de la barra.
export function setPlayerProgress(elements: PlayerProgressElements, processed: number, total: number): void {
  const safeTotal = Math.max(0, Math.floor(total));
  const safeProcessed = Math.max(0, Math.min(Math.floor(processed), safeTotal));
  const percent = safeTotal > 0 ? Math.round((safeProcessed / safeTotal) * 100) : 0;

  elements.playerProgressCurrent.textContent = String(safeProcessed);
  elements.playerProgressTotal.textContent = String(safeTotal);
  elements.playerTrack.setAttribute('aria-valuemax', String(safeTotal));
  elements.playerTrack.setAttribute('aria-valuenow', String(safeProcessed));
  elements.playerProgressFill.style.width = `${percent}%`;
  elements.playerTrack.classList.toggle('is-active', safeProcessed > 0 && safeProcessed < safeTotal);
  elements.playerTrack.classList.toggle('is-complete', safeTotal > 0 && safeProcessed >= safeTotal);
}
