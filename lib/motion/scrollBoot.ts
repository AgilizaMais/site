/**
 * Recarregar a página volta ao início dela.
 *
 * O navegador guarda a posição de scroll e a restaura sozinho no reload. Numa
 * página comum isso é bom; aqui não: a primeira tela é uma entrada encenada —
 * o cérebro se forma, a frase é dita, a fotografia sobe — e cair no meio da
 * Cena 3 com a entrada rodando atrás é o pior dos dois mundos. Pior ainda, o
 * ScrollTrigger recalcula a partir de uma posição que o Lenis ainda não
 * conhece.
 *
 * `manual` desliga a restauração automática; o `scrollTo` cobre o navegador
 * que restaura antes de o script rodar. O salto para uma âncora continua
 * funcionando — com hash na URL, não mexemos em nada.
 *
 * Roda no <head>, antes da primeira pintura, para não haver um quadro na
 * posição antiga.
 */
export const scrollBootScript = `(function(){try{
if('scrollRestoration' in history)history.scrollRestoration='manual';
if(!location.hash)window.scrollTo(0,0);
}catch(e){}})();`;
