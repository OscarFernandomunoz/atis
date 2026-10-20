import type { ClickPoint } from '../../types.js';
import { CLICK_MARKER_STYLES } from './styles.js';

const MARKUP = `
  <span class="marker-ring"></span>
  <span class="marker-ping"></span>
  <span class="marker-h"></span>
  <span class="marker-v"></span>
  <span class="marker-dot"></span>
  <span class="marker-label">
    <span class="marker-caption"><i></i>Clic</span>
    <span class="marker-text"></span>
    <span class="marker-coords"></span>
  </span>
`;

/** Construye el script que se ejecuta dentro de la página de SofiaPlus. */
export function buildClickMarkerScript(point: ClickPoint, label: string): string {
  return `
    (() => {
      const id = '__sofiaDemoClickMarker__';
      const styleId = '__sofiaClickMarkerStyle__';
      const root = document.documentElement || document.body;

      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = ${JSON.stringify(CLICK_MARKER_STYLES)};
        (document.head || document.documentElement).appendChild(style);
      }

      let marker = document.getElementById(id);
      if (!marker) {
        marker = document.createElement('div');
        marker.id = id;
        root.appendChild(marker);
      }
      marker.removeAttribute('style');
      marker.innerHTML = ${JSON.stringify(MARKUP)};

      const x = ${point.x};
      const y = ${point.y};
      marker.style.left = x + 'px';
      marker.style.top = y + 'px';

      marker.querySelector('.marker-text').textContent = ${JSON.stringify(label)};
      marker.querySelector('.marker-coords').textContent = Math.round(x) + ' · ' + Math.round(y);

      // La etiqueta va debajo del punto (o encima si está cerca del borde inferior) para no
      // tapar el objetivo, y se desplaza lo justo para no salirse de la pantalla. Se usa el
      // ancho útil (sin barra de desplazamiento) para que no quede oculta bajo ella.
      const viewWidth = document.documentElement.clientWidth || window.innerWidth;
      const viewHeight = document.documentElement.clientHeight || window.innerHeight;
      const labelEl = marker.querySelector('.marker-label');
      const above = y > viewHeight - 100;
      labelEl.style.top = above ? 'auto' : '22px';
      labelEl.style.bottom = above ? '22px' : 'auto';
      labelEl.style.left = '0px';
      labelEl.style.transform = 'translateX(-50%)';
      const labelRect = labelEl.getBoundingClientRect();
      const margin = 8;
      let shift = 0;
      if (labelRect.left < margin) shift = margin - labelRect.left;
      else if (labelRect.right > viewWidth - margin) shift = (viewWidth - margin) - labelRect.right;
      if (shift !== 0) labelEl.style.transform = 'translateX(calc(-50% + ' + shift + 'px))';

      const ping = marker.querySelector('.marker-ping');
      ping.style.animation = 'none';
      void ping.offsetWidth;
      ping.style.animation = '';
      return true;
    })();
  `;
}
