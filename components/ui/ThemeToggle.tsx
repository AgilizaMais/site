'use client';

import { useTheme } from '@/lib/theme/ThemeProvider';

/**
 * Alternador de tema — instrumento de avaliação, não parte do produto.
 * Sai quando a direção de arte decidir entre claro e escuro.
 */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={theme === 'light'}
      className={`font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-muted transition-colors duration-fast hover:text-text ${className}`}
    >
      <span className="sr-only">
        {theme === 'light' ? 'Usar tema escuro' : 'Usar tema claro'}
      </span>
      <span aria-hidden>{theme === 'light' ? 'tema: claro' : 'tema: escuro'}</span>
    </button>
  );
}
