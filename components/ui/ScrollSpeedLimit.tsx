'use client';

import { useScrollSpeedLimit } from '@/lib/motion/useScrollSpeedLimit';

/** Ativa o teto de velocidade da rolagem. Não renderiza nada. */
export function ScrollSpeedLimit() {
  useScrollSpeedLimit();
  return null;
}
