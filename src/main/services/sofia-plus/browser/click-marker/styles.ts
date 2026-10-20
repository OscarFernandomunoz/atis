export const CLICK_MARKER_STYLES = `
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
`;
