"use client";

import { MotionToggle } from "./MotionToggle";

/**
 * Controle de exibição: movimento.
 *
 * É acessibilidade, não conveniência — precisa existir em todo viewport.
 * Estava dentro do bloco `md:flex` da navbar e sumia no celular junto com os
 * links de navegação.
 *
 * É renderizado duas vezes, com visibilidade exclusiva por breakpoint: na
 * navbar no desktop, e num agrupamento fixo no mobile. `display: none` não é
 * exposto à árvore de acessibilidade, então não há controle duplicado para
 * leitores de tela.
 */
export function Controls({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`items-center ${compact ? "gap-3.5" : "gap-5"} ${className}`}
    >
      <MotionToggle compact={compact} />
    </div>
  );
}
