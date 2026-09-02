# Fontes

O sistema tipográfico é **General Sans** (display) + **Satoshi** (UI) — ambas da Fontshare,
licença livre para uso comercial.

Este ambiente de build não tem acesso de rede a fontshare.com, então os arquivos ainda não
estão versionados. Enquanto isso, a stack de fallback do sistema mantém as métricas próximas
(geométrica, x-height alta) e o site permanece consistente.

## Para ativar

1. Baixe em https://www.fontshare.com/fonts/general-sans e https://www.fontshare.com/fonts/satoshi
   (escolha os arquivos **variable**, formato `woff2`).
2. Crie a pasta `public/fonts/` e coloque os arquivos ali:
   - `GeneralSans-Variable.woff2`
   - `Satoshi-Variable.woff2`
3. Troque a stack em `app/globals.css` por `next/font/local` em `app/fonts.ts`:

```ts
import localFont from 'next/font/local';

export const display = localFont({
  src: '../public/fonts/GeneralSans-Variable.woff2',
  variable: '--font-display',
  display: 'swap',
  weight: '200 700',
});
```

4. Aplique `display.variable` na tag `<html>` do `app/layout.tsx`.

Peso alvo do pacote tipográfico: ≤ 90 KB (docs/STYLE_GUIDE.md §3).
