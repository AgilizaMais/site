'use client';

import { MotionToggle } from './MotionToggle';
import { ThemeToggle } from './ThemeToggle';

/**
 * Controles de exibição: movimento e tema.
 *
 * O de movimento é acessibilidade, não conveniência — precisa existir em todo
 * viewport. Estavam os dois dentro do bloco `md:flex` da navbar e sumiam no
 * celular junto com os links de navegação.
 *
 * São renderizados duas vezes, com visibilidade exclusiva por breakpoint: na
 * navbar no desktop, e num agrupamento fixo no mobile. `display: none` não é
 * exposto à árvore de acessibilidade, então não há controle duplicado para
 * leitores de tela.
 */
export function Controls({
  className = '',
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={`items-center ${compact ? 'gap-3.5' : 'gap-5'} ${className}`}>
      <MotionToggle compact={compact} />
      <ThemeToggle compact={compact} />
    </div>
  );
}
