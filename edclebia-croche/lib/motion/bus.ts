/**
 * Barramento mínimo entre o scroll (Lenis) e quem precisa reagir a ele
 * (motores WebGL, header). Evita contexto React em caminho quente.
 */
type ScrollInfo = { y: number; velocity: number; direction: number };
type Listener = (s: ScrollInfo) => void;

const listeners = new Set<Listener>();
let current: ScrollInfo = { y: 0, velocity: 0, direction: 1 };

export const scrollBus = {
  emit(s: ScrollInfo) {
    current = s;
    listeners.forEach((l) => l(s));
  },
  on(l: Listener) {
    listeners.add(l);
    l(current);
    return () => {
      listeners.delete(l);
    };
  },
  get: () => current,
};

/** Sinal de "intro concluída" (preloader → hero). */
type Fn = () => void;
const introListeners = new Set<Fn>();
let introDone = false;
export const introBus = {
  done() {
    if (introDone) return;
    introDone = true;
    introListeners.forEach((f) => f());
  },
  on(f: Fn) {
    if (introDone) f();
    else introListeners.add(f);
    return () => {
      introListeners.delete(f);
    };
  },
  isDone: () => introDone,
};

/** Acesso ao Lenis para rolagens programáticas (menu, CTAs). */
type Scroller = (target: string | HTMLElement, opts?: { offset?: number }) => void;
let scroller: Scroller | null = null;
export function setScroller(s: Scroller | null) {
  scroller = s;
}
export function scrollToTarget(target: string | HTMLElement, offset = 0) {
  if (scroller) scroller(target, { offset });
  else {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    el?.scrollIntoView({ behavior: 'smooth' });
  }
}
