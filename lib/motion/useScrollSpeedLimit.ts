'use client';

import { useEffect } from 'react';
import { useLenis } from './SmoothScrollProvider';
import { useMotionPreference } from './MotionPreferenceProvider';

/**
 * Teto de velocidade da rolagem.
 *
 * Não há pontos de parada, âncoras nem correção de posição: o site nunca
 * decide para onde o visitante vai, nem interrompe o gesto dele. A única coisa
 * que muda é o quanto de embalo um gesto pode acumular.
 *
 * O Lenis guarda em `targetScroll` para onde o embalo está indo e em
 * `animatedScroll` onde a página está agora. A diferença entre os dois — a
 * "dianteira" — é o que determina a velocidade: quanto mais longe o destino,
 * mais rápido o Lenis corre até ele. Limitar a dianteira é limitar a
 * velocidade, e é um ajuste contínuo, sem descontinuidade nenhuma: nada trava,
 * nada encosta, nada é ancorado.
 *
 * Rolar para ler não sente nada — a dianteira de um clique de roda fica muito
 * abaixo do teto. O que muda é o giro insistente, que antes acumulava embalo
 * sem limite e atravessava uma cena inteira num piscar.
 *
 * **Só vale para roda e trackpad.** No toque o Lenis roda com
 * `syncTouch: false`: o embalo é o do sistema operacional e não passa por ele,
 * então não há dianteira para limitar. Levar o teto para o celular exigiria
 * `syncTouch: true` — o Lenis assumiria a rolagem do dedo inteira, o que é uma
 * troca de sensação grande e uma decisão à parte.
 */

/**
 * Teto da dianteira, em frações da altura da tela.
 *
 * **É este o número a mexer para calibrar a sensação.** A conta que ele
 * governa, com a `duration` de 1.1s e a easing exponencial configuradas no
 * SmoothScrollProvider:
 *
 *     velocidade de pico ≈ dianteira × 6.31 por segundo
 *
 * (6.31 é a derivada da easing na origem dividida pela duração.) Em frações de
 * tela, o pico permitido é `MAX_LEAD × 6.31` telas por segundo:
 *
 *     0.25 → 1.6 telas/s   contido, quase deliberado
 *     0.35 → 2.2 telas/s   atual
 *     0.50 → 3.2 telas/s   solto
 *
 * Para comparar: um clique de roda sozinho vale ~100px de dianteira, ou seja
 * 0.7 tela/s numa tela de 900px — bem longe do teto, e portanto intocado. Sem
 * limite nenhum, o giro insistente estabiliza perto de 800px de dianteira na
 * roda (5.5 telas/s) e passa fácil de 2000px no trackpad (14 telas/s).
 */
const MAX_LEAD = 0.35;

export function useScrollSpeedLimit() {
  const lenisRef = useLenis();
  const { reduced, resolved } = useMotionPreference();

  useEffect(() => {
    const lenis = lenisRef?.current;
    if (!lenis || reduced || !resolved) return;

    /**
     * Roda logo depois de o Lenis somar o delta ao destino: o listener dele
     * foi registrado antes deste, porque a instância é construída primeiro.
     */
    const limit = (event: WheelEvent) => {
      const lead = lenis.targetScroll - lenis.animatedScroll;

      /**
       * O teto nunca trunca um gesto sozinho — só impede que gestos empilhem
       * embalo. Um mouse que manda o scroll em linhas ou em páginas, ou um
       * trackpad que entrega um delta grande de uma vez, pediu aquela
       * distância num movimento só: cortá-la seria o site engolindo a
       * rolagem, que é coisa bem pior do que ser rápido.
       */
      const step = Math.abs(
        event.deltaMode === 1
          ? event.deltaY * 40
          : event.deltaMode === 2
            ? event.deltaY * window.innerHeight
            : event.deltaY,
      );
      const max = Math.max(window.innerHeight * MAX_LEAD, step);
      if (Math.abs(lead) <= max) return;

      /**
       * `programmatic: false` é o mesmo caminho que o Lenis usa para a roda:
       * a chegada tem a suavização da casa, e o gesto seguinte parte daqui em
       * vez de recomeçar do zero. A duração e a easing precisam vir junto —
       * sem `programmatic`, o Lenis não preenche nenhuma das duas por conta
       * própria e a animação não sai do lugar.
       */
      lenis.scrollTo(lenis.animatedScroll + Math.sign(lead) * max, {
        programmatic: false,
        duration: lenis.options.duration,
        easing: lenis.options.easing,
        lerp: lenis.options.lerp,
      });
    };

    window.addEventListener('wheel', limit, { passive: true });
    return () => window.removeEventListener('wheel', limit);
  }, [lenisRef, reduced, resolved]);
}
