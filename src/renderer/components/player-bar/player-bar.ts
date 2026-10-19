import type { AppElements } from '../../types.js';
import { setPlayerProgress } from './progress.js';
import { setPlayerState } from './state.js';
import { setPlayerTrack } from './track.js';

// Deja la barra en reposo al arrancar: play disponible, sin cédula y progreso en cero.
export function initPlayerBar(elements: Pick<
  AppElements,
  'playButton' | 'playerIdentification' | 'playerInstructorName' | 'playerProgressCurrent' | 'playerProgressTotal' | 'playerTrack' | 'playerProgressFill'
>): void {
  setPlayerState(elements, 'idle');
  setPlayerTrack(elements, null);
  setPlayerProgress(elements, 0, 0);
}
