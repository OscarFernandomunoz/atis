import type { PlayerTrackElements } from './types.js';

// Texto que se muestra cuando ninguna cédula está en ejecución.
const IDLE_LABEL = 'Sin instructor en curso';

// Muestra en la barra la cédula y el nombre de la persona que la automatización está
// consultando ahora mismo. El nombre se omite si el Excel no lo trae.
export function setPlayerTrack(
  elements: PlayerTrackElements,
  identification: string | null,
  name: string | null = null,
): void {
  elements.playerIdentification.textContent = identification ?? IDLE_LABEL;
  elements.playerInstructorName.textContent = identification && name ? ` · ${name}` : '';
}
