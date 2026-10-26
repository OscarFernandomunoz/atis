import type { BrowserWindow } from 'electron';
import { executeInFrames } from '../browser/index.js';
import { TITLE_BAR_HEIGHT } from '../../../../shared/index.js';
import { mainLogger } from '../../../logger.js';

// Quita los emojis del título: la tarjeta usa la tipografía de la app, que no los necesita.
function cleanStepTitle(stepTitle: string): string {
  return stepTitle
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/\uFE0F/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Muestra el contador de progreso del flujo dentro de la página de SofiaPlus.
export function showStepBanner(
  window: BrowserWindow,
  stepNumber: number,
  totalSteps: number,
  stepTitle: string,
): Promise<void> {
  const title = cleanStepTitle(stepTitle);
  const script = `
    (() => {
      const id = '__sofiaStepBanner__';
      const styleId = '__sofiaStepBannerStyle__';
      const root = document.body || document.documentElement;

      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = \`
          @keyframes sofiaBannerEnter {
            from { opacity: 0; transform: translateY(-6px) scale(0.985); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes sofiaBannerPulse {
            0%, 100% { opacity: 0.55; transform: scale(0.9); }
            50% { opacity: 1; transform: scale(1.1); }
          }
          @keyframes sofiaBannerShimmer {
            from { transform: translateX(-120%); }
            to { transform: translateX(320%); }
          }
          #__sofiaStepBanner__ {
            all: initial;
            position: fixed;
            top: ${TITLE_BAR_HEIGHT + 14}px;
            right: 14px;
            z-index: 2147483647;
            display: block;
            box-sizing: border-box;
            width: 320px;
            max-width: calc(100vw - 28px);
            padding: 13px 15px 14px;
            border: 1px solid rgba(255, 255, 255, 0.14);
            border-radius: 14px;
            background:
              radial-gradient(120% 100% at 0% 0%, rgba(170, 220, 241, 0.12) 0%, transparent 70%),
              linear-gradient(160deg, rgba(26, 26, 26, 0.94), rgba(0, 0, 0, 0.92));
            box-shadow: 0 20px 48px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.08);
            color: #f1f1ef;
            font-family: "Aptos", "Segoe UI", sans-serif;
            font-size: 13px;
            line-height: 1.35;
            pointer-events: none;
            user-select: none;
            -webkit-backdrop-filter: blur(18px) saturate(130%);
            backdrop-filter: blur(18px) saturate(130%);
            animation: sofiaBannerEnter 320ms cubic-bezier(0.22, 1, 0.36, 1) both;
          }
          #__sofiaStepBanner__ .top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            margin-bottom: 9px;
          }
          #__sofiaStepBanner__ .label {
            display: flex;
            align-items: center;
            gap: 7px;
            color: #a9a9a5;
            font-size: 10px;
            font-weight: 650;
            letter-spacing: 0.14em;
            line-height: 1;
            text-transform: uppercase;
          }
          #__sofiaStepBanner__ .dot {
            width: 6px;
            height: 6px;
            border-radius: 999px;
            background: #bfe7cd;
            box-shadow: 0 0 0 4px rgba(191, 231, 205, 0.12);
            animation: sofiaBannerPulse 1.8s ease-in-out infinite;
          }
          #__sofiaStepBanner__ .pct {
            padding: 3px 9px;
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.06);
            color: #f1f1ef;
            font-size: 10.5px;
            font-weight: 600;
            font-variant-numeric: tabular-nums;
            line-height: 1.2;
          }
          #__sofiaStepBanner__ .title {
            margin-bottom: 12px;
            color: #f1f1ef;
            font-size: 13.5px;
            font-weight: 600;
            letter-spacing: -0.01em;
          }
          #__sofiaStepBanner__ .track {
            position: relative;
            height: 4px;
            overflow: hidden;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.12);
          }
          #__sofiaStepBanner__ .fill {
            position: absolute;
            inset: 0 auto 0 0;
            overflow: hidden;
            border-radius: inherit;
            background: #f1f1ef;
            transition: width 420ms cubic-bezier(0.22, 1, 0.36, 1);
          }
          #__sofiaStepBanner__ .fill::after {
            position: absolute;
            inset: 0;
            width: 40%;
            background: linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.28), transparent);
            content: "";
            animation: sofiaBannerShimmer 1.6s linear infinite;
          }
        \`;
        (document.head || document.documentElement).appendChild(style);
      }

      let banner = document.getElementById(id);
      if (!banner) {
        banner = document.createElement('div');
        banner.id = id;
        root.appendChild(banner);
      }
      if (!banner.querySelector('[data-role="fill"]')) {
        banner.innerHTML = \`
          <div class="top">
            <span class="label"><span class="dot"></span><span data-role="label"></span></span>
            <span class="pct" data-role="pct"></span>
          </div>
          <div class="title" data-role="title"></div>
          <div class="track"><div class="fill" data-role="fill"></div></div>
        \`;
      }

      const step = ${stepNumber};
      const total = ${totalSteps};
      const pct = Math.round((step / total) * 100);

      banner.querySelector('[data-role="label"]').textContent = 'Paso ' + step + ' de ' + total;
      banner.querySelector('[data-role="pct"]').textContent = pct + '%';
      banner.querySelector('[data-role="title"]').textContent = ${JSON.stringify(title)};
      banner.querySelector('[data-role="fill"]').style.width = pct + '%';

      // Reinicia la entrada en cada paso para que el cambio se note.
      banner.style.animation = 'none';
      void banner.offsetWidth;
      banner.style.animation = '';
      return true;
    })();
  `;
  return executeInFrames<boolean>(window, script, Boolean, 5).then(() => {
    mainLogger.info('SofiaPlus', `Paso ${stepNumber}/${totalSteps}: ${title}`);
  });
}
