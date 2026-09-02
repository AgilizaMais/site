'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Observa a entrada no viewport com margem generosa: o canvas é montado
 * uma tela antes de aparecer e pausado assim que sai.
 */
export function useInViewport<T extends HTMLElement>(rootMargin = '200%') {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(Boolean(entry?.isIntersecting)),
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);

  return { ref, inView };
}
