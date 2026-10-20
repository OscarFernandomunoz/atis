import type { BrowserWindow } from 'electron';
import type { ClickPoint } from '../types.js';

// Dibuja un puntero de precisión en la coordenada exacta donde se hará clic. El retículo
// (anillo + cruz + punto) está centrado en el punto medido, y la etiqueta se separa lo
// suficiente para no tapar el objetivo. Todo lleva pointer-events: none para no interferir
// con los clics de la automatización.
export async function showClickMarker(
  window: BrowserWindow,
  point: ClickPoint,
  label: string,
  demo = false,
): Promise<void> {
  const script = `
    (() => {
      const id = '__sofiaDemoClickMarker__';
      const styleId = '__sofiaClickMarkerStyle__';
      const root = document.documentElement || document.body;

      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = \`
          @keyframes sofiaClickIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes sofiaClickPing {
            0% { opacity: 0.85; transform: translate(-50%, -50%) scale(1); }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(2.5); }
          }
          #__sofiaDemoClickMarker__ {
            all: initial;
            position: fixed;
            z-index: 2147483647;
            width: 0;
            height: 0;
            pointer-events: none;
            animation: sofiaClickIn 180ms cubic-bezier(0.22, 1, 0.36, 1) both;
          }
          #__sofiaDemoClickMarker__ .marker-ring,
          #__sofiaDemoClickMarker__ .marker-ping {
            position: absolute;
            left: 0;
            top: 0;
            width: 22px;
            height: 22px;
            border-radius: 999px;
            transform: translate(-50%, -50%);
          }
          #__sofiaDemoClickMarker__ .marker-ring {
            border: 1.5px solid rgba(255, 255, 255, 0.95);
            box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.65), 0 0 16px rgba(191, 231, 205, 0.45);
          }
          #__sofiaDemoClickMarker__ .marker-ping {
            border: 1.5px solid rgba(191, 231, 205, 0.9);
            animation: sofiaClickPing 1.1s cubic-bezier(0.22, 1, 0.36, 1) 2;
          }
          #__sofiaDemoClickMarker__ .marker-h,
          #__sofiaDemoClickMarker__ .marker-v {
            position: absolute;
            left: 0;
            top: 0;
            background: rgba(255, 255, 255, 0.95);
            filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.85));
            transform: translate(-50%, -50%);
          }
          #__sofiaDemoClickMarker__ .marker-h { width: 18px; height: 1px; }
          #__sofiaDemoClickMarker__ .marker-v { width: 1px; height: 18px; }
          #__sofiaDemoClickMarker__ .marker-dot {
            position: absolute;
            left: 0;
            top: 0;
            width: 5px;
            height: 5px;
            border-radius: 999px;
            background: #ffffff;
            box-shadow: 0 0 0 1.5px rgba(0, 0, 0, 0.75), 0 0 8px rgba(0, 0, 0, 0.35);
            transform: translate(-50%, -50%);
          }
          #__sofiaDemoClickMarker__ .marker-label {
            position: absolute;
            display: flex;
            flex-direction: column;
            gap: 3px;
            box-sizing: border-box;
            width: max-content;
            max-width: 210px;
            padding: 7px 10px 8px;
            border: 1px solid rgba(255, 255, 255, 0.14);
            border-radius: 10px;
            background: linear-gradient(160deg, rgba(26, 26, 26, 0.95), rgba(0, 0, 0, 0.93));
            box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08);
            color: #f1f1ef;
            font-family: "Aptos", "Segoe UI", sans-serif;
            line-height: 1.3;
            -webkit-backdrop-filter: blur(14px) saturate(130%);
            backdrop-filter: blur(14px) saturate(130%);
          }
          #__sofiaDemoClickMarker__ .marker-caption {
            display: flex;
            align-items: center;
            gap: 5px;
            color: #a9a9a5;
            font-size: 8.5px;
            font-weight: 650;
            letter-spacing: 0.14em;
            line-height: 1;
            text-transform: uppercase;
          }
          #__sofiaDemoClickMarker__ .marker-caption i {
            width: 5px;
            height: 5px;
            border-radius: 999px;
            background: #bfe7cd;
            box-shadow: 0 0 0 3px rgba(191, 231, 205, 0.12);
          }
          #__sofiaDemoClickMarker__ .marker-text {
            color: #f1f1ef;
            font-size: 11px;
            font-weight: 600;
            letter-spacing: -0.01em;
          }
          #__sofiaDemoClickMarker__ .marker-coords {
            color: #8f8f8b;
            font-size: 9.5px;
            font-variant-numeric: tabular-nums;
            letter-spacing: 0.02em;
            line-height: 1;
          }
        \`;
        (document.head || document.documentElement).appendChild(style);
      }

      let marker = document.getElementById(id);
      if (!marker) {
        marker = document.createElement('div');
        marker.id = id;
        root.appendChild(marker);
      }
      marker.removeAttribute('style');
      marker.innerHTML = \`
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
      \`;

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
  try {
    await window.webContents.mainFrame.executeJavaScript(script);
  } catch {
    for (const frame of window.webContents.mainFrame.frames) {
      try { await frame.executeJavaScript(script); } catch { /* ignore */ }
    }
  }
  console.log(`[AIA][SofiaPlus] ${demo ? 'Modo demostración: no se ejecutó el clic; ' : 'Clic resaltado; '}posición (${point.x.toFixed(1)}, ${point.y.toFixed(1)}): ${label}`);
}

// Solo resalta el punto de la página, sin ejecutar ningún clic.
export async function markClickPoint(window: BrowserWindow, point: ClickPoint, label: string): Promise<void> {
  await showClickMarker(window, point, label);
}
