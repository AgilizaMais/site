'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type MotionPreference = {
  /** true = animações desligadas (SO ou escolha manual). */
  reduced: boolean;
  /** null = seguindo o sistema. */
  override: boolean | null;
  /**
   * false durante os primeiros quadros, enquanto a preferência ainda não foi
   * lida do sistema. Nenhuma animação pode começar antes disto: sem essa
   * trava, quem pede movimento reduzido vê o reveal começar e ser cancelado.
   */
  resolved: boolean;
  toggle: () => void;
};

const STORAGE_KEY = 'jb:motion';
const Ctx = createContext<MotionPreference>({
  reduced: false,
  override: null,
  resolved: false,
  toggle: () => {},
});

/**
 * Script inline aplicado antes da pintura, evitando flash de animação
 * para quem escolheu movimento reduzido. Injetado no <head> pelo layout.
 */
export const motionBootScript = `(function(){try{
var s=localStorage.getItem('${STORAGE_KEY}');
var m=s==='reduced'||(s!=='full'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
if(m)document.documentElement.setAttribute('data-motion','reduced');
}catch(e){}})();`;

export function MotionPreferenceProvider({ children }: { children: React.ReactNode }) {
  const [systemReduced, setSystemReduced] = useState(false);
  const [override, setOverride] = useState<boolean | null>(null);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setSystemReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setSystemReduced(e.matches);
    mq.addEventListener('change', onChange);

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'reduced') setOverride(true);
    else if (stored === 'full') setOverride(false);

    setResolved(true);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const reduced = override ?? systemReduced;

  useEffect(() => {
    const root = document.documentElement;
    if (reduced) root.setAttribute('data-motion', 'reduced');
    else root.removeAttribute('data-motion');
  }, [reduced]);

  const toggle = useCallback(() => {
    setOverride((prev) => {
      const next = !(prev ?? systemReduced);
      localStorage.setItem(STORAGE_KEY, next ? 'reduced' : 'full');
      return next;
    });
  }, [systemReduced]);

  const value = useMemo(
    () => ({ reduced, override, resolved, toggle }),
    [reduced, override, resolved, toggle],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useMotionPreference = () => useContext(Ctx);
