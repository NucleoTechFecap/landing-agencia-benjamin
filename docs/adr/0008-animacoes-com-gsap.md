# ADR-0008 — Animações do site público com GSAP

| Campo   | Valor                                                                    |
| ------- | ------------------------------------------------------------------------ |
| Issue   | Sem issue: pedido direto da coordenação técnica                          |
| Status  | **Aceita**                                                               |
| Data    | 02/11/2026                                                               |
| Decisor | Vinícius Nishimura Reis (`@Vinishireis`)                                 |
| Depende | [ADR-0002](0002-stack-de-desenvolvimento.md) (stack) e [ADR-0006](0006-cache-e-invalidacao.md) (Cache Components) |

## Contexto

O site precisa de uma experiência de agência criativa: abertura, entradas por rolagem, tipografia
animada e microinterações. Ao mesmo tempo, as páginas são Server Components com Cache Components, o
requisito RNF-04 pede Core Web Vitals bons no mobile e o RNF-03 pede acessibilidade. O motion não pode
ser condição para ver o conteúdo.

## Decisão

Usar **GSAP 3** (`gsap` e `@gsap/react`) com os plugins ScrollTrigger e SplitText, organizado assim:

1. **Declarativo.** Componentes de servidor só marcam `data-motion` e atributos afins; não viram
   Client Components por causa de animação. A lista está em
   [`components/README.md`](../../components/README.md#motion--animações).
2. **Fora do bundle principal.** `MotionRoot` carrega `components/motion/engine.tsx` por `import()`.
   O painel não recebe GSAP, e um erro de animação não derruba a página.
3. **Conteúdo nunca depende do motor.** O estado inicial só vale com `html.motion`, classe ligada
   por um script inline (`MotionGate`) antes da primeira pintura. Sem JavaScript ou com movimento
   reduzido ela não existe; se o motor demorar mais de 2 s ou falhar, um temporizador a remove.
4. **Opacidade, não `visibility`.** O conteúdo à espera continua na ordem de tabulação e na árvore de
   acessibilidade; o foco por teclado revela o trecho na hora.
5. **Um contexto por rota.** Com Cache Components a rota anterior fica no DOM (`<Activity>`,
   `display: none`), então cada troca de rota reverte os efeitos e os reconstrói na página visível.
6. **Títulos só depois da hidratação.** Cada rota é uma fronteira de hidratação própria, e dividir um
   título antes dela gera erro de hidratação (React #418). `PageReady` avisa o motor quando a página
   está hidratada.

## Opções descartadas

| Opção | Motivo |
| ----- | ------ |
| ScrollSmoother | Exige um wrapper com `transform`, que quebra o cabeçalho `sticky`, e interfere em âncoras, foco e rolagem nativa no celular. A rolagem nativa continua |
| Flip | Não há elemento compartilhado entre rotas que justifique |
| Transição de rota com `<ViewTransition>` | Experimental e fora da linguagem do GSAP; a cortina acompanha o roteador sem substituí-lo nem atrasar o clique |
| MorphSVG e DrawSVG | Os ícones da marca são preenchimentos com sombra dura, sem traços adequados para desenhar |
| Marquee em loop | Exigiria mecanismo de pausa (WCAG 2.2.2); a faixa da marca anda com a rolagem do usuário |

## Consequências

- **Peso:** cerca de 50 KB (gzip) a mais, só no site público e fora do caminho crítico.
- **Licença:** o GSAP usa a [licença padrão sem custo](https://gsap.com/standard-license), não uma
  licença de código aberto. Cabe a quem responde pelo projeto conferir os termos antes de publicar em
  produção.
- **Tela de carregamento:** aparece só na primeira página da sessão, por pelo menos 0,9 s e no máximo
  2 s. Esse piso é a única espera artificial do sistema e existe para a tela não piscar.
- **Fundo verde:** é desenhado em `<canvas>`, a 30 quadros por segundo e só enquanto está na tela; a
  retícula abre sozinha em aparelhos lentos.
- **Testes:** `tests/e2e/motion.spec.ts` garante conteúdo visível, ausência de overflow e os caminhos
  sem motor (movimento reduzido, sem JavaScript e falha de carregamento).

## Reversão

Remover `MotionGate`, `MotionLoader` e `MotionRoot` de `app/(site)/layout.tsx` desliga tudo: sem a
classe `html.motion`, os atributos `data-motion` não têm efeito e valem as transições simples em CSS
(variante `motion-off:`).
