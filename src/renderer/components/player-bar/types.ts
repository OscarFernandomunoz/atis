import type { AppElements } from '../../types.js';

// Piezas del DOM que necesita cada responsabilidad de la barra del reproductor.
export type PlayerButtonElements = Pick<AppElements, 'playButton'>;
export type PlayerTrackElements = Pick<AppElements, 'playerIdentification' | 'playerInstructorName'>;
export type PlayerProgressElements = Pick<
  AppElements,
  'playerProgressCurrent' | 'playerProgressTotal' | 'playerTrack' | 'playerProgressFill'
>;

// Estados visuales del botón de play durante la automatización.
export type PlayerState = 'idle' | 'loading' | 'success' | 'error';
