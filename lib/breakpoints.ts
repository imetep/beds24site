/**
 * Breakpoint condivisi tra CSS e JS.
 * Speculari ai tokens CSS --bp-* in app/globals.css.
 *
 * Uso JS:
 *   import { BREAKPOINTS } from '@/lib/breakpoints';
 *   const isDesk = window.innerWidth >= BREAKPOINTS.md;
 *
 * Uso CSS: @media (min-width: 768px) { ... }
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
} as const;
