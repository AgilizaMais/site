/**
 * Canal mínimo entre a UI e a cena WebGL. O R3F usa um reconciliador próprio,
 * então o contexto do React não atravessa o <Canvas> — um evento resolve isso
 * sem bridge nem estado global.
 */
const SKIP = 'jb:intro-skip';

export const skipIntro = () => window.dispatchEvent(new Event(SKIP));

export function onSkipIntro(handler: () => void) {
  window.addEventListener(SKIP, handler);
  return () => window.removeEventListener(SKIP, handler);
}
