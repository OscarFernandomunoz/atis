/** Publica un fondo suave con la paleta institucional del SENA. */
export function initDynamicBackground(): void {
  const gradient = [
    'radial-gradient(100% 70% at 8% 0%, rgba(57, 169, 0, 0.09) 0%, transparent 74%)',
    'radial-gradient(90% 65% at 95% 0%, rgba(0, 120, 50, 0.06) 0%, transparent 76%)',
  ].join(', ');

  document.documentElement.style.setProperty('--app-gradient', gradient);
}
