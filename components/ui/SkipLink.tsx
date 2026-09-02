import { isImplemented } from '@/lib/content/site';

/** Atalhos de teclado. Só aparecem no foco — e só apontam para o que existe. */
export function SkipLink() {
  return (
    <nav aria-label="Atalhos" className="sr-only focus-within:not-sr-only">
      <a
        href="#conteudo"
        className="fixed left-4 top-4 z-[100] rounded-full bg-accent px-5 py-3 text-sm font-medium text-bg"
      >
        Pular para o conteúdo
      </a>
      {isImplemented('agendar') && (
        <a
          href="#agendar"
          className="fixed left-56 top-4 z-[100] rounded-full bg-accent px-5 py-3 text-sm font-medium text-bg"
        >
          Ir direto para agendar
        </a>
      )}
    </nav>
  );
}
