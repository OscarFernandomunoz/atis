import { screen } from 'electron';

const PREFERRED_WIDTH = 1200;
const PREFERRED_HEIGHT = 800;

export interface SofiaWindowSize {
  width: number;
  height: number;
}

// Tamaño fijo de la ventana de la automatización. Se limita al área útil del monitor
// principal para que en pantallas pequeñas no quede parte de la ventana fuera del escritorio.
export function getSofiaWindowSize(): SofiaWindowSize {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  return {
    width: Math.min(PREFERRED_WIDTH, width),
    height: Math.min(PREFERRED_HEIGHT, height),
  };
}
