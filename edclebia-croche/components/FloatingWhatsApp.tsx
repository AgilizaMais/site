'use client';

import { useEffect, useState } from 'react';
import { defaultWaMessage, waLink } from '@/lib/content';
import { scrollBus } from '@/lib/motion/bus';
import { WhatsAppIcon } from './Icons';
import s from './FloatingWhatsApp.module.css';

export function FloatingWhatsApp() {
  const [show, setShow] = useState(false);
  useEffect(() => scrollBus.on(({ y }) => setShow(y > window.innerHeight * 0.55)), []);
  return (
    <a
      href={waLink(defaultWaMessage)}
      target="_blank"
      rel="noopener noreferrer"
      className={`${s.fab} ${show ? s.show : ''}`}
      aria-label="Encomendar pelo WhatsApp"
      tabIndex={show ? 0 : -1}
    >
      <span className={s.pulse} aria-hidden />
      <WhatsAppIcon size={30} />
      <span className={s.tip}>Encomende pelo WhatsApp</span>
    </a>
  );
}
