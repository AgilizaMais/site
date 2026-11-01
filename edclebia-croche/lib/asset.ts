/**
 * O site é publicado numa subpasta (useagilizai.com/edclebiacroche).
 * O Next prefixa sozinho os arquivos dele (/_next), mas não os <img> comuns —
 * todo caminho de /public passa por aqui.
 */
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export function asset(path: string) {
  return `${basePath}${path.startsWith('/') ? path : `/${path}`}`;
}
