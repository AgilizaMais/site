'use client';

import { useEffect } from 'react';
import { useLenis } from './SmoothScrollProvider';
import { useMotionPreference } from './MotionPreferenceProvider';

/**
 * Pausa suave nos pontos de leitura.
 *
 * Cada cena marca onde ela "descansa" com `data-snap`:
 *   · `start` — o topo da seção
 *   · `end`   — o fim do trilho, que é onde a copy termina de entrar
 *
 * Quando o scroll cessa, se o ponto de leitura mais próximo estiver dentro de
 * uma janela, o site conduz o resto do caminho. Não é ancoragem rígida: o
 * usuário continua livre para parar onde quiser, e a janela é estreita o
 * bastante para não sequestrar o gesto — o que ela resolve é passar direto por
 * um texto que só termina de aparecer no fim do percurso.
 */

/** Fração da altura da tela dentro da qual o site conduz até o ponto. */
const WINDOW = 0.4;
/** Abaixo disto não vale mexer: o usuário já está no lugar. */
const DEAD_ZONE = 10;
/** Silêncio de scroll que caracteriza "parou". */
const IDLE_MS = 150;

function snapTargets(): number[] {
  const vh = window.innerHeight;
  const max = document.documentElement.scrollHeight - vh;

  return [...document.querySelectorAll<HTMLElement>('[data-snap]')]
    .map((el) => {
      const rect = el.getBoundingClientRect();
      const top = rect.top + window.scrollY;
      return el.dataset.snap === 'end' ? top + rect.height - vh : top;
    })
    .map((y) => Math.max(0, Math.min(max, Math.round(y))))
    .sort((a, b) => a - b);
}

export function useScrollSnap() {
  const lenisRef = useLenis();
  const { reduced, resolved } = useMotionPreference();

  useEffect(() => {
    const lenis = lenisRef?.current;
    if (!lenis || reduced || !resolved) return;

    let idle = 0;
    let interacting = false;
    let snapping = false;

    const settle = () => {
      if (interacting || snapping) return;

      const current = window.scrollY;
      const targets = snapTargets();
      if (targets.length === 0) return;

      let best = targets[0]!;
      for (const t of targets) {
        if (Math.abs(t - current) < Math.abs(best - current)) best = t;
      }

      const delta = Math.abs(best - current);
      if (delta < DEAD_ZONE || delta > window.innerHeight * WINDOW) return;

      snapping = true;
      lenis.scrollTo(best, {
        duration: 0.9,
        // Chegada desacelerada: o site encosta no ponto, não freia nele.
        easing: (t: number) => 1 - Math.pow(1 - t, 3),
        lock: false,
        onComplete: () => {
          snapping = false;
        },
      });
    };

    const onScroll = () => {
      if (snapping) return;
      window.clearTimeout(idle);
      idle = window.setTimeout(settle, IDLE_MS);
    };

    const hold = () => {
      interacting = true;
      snapping = false;
      window.clearTimeout(idle);
    };
    const release = () => {
      interacting = false;
      window.clearTimeout(idle);
      idle = window.setTimeout(settle, IDLE_MS);
    };

    lenis.on('scroll', onScroll);
    window.addEventListener('touchstart', hold, { passive: true });
    window.addEventListener('touchend', release, { passive: true });
    // Teclado e barra de rolagem também devem cancelar a condução em curso.
    window.addEventListener('keydown', hold);
    window.addEventListener('keyup', release);

    return () => {
      window.clearTimeout(idle);
      lenis.off('scroll', onScroll);
      window.removeEventListener('touchstart', hold);
      window.removeEventListener('touchend', release);
      window.removeEventListener('keydown', hold);
      window.removeEventListener('keyup', release);
    };
  }, [lenisRef, reduced, resolved]);
}
