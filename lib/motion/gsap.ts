'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CustomEase } from 'gsap/CustomEase';
import { EASE } from './easings';

let registered = false;

/**
 * Registro único de plugins e curvas. Chamado pelos providers no client.
 * lagSmoothing(0) mantém o ticker acoplado ao rAF real — necessário para
 * que Lenis, GSAP e R3F compartilhem o mesmo frame.
 */
export function registerGsap() {
  if (registered || typeof window === 'undefined') return gsap;
  gsap.registerPlugin(ScrollTrigger, CustomEase);
  CustomEase.create('outExpo', `M0,0 ${EASE.outExpo.join(',')} 1,1`);
  CustomEase.create('cine', `M0,0 ${EASE.cine.join(',')} 1,1`);
  CustomEase.create('outSoft', `M0,0 ${EASE.outSoft.join(',')} 1,1`);
  CustomEase.create('inQuiet', `M0,0 ${EASE.inQuiet.join(',')} 1,1`);
  gsap.ticker.lagSmoothing(0);
  gsap.defaults({ ease: 'outExpo' });
  ScrollTrigger.config({ ignoreMobileResize: true });
  registered = true;
  return gsap;
}

export { gsap, ScrollTrigger };
