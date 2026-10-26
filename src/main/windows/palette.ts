// Paleta de la barra de título nativa, compartida por las opciones de ventana y por el
// script de cromo que se inyecta en las páginas remotas.
export const TITLE_BAR_THEME_COLORS = {
  light: { background: '#006b2e', text: '#f4fff1', border: '#006b2e' },
  dark: { background: '#006b2e', text: '#f4fff1', border: '#006b2e' },
} as const;

export const TITLE_BAR_OVERLAY_COLORS = {
  light: {
    color: TITLE_BAR_THEME_COLORS.light.background,
    symbolColor: TITLE_BAR_THEME_COLORS.light.text,
  },
  dark: {
    color: TITLE_BAR_THEME_COLORS.dark.background,
    symbolColor: TITLE_BAR_THEME_COLORS.dark.text,
  },
} as const;
