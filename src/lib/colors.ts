/**
 * Color palette — single source of truth for all color values.
 *
 * CSS variables in globals.css must mirror these values.
 * Use these constants for any JS-side inline styles or dynamic color logic.
 * For static Tailwind classes, use the CSS-variable-based utilities instead
 * (bg-background, bg-nav-bg, bg-card-bg, bg-accent, text-accent, border-accent, …).
 */

export const colors = {
  // Accent — same in both themes
  accent: '#e07b35',

  // Dark theme (default)
  dark: {
    background: '#1c2440',
    navBg: '#2a3555',
    cardBg: '#121e2f',
    foreground: '#e8edf3',
    cardBorder: '#1e3048',
  },

  // Light theme
  light: {
    background: '#f4f6f9',
    navBg: '#1e2d40',
    cardBg: '#ffffff',
    foreground: '#0d1927',
    cardBorder: '#d1d9e0',
  },
} as const;
