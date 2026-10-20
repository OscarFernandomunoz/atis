import { session } from 'electron';
import { SOFIA_PARTITION } from '../../../../shared/index.js';
import { closeSofiaPopups, closeSofiaWindow } from './window-loader.js';

// Deja la automatización desde cero: cierra la ventana del portal y borra todo lo que guardó
// (cookies, almacenamiento local, caché y credenciales). Se llama al empezar cada corrida y
// al terminar, tanto si salió bien como si falló, para que la siguiente vez siempre se
// empiece en la pantalla de login y no quede una sesión abierta.
export async function resetSofiaSession(): Promise<void> {
  // Primero se cierran las ventanas para que la página no alcance a escribir cookies nuevas
  // mientras se limpia la sesión.
  closeSofiaPopups();
  closeSofiaWindow();

  const sofiaSession = session.fromPartition(SOFIA_PARTITION);
  try {
    // Sin filtros: se limpia la partición completa, que solo usa la automatización.
    await sofiaSession.clearStorageData();
    await sofiaSession.clearCache();
    await sofiaSession.clearAuthCache();
  } catch (error) {
    console.warn('[AIA][SofiaPlus] No se pudo limpiar la sesión del portal.', error);
  }
}
