/**
 * Tokens de design.
 *
 * No web não existia nada disso: `tailwind.config.js` tinha `theme.extend`
 * vazio e as cores da marca apareciam como hex literal em 27 `style={}` e ao
 * longo de 315 `className` (#16382c sozinho aparecia 14 vezes). Aqui elas
 * viram tokens, para que ajustar a identidade visual seja mudar um arquivo.
 *
 * Valores extraídos de _reference/meu-caixa.jsx.
 */

export const colors = {
  /* marca */
  primary: "#16382C",
  primaryDark: "#0F2E25",
  primaryLight: "#1E4A38",

  /* superfícies */
  bg: "#F1F4F2",
  surface: "#FFFFFF",
  surfaceMuted: "#F8FAF9",
  border: "#E2E8E5",

  /* texto */
  text: "#1E293B",
  textMuted: "#64748B",
  textSubtle: "#94A3B8",
  textOnPrimary: "#FFFFFF",

  /* semântico */
  income: "#059669",
  expense: "#D6493B",
  warning: "#E8873C",
  danger: "#D6493B",
};

/** Gradiente do cartão de destaque (hero), do web linha 828. */
export const heroGradient = [colors.primaryDark, colors.primary, colors.primaryLight];

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
};

export const font = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
};

/**
 * Alvo mínimo de toque. O web usava linhas densas com setas e checkboxes
 * pequenos, inviáveis no dedo — 44pt é o piso das diretrizes de iOS e Android.
 */
export const TOUCH_TARGET = 44;

export const shadow = {
  card: {
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  raised: {
    shadowColor: "#0F172A",
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
};
