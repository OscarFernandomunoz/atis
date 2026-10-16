import type { PlayerButtonElements, PlayerState } from './types.js';

// La etiqueta accesible anuncia qué hace el play en cada estado del proceso.
const LABELS: Record<PlayerState, string> = {
  idle: 'Iniciar la automatización de SofiaPlus',
  loading: 'Automatización de SofiaPlus en curso',
  success: 'Automatización de SofiaPlus completada',
  error: 'La automatización falló. Intenta de nuevo',
};

// Cambia el glifo y la etiqueta del play: el CSS decide qué se ve según data-state.
export function setPlayerState(elements: PlayerButtonElements, state: PlayerState): void {
  const button = elements.playButton;
  if (!button) return;

  button.dataset.state = state;
  button.setAttribute('aria-label', LABELS[state]);
  button.setAttribute('aria-busy', state === 'loading' ? 'true' : 'false');
}
