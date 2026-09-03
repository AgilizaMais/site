"use client";

import { useEffect, useState } from "react";
import { m, useMotionValueEvent, useScroll } from "framer-motion";
import { isImplemented, nav, professional } from "@/lib/content/site";
import { Controls } from "./Controls";

/**
 * Quase invisível no topo; ganha vidro e hairline ao rolar.
 * Auto-hide ao descer além de 400px, reaparece ao subir.
 * docs/STYLE_GUIDE.md §5
 */
export function Navbar() {
  const { scrollY } = useScroll();
  const [solid, setSolid] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [last, setLast] = useState(0);

  useMotionValueEvent(scrollY, "change", (y) => {
    setSolid(y > window.innerHeight * 0.12);
    setHidden(y > 400 && y > last);
    setLast(y);
  });

  // Corrige o estado ao recarregar a página já rolada.
  useEffect(() => {
    setSolid(window.scrollY > window.innerHeight * 0.12);
  }, []);

  return (
    <m.header
      animate={{ y: hidden ? "-110%" : "0%" }}
      transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-x-0 top-0 z-50"
    >
      {/*
        Escurecimento sob a navbar, sempre presente.

        Ela flutua sobre o WebGL, e no topo da primeira tela as partículas
        chegam até a altura do nome e do controle de movimento. Sem este véu, a
        legibilidade da barra depende de onde a nuvem estiver naquele quadro —
        o que é o mesmo que não depender de nada. Ele é fraco o bastante para
        não virar uma faixa: some antes do fim da própria barra.
      */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[92px]"
        style={{
          background:
            "linear-gradient(to bottom, rgb(9 9 11 / 0.78) 0%, rgb(9 9 11 / 0.45) 55%, transparent 100%)",
        }}
      />
      <div className="relative">
        <div
          className={`border-b transition-all duration-base ease-out-expo ${
            solid
              ? "border-hairline bg-glass backdrop-blur-[14px] backdrop-saturate-150"
              : "border-transparent bg-transparent"
          }`}
        >
          <nav
            aria-label="Navegação principal"
            className="mx-auto flex h-[68px] max-w-content items-center justify-between u-margin-x"
          >
            <a href="#inicio" className="group flex items-baseline gap-2.5">
              <span className="text-[0.9375rem] font-medium tracking-[-0.01em]">
                {professional.name}
              </span>
              <span className="u-tabular font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-muted transition-colors duration-fast group-hover:text-text">
                {professional.crp}
              </span>
            </a>

            <div className="flex items-center gap-7">
              <ul className="hidden items-center gap-7 md:flex">
                {nav.links
                  .filter((link) => isImplemented(link.id))
                  .map((link) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        className="relative text-[0.875rem] text-muted transition-colors duration-fast hover:text-text after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-accent after:transition-all after:duration-fast after:ease-out-soft hover:after:w-full"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                <li>
                  <Controls className="flex" />
                </li>
              </ul>
              {isImplemented(nav.cta.id) && (
                <a
                  href={nav.cta.href}
                  className="rounded-full border border-hairline px-5 py-2 text-[0.875rem] transition-colors duration-fast ease-out-soft hover:border-accent-line hover:bg-surface/50"
                >
                  {nav.cta.label}
                </a>
              )}
            </div>
          </nav>
        </div>
      </div>
    </m.header>
  );
}
