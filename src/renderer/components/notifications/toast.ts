// Aviso flotante dentro de la app: respaldo cuando el computador no puede notificar.

// Tiempo que cada aviso permanece en pantalla antes de retirarse solo.
const AUTO_DISMISS_MS = 8000;
// Tope de avisos apilados; el más viejo cede su lugar al nuevo.
const MAX_VISIBLE = 3;
// Salida de la animación de retiro (ver `notice-out` en animations.css).
const EXIT_MS = 380;

const BELL_ICON = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 4.4a5.1 5.1 0 0 0-5.1 5.1v3.2L5.4 15.5h13.2l-1.5-2.8V9.5A5.1 5.1 0 0 0 12 4.4Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M10.2 18.1a2 2 0 0 0 3.6 0" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>';
const CLOSE_ICON = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

let stack: HTMLElement | null = null;

// El contenedor se crea al primer aviso para no dejar nodos vacíos en el HTML.
function noticeStack(): HTMLElement {
  if (stack?.isConnected) return stack;
  const container = document.createElement('div');
  container.className = 'notice-stack';
  container.setAttribute('role', 'status');
  container.setAttribute('aria-live', 'polite');
  document.body.append(container);
  stack = container;
  return container;
}

function buildNotice(title: string, body: string): HTMLElement {
  const notice = document.createElement('article');
  notice.className = 'notice';

  const icon = document.createElement('span');
  icon.className = 'notice-icon';
  icon.innerHTML = BELL_ICON;

  const text = document.createElement('div');
  text.className = 'notice-text';
  const heading = document.createElement('strong');
  heading.className = 'notice-title';
  heading.textContent = title;
  const message = document.createElement('p');
  message.className = 'notice-body';
  message.textContent = body;
  text.append(heading, message);

  const close = document.createElement('button');
  close.className = 'notice-close';
  close.type = 'button';
  close.setAttribute('aria-label', 'Cerrar aviso');
  close.innerHTML = CLOSE_ICON;

  notice.append(icon, text, close);
  return notice;
}

/**
 * Muestra un aviso flotante dentro de la app.
 *
 * Es el respaldo de las notificaciones del computador cuando el escritorio no
 * tiene servicio de notificaciones, para que un fallo de la automatización no
 * pase desapercibido.
 */
export function showInAppNotice(title: string, body: string): void {
  const container = noticeStack();
  while (container.children.length >= MAX_VISIBLE) container.firstElementChild?.remove();

  const notice = buildNotice(title, body);
  const dismiss = (): void => {
    notice.classList.add('notice-out');
    // Se retira del DOM al terminar la animación, sin dejarlo en el contenedor.
    setTimeout(() => notice.remove(), EXIT_MS);
  };

  // Cualquier clic sobre el aviso (o su equis) lo retira.
  notice.addEventListener('click', dismiss);
  setTimeout(dismiss, AUTO_DISMISS_MS);
  container.append(notice);
}
