'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type Theme = 'dark' | 'light';

type ThemeContext = {
  theme: Theme;
  /** false nos primeiros quadros, antes de a escolha salva ser lida. */
  resolved: boolean;
  toggle: () => void;
};

const STORAGE_KEY = 'jb:theme';
const Ctx = createContext<ThemeContext>({ theme: 'dark', resolved: false, toggle: () => {} });

/**
 * Aplicado antes da primeira pintura, para o fundo não piscar do escuro para o
 * claro. Injetado no <head> pelo layout.
 */
export const themeBootScript = `(function(){try{
var t=localStorage.getItem('${STORAGE_KEY}');
if(t==='light')document.documentElement.setAttribute('data-theme','light');
}catch(e){}})();`;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light') setTheme('light');
    setResolved(true);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') root.setAttribute('data-theme', 'light');
    else root.removeAttribute('data-theme');
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ theme, resolved, toggle }), [theme, resolved, toggle]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);

/**
 * Paleta que o WebGL usa.
 *
 * No tema escuro o desenho é LUZ sobre o preto, somada por blending aditivo.
 * No claro, é TINTA sobre o papel: as mesmas equações, mas com cores escuras e
 * composição normal. Trocar só os tokens de CSS deixaria as três cenas
 * invisíveis — aditivo sobre branco não escurece nada.
 */
export const GL_PALETTE = {
  dark: {
    light: '#fff8f1',
    accent: '#f97316',
    /**
     * `curve` é o expoente aplicado à cobertura antes de virar alpha.
     *
     * No aditivo a cor também crescia com a densidade, então a resposta era
     * praticamente quadrática — é dela que vêm os cruzamentos quentes e o
     * fundo bem escuro. Separar cor de cobertura tornou tudo linear, e a cena
     * clareou inteira; o expoente devolve o contraste original.
     */
    curve: 1.9,
    gain: 1.15,
    additive: true,
  },
  light: {
    light: '#1c1a15',
    accent: '#b3400d',
    /** Sobre papel a curva é mais suave: tinta rala demais some. */
    curve: 1.2,
    gain: 0.9,
    additive: false,
  },
} as const;
