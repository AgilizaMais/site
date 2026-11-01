'use client';

import { useEffect, useState } from 'react';
import { brand, defaultWaMessage, nav, waLink } from '@/lib/content';
import { scrollBus } from '@/lib/motion/bus';
import { CloseIcon, InstagramIcon, MenuIcon, WhatsAppIcon } from './Icons';
import s from './Header.module.css';
import { asset } from '@/lib/asset';

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('inicio');

  useEffect(() => {
    let lastY = 0;
    return scrollBus.on(({ y }) => {
      setScrolled(y > 40);
      // esconde ao descer, mostra ao subir (fora do topo)
      if (Math.abs(y - lastY) > 6) {
        setHidden(y > lastY && y > 520);
        lastY = y;
      }
    });
  }, []);

  useEffect(() => {
    const sections = nav
      .map((n) => document.getElementById(n.id))
      .filter((el): el is HTMLElement => Boolean(el));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    sections.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = open ? 'hidden' : '';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <header
        className={`${s.header} ${scrolled ? s.scrolled : ''} ${hidden && !open ? s.hidden : ''}`}
      >
        <div className={s.inner}>
          <button
            className={s.menuBtn}
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={open}
            aria-controls="menu-mobile"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>

          <a href="#inicio" className={s.logo} aria-label={`${brand.name} — início`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset('/img/logo.webp')} alt={brand.name} width={600} height={386} />
          </a>

          <nav className={s.nav} aria-label="Principal">
            <ul>
              {nav.map((n) => (
                <li key={n.id}>
                  <a href={`#${n.id}`} className={active === n.id ? s.active : ''} aria-current={active === n.id ? 'true' : undefined}>
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <a
            href={waLink(defaultWaMessage)}
            className={s.wa}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Fale no WhatsApp"
          >
            <WhatsAppIcon size={20} />
            <span>Fale no WhatsApp</span>
          </a>
        </div>
      </header>

      <div id="menu-mobile" className={`${s.drawer} ${open ? s.drawerOpen : ''}`} aria-hidden={!open}>
        <nav aria-label="Menu">
          <ul>
            {nav.map((n, i) => (
              <li key={n.id} style={{ transitionDelay: open ? `${0.08 + i * 0.06}s` : '0s' }}>
                <a href={`#${n.id}`} onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}>
                  <span>{String(i + 1).padStart(2, '0')}</span>
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className={s.drawerFoot}>
          <a href={waLink(defaultWaMessage)} className="btn btn-wa" target="_blank" rel="noopener noreferrer" tabIndex={open ? 0 : -1}>
            <WhatsAppIcon size={20} /> {brand.whatsapp.display}
          </a>
          <a href={brand.instagram.url} target="_blank" rel="noopener noreferrer" className={s.ig} tabIndex={open ? 0 : -1}>
            <InstagramIcon /> {brand.instagram.handle}
          </a>
        </div>
      </div>
    </>
  );
}
