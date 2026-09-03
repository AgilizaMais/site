# Publicação

Este projeto é um app **Next.js**, não um conjunto de arquivos HTML. Subir a pasta do
repositório direto para a hospedagem não funciona: não existe `index.html` no código-fonte —
ele é *gerado* pelo build. Um servidor que recebe uma pasta sem índice, com listagem de
diretório desativada, responde **403 Forbidden**. É exatamente esse o sintoma.

Há dois caminhos. Os dois entregam o mesmo site.

---

## Opção A — Hospedagem comum (cPanel, Hostinger, Apache, nginx, GitHub Pages)

Gera uma pasta de arquivos estáticos, com `index.html`, pronta para upload.

```bash
npm install
npm run build:static
```

A pasta **`out/`** é o site. Suba **o conteúdo dela** (não a pasta em si) para a raiz
pública do servidor — normalmente `public_html/`, `www/` ou `htdocs/`.

```
out/
├── index.html          ← a página
├── 404.html
├── .nojekyll           ← não apague (ver abaixo)
└── _next/              ← CSS, JS e o chunk do WebGL
```

### Três detalhes que costumam quebrar

1. **Arquivos ocultos.** `.nojekyll` começa com ponto e muitos clientes de FTP não o
   mostram por padrão. Sem ele, o GitHub Pages ignora a pasta `_next/` inteira (o Jekyll
   descarta diretórios iniciados por `_`) e o site carrega sem estilo e sem JavaScript.
   Ative a exibição de arquivos ocultos antes de enviar.
2. **Subpasta — a causa nº 1 de "o site abre sem estilo".** Por padrão o build assume
   que o site fica na **raiz** do domínio e grava os caminhos dos assets como
   `/_next/...`. Servido em `https://dominio.com/pasta/`, esses caminhos apontam para
   `https://dominio.com/_next/...` — que não existe. O HTML carrega, todo o resto dá 404,
   e a página aparece como texto cru com links roxos.

   O caminho precisa entrar no build; não há como corrigir depois:
   ```bash
   BASE_PATH=/pasta npm run build:static
   ```
   Um build feito para a raiz **não funciona** em subpasta, e vice-versa. Ao mudar o
   endereço do site, refaça o build.
3. **Permissões.** Se o 403 continuar mesmo com `index.html` presente, é permissão de
   arquivo: pastas em `755`, arquivos em `644`.

---

## Build de prévia (um recorte de cenas)

Para mostrar o site até uma cena antes das seguintes existirem:

```bash
BASE_PATH=/testepsi npm run build:preview      # vai só até a Cena 2 (Ansiedade)
```

Ou, escolhendo as cenas:

```bash
BASE_PATH=/pasta NEXT_PUBLIC_SCENES=inicio,ansiedade npm run build:static
```

O recorte passa pelo registro `implementedScenes` (`lib/content/site.ts`), que é
o mesmo que a navegação, o sumário da primeira tela e o CTA "Iniciar jornada" já
consultam — então cortar ali corta tudo junto, **sem âncora morta em lugar
nenhum**. Verificado: numa prévia até a Ansiedade, as únicas âncoras da página
são `#inicio` e `#ansiedade`.

> **A prévia sai com `noindex, nofollow` automaticamente.** Hospedada num
> domínio de verdade, ela seria um site incompleto com o nome e o CRP da
> psicóloga aparecendo na busca. O sinal é o mesmo que corta as cenas, para
> ninguém ter de lembrar de ligá-lo. O build completo continua indexável.


---

## Opção B — Vercel (recomendada)

Feita para Next.js, com HTTPS, CDN e deploy automático a cada push.

1. Acesse vercel.com e conecte a conta do GitHub.
2. **Add New → Project** e selecione o repositório `AgilizaMais/site`.
3. Selecione a branch desejada. Não é preciso configurar nada: a Vercel detecta o Next.js.
4. **Deploy**. O domínio próprio se aponta em *Settings → Domains*.

Nesta opção **não** use `build:static` — a Vercel roda `npm run build` sozinha.

---

## Qual escolher

| | Opção A (estático) | Opção B (Vercel) |
|---|---|---|
| Onde hospeda | qualquer lugar | Vercel |
| Deploy | upload manual a cada alteração | automático a cada push |
| Domínio próprio | sim | sim |
| Custo | o da hospedagem atual | gratuito nesse porte |

O site não usa banco de dados, API nem formulário com dado sensível — por isso o export
estático entrega exatamente a mesma experiência, incluindo o WebGL.

---

## Verificando antes de subir

```bash
npm run build:static
npx serve out        # ou: cd out && python3 -m http.server 4000
```

Abra o endereço indicado. O que aparecer aí é exatamente o que a hospedagem vai servir.
