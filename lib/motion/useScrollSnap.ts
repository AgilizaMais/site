"use client";

import { useEffect } from "react";
import { useLenis } from "./SmoothScrollProvider";
import { useMotionPreference } from "./MotionPreferenceProvider";

/**
 * Pausa suave nos pontos de leitura — metade JS, metade CSS.
 *
 * Cada cena marca onde ela "descansa" com `data-snap`:
 *   · `start` — o topo da seção
 *   · `end`   — o fim do trilho, que é onde a copy termina de entrar
 *
 * **No toque quem cuida disso é o CSS** (`scroll-snap-type: y proximity`, em
 * `globals.css`). O Lenis roda com `syncTouch: false`, ou seja, o embalo do
 * dedo é o do sistema operacional: ele não passa pelo Lenis, que por isso não
 * sabe onde a rolagem vai parar e não tem como interferir. Já o motor de snap
 * do próprio navegador conversa com esse embalo por dentro do compositor. Era
 * essa a metade que faltava — e o celular é justamente onde o texto da Cena 2
 * passava batido.
 *
 * **Na roda do mouse quem cuida é este hook.** Aqui o Lenis é dono da rolagem
 * e mantém em `targetScroll` onde o embalo vai parar. Se um ponto de leitura
 * estiver entre onde estamos e esse destino, o destino passa a ser o ponto: a
 * rolagem desacelera para dentro do texto em vez de atravessá-lo.
 *
 * Olhar para a velocidade não funciona: num arremesso o scroll anda mais de
 * 800px por quadro e atravessa qualquer janela de aproximação numa única
 * atualização. E esperar o embalo terminar para então corrigir chega tarde —
 * a essa altura o texto já ficou para trás.
 *
 * Nada disso é ancoragem rígida. Depois de chegar ao ponto, o gesto seguinte o
 * "consome" e a rolagem segue livre; e ponto que ficou para trás nunca puxa de
 * volta.
 */

/** Fração da altura da tela dentro da qual o assentamento age. */
const WINDOW = 0.4;
/** Abaixo disto não vale mexer: o usuário já está no lugar. */
const DEAD_ZONE = 10;
/** Distância que conta como "chegou" ao ponto de leitura. */
const ARRIVED = 48;
/** Silêncio de entrada que caracteriza "o gesto acabou". */
const INPUT_QUIET_MS = 90;

/** Chegada desacelerada: o site encosta no ponto, não freia nele. */
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

function snapTargets(): number[] {
  const vh = window.innerHeight;
  const max = document.documentElement.scrollHeight - vh;

  return [...document.querySelectorAll<HTMLElement>("[data-snap]")]
    .map((el) => {
      const rect = el.getBoundingClientRect();
      const top = rect.top + window.scrollY;
      return el.dataset.snap === "end" ? top + rect.height - vh : top;
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

    let targets: number[] = [];
    let consumed: number[] = [];
    let quiet = 0;

    const refresh = () => {
      targets = snapTargets();
      consumed = consumed.filter((y) => targets.includes(y));
    };
    refresh();

    /**
     * Enquanto o embalo corre: se ele pretende parar depois de um ponto de
     * leitura que ainda não alcançamos, o destino vira o ponto.
     *
     * `programmatic: false` é o mesmo caminho que o Lenis usa para a roda do
     * mouse: a chegada tem a suavização da casa, e a rolada seguinte parte
     * daqui em vez de recomeçar do zero. A duração e a easing precisam vir
     * junto: sem `programmatic`, o Lenis não preenche nenhuma das duas por
     * conta própria e a animação não sai do lugar.
     */
    /**
     * Se o destino do embalo passa de um ponto de leitura que ainda não
     * alcançamos, o destino vira o ponto.
     *
     * `programmatic: false` é o mesmo caminho que o Lenis usa para a roda do
     * mouse: a chegada tem a suavização da casa, e a rolada seguinte parte
     * daqui em vez de recomeçar do zero. A duração e a easing precisam vir
     * junto: sem `programmatic`, o Lenis não preenche nenhuma das duas por
     * conta própria e a animação não sai do lugar.
     */
    const clamp = () => {
      const from = lenis.animatedScroll;
      const to = lenis.targetScroll;
      const direction = Math.sign(to - from);
      if (direction === 0) return;

      for (const target of targets) {
        if (consumed.includes(target)) continue;
        // Ponto já ultrapassado, ou destino ainda aquém dele: não é o caso.
        if ((target - from) * direction <= DEAD_ZONE) continue;
        if ((target - to) * direction >= 0) continue;

        lenis.scrollTo(target, {
          programmatic: false,
          duration: lenis.options.duration,
          easing: lenis.options.easing,
          lerp: lenis.options.lerp,
        });
        return;
      }
    };

    /** Rolagem que parou perto de um ponto: encosta no resto do caminho. */
    const settle = () => {
      const current = lenis.targetScroll;
      let best: number | null = null;
      for (const t of targets) {
        if (consumed.includes(t)) continue;
        if (best === null || Math.abs(t - current) < Math.abs(best - current))
          best = t;
      }
      if (best === null) return;

      const delta = Math.abs(best - current);
      if (delta < DEAD_ZONE || delta > window.innerHeight * WINDOW) return;

      lenis.scrollTo(best, {
        duration: Math.min(1.2, Math.max(0.55, delta / 900)),
        easing: easeOut,
        lock: false,
      });
    };

    /**
     * Um gesto novo sobre um ponto onde já chegamos o consome: a partir daí a
     * rolagem passa por ele sem resistência. É o que impede que a pausa vire
     * armadilha.
     */
    const onInput = () => {
      refresh();
      const here = lenis.animatedScroll;
      for (const t of targets) {
        if (Math.abs(t - here) <= ARRIVED && !consumed.includes(t))
          consumed.push(t);
      }
      /**
       * O ajuste é feito aqui, no próprio evento de roda, e não só no quadro
       * de animação: o Lenis acabou de mover o destino e a posição ainda não
       * saiu do lugar — é o instante mais confiável que existe. Num aparelho
       * que caiu para 10fps, um único passo de animação atravessa 2000px e o
       * ponto de leitura passaria despercebido.
       *
       * O listener do Lenis foi registrado antes deste (ele é construído
       * primeiro), então `targetScroll` já está atualizado quando chegamos.
       */
      clamp();
      window.clearTimeout(quiet);
      quiet = window.setTimeout(settle, INPUT_QUIET_MS);
    };

    /**
     * No toque o embalo é nativo e já terminou quando `scrollend` dispara —
     * não há o que frear. O que sobra é encostar: se o CSS deixou a rolagem
     * parada a poucos pixels de um ponto de leitura, o site fecha a
     * distância. Se o snap do navegador já resolveu, isto não faz nada.
     */
    const onScrollEnd = () => settle();

    lenis.on("scroll", clamp);
    window.addEventListener("wheel", onInput, { passive: true });
    window.addEventListener("touchstart", onInput, { passive: true });
    window.addEventListener("keydown", onInput);
    window.addEventListener("scrollend", onScrollEnd);
    window.addEventListener("resize", refresh);

    return () => {
      window.clearTimeout(quiet);
      lenis.off("scroll", clamp);
      window.removeEventListener("wheel", onInput);
      window.removeEventListener("touchstart", onInput);
      window.removeEventListener("keydown", onInput);
      window.removeEventListener("scrollend", onScrollEnd);
      window.removeEventListener("resize", refresh);
    };
  }, [lenisRef, reduced, resolved]);
}
