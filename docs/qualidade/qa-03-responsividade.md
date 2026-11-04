# QA-03 — Responsividade do site público

| Campo        | Valor                                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------------------- |
| Issue        | QA-03 (#181)                                                                                            |
| Execução     | 04/11/2026                                                                                              |
| Versão       | `b40318f`, branch `test/qa-06-acesso-links-e-telas`, sobre a `main` em `4e0f40c`                         |
| Ambiente     | Local: `next start` (build de produção), Chrome headless, com o conteúdo versionado e com o Supabase local |
| Escopo       | Rotas públicas em 360, 768, 1280 e 1920 px (CA-06). O painel tem a mesma verificação em `painel-responsivo.spec.ts` (ADM-16) |
| Fora do escopo | Aparelhos físicos, Safari e Firefox: o Playwright usa o Chrome do sistema. Conteúdo real da agência: os textos seguem provisórios (CON-03 a CON-05), e texto real mais longo pode mudar o resultado. |

## 1. Como reexecutar

```bash
npm run build
E2E_PORT=3100 npx playwright test tests/e2e/responsividade-site.spec.ts
E2E_EVIDENCE=1 E2E_PORT=3100 npx playwright test tests/e2e/responsividade-site.spec.ts   # grava as capturas
```

As capturas ficam em `test-results/evidencias`, fora do Git, com o nome `site-<tela>-<largura>.png`. A convenção é a de
`saveEvidence`, em `tests/e2e/painel-helpers.ts`. A captura da página inteira é feita do topo, então o teste abre a faixa
final, que normalmente abre com a rolagem: sem isso, ela sairia recortada na imagem, sem estar assim para quem rola.

## 2. Massa de teste

Conteúdo versionado em `content/` (build sem Supabase) e seed do banco local (build com Supabase). Nenhum dado pessoal.
As páginas de detalhe são descobertas nas listas, para valer com as duas massas.

## 3. O que a medição confere

Roda na própria página, depois que as entradas animadas terminam. Com a entrada em andamento, um item pode estar
deslocado de propósito.

| Verificação | Regra |
| ----------- | ----- |
| Rolagem lateral | `scrollWidth` do documento não passa de `clientWidth` |
| Fora da janela | Nenhum elemento visível passa da janela sem estar recortado por um ancestral. Pega o que `overflow: hidden` esconderia da conta acima |
| Sobreposição | Títulos, parágrafos, links, botões, campos, rótulos e imagens com `alt` do `<main>` não ocupam o mesmo lugar |
| Texto cortado | Nenhum texto com `overflow` escondido é maior que a própria caixa |
| Mídia | Imagem sem `object-fit` mantém a proporção do arquivo; nenhuma imagem visível quebrada |
| Alvos de toque, em 360 px | 24 px (WCAG 2.5.8 AA, com a exceção de espaçamento); botões e campos, 44 px; link no meio do texto é exceção da própria WCAG |

**A medição tem dentes.** O teste «a medição enxerga o que procura: cada defeito plantado é apontado» insere na página um
estouro, uma sobreposição, um texto cortado, dois alvos pequenos colados, uma imagem deformada e uma quebrada, e exige
que todos sejam apontados.

## 4. Cenários

Tipos: **E2E** navegador real. Todos em `tests/e2e/responsividade-site.spec.ts`.

| # | Cenário | Esperado | Observado |
| - | ------- | -------- | --------- |
| CT-01 | `/`, `/sobre`, `/areas`, `/servicos`, `/cases`, `/contato`, `/contato/projeto`, `/contato/mensagem`, `/feedback`, `/privacidade` e a página 404, nas 4 larguras (44 combinações) | Tudo da seção 3 | Conforme |
| CT-02 | Primeiro detalhe de serviço e de case, nas 4 larguras | Idem | Conforme |
| CT-03 | Todos os detalhes de serviço e de case, em 360 px | Idem | Conforme |
| CT-04 | Menu em 360 × 800, 360 × 480, 800 × 360 e 768 × 1024 | Painel cabe na janela e todo destino é alcançável | Conforme, **após B-01** |
| CT-05 | Cabeçalho em 1024 e 1280 px | Itens não se atropelam | Conforme |
| CT-06 | Formulários com os erros na tela, em 360 px | Tudo da seção 3, com as mensagens de erro | Conforme |
| CT-07 | `/contato#formulario` em 360 e 1280 px | Formulário não fica sob o cabeçalho fixo | Conforme |
| CT-08 | Rolagem lateral medida a cada quadro, do carregamento ao fim da rolagem, em `/`, `/servicos`, `/cases` e `/contato`, com CPU 1× e 6×, em desktop e Pixel 7 | Estouro máximo 0 em qualquer momento | Conforme |
| CT-10 | Faixa final (`data-clip-reveal`) ao fim da rolagem, em 768 × 1024, 1024 × 1366, 1280 × 800 e 1920 × 1080 | Sem recorte | Conforme. Conferida à mão também em 2560 × 1440. Em 3840 × 2160, a página acaba antes de a animação terminar, e sobra um recorte de 1,3% nas laterais, sem atingir o conteúdo, que é centralizado. Sem efeito prático |
| CT-09 | Painel em 360, 768 e 1280 px, com texto nos limites dos campos | Sem rolagem lateral nem área com rolagem própria | Conforme, em `painel-responsivo.spec.ts` (ADM-16) |

## 5. Defeitos

| # | Defeito | Passos para reproduzir | Severidade | Correção | Reteste |
| - | ------- | ---------------------- | ---------- | -------- | ------- |
| B-01 | No celular deitado, o fim do menu ficava inalcançável. O painel fica preso ao cabeçalho fixo, então rolar a página não o revela. Em 800 × 360, Contato, Deixe seu feedback e Aviso de privacidade ficavam abaixo da janela | Viewport 800 × 360 → abrir o menu → tentar chegar a "Contato" | Média | `max-h` e rolagem própria no painel (`mobile-menu.tsx`) | ✅ CT-04, que falha sem a correção (seção 7) |

## 6. Rolagem lateral intermitente em `motion.spec.ts`: não reproduziu

O registro de outra frente diz que `motion.spec.ts`, projeto `mobile`, rota `/`, falhou com 76 px de rolagem lateral sob
carga 43 e depois passou 10 de 10. **A causa não foi encontrada, e o log daquela execução não foi guardado.** O que foi
tentado, sem nenhuma ocorrência:

| Tentativa | Repetições | Resultado |
| --------- | ----------- | --------- |
| Só o navegador limitado, por `Emulation.setCPUThrottlingRate`: 1×, 4×, 8× e 16× | 4, uma por taxa | 0 ocorrência |
| Disputa real de CPU: servidor e navegador presos a 2 núcleos, com 10 processos ocupando os mesmos núcleos | 16 | 0 ocorrência |
| Idem, com 16 processos e 6 workers | 12 | 0 ocorrência |
| Arquivos de `_next/static` atrasados em até 4 s, ao acaso, com CPU 4× e 8 processos | 8 | 0 ocorrência |
| A própria `motion.spec.ts`, build com Supabase, com 16 processos e 6 workers | 10 | 10 passaram |
| A própria `motion.spec.ts`, build sem Supabase, o da execução em que falhou, com 24 processos e 6 workers | 20 | 20 passaram |
| `npm run test:e2e` completo, build sem Supabase | 1 | Passou (`motion.spec.ts` inclusive) |

As tentativas fora da própria `motion.spec.ts` mediram a cada `requestAnimationFrame`, e a medição listaria os elementos culpados.

Por leitura de código, na Home, tudo em `<main>` e no rodapé está dentro de seção com `overflow-hidden` (`Section`, hero e
`footer`), e a tela de carregamento é `fixed` com `overflow-hidden`. Só o cabeçalho fica fora desse recorte, e o painel
do menu está `hidden` até abrir. Nenhuma alteração de layout foi feita por causa disso: sem reprodução, seria correção
às cegas. CT-08 fica como guarda permanente, e, se a falha voltar, a mensagem do teste traz os elementos.

## 7. As provas falham quando a correção é retirada

Num build temporário, sem a rolagem própria do painel do menu: falham 360 × 480 e 800 × 360; 360 × 800 e 768 × 1024
seguem passando, como esperado, porque ali o menu cabe. A medição em si é conferida a cada execução pelo teste do defeito
plantado (seção 3).

## 8. Resultado

Em `b40318f`, sobre `4e0f40c`, com a máquina livre. A seção 6 foi medida antes do rebase, sobre `6959c27`, em carga alta provocada.

| Bateria | Resultado em 04/11/2026 |
| ------- | ----------------------- |
| `npm run verify` | Verde: 102 arquivos e 1521 testes passando, 189 pulados (entre eles os 19 arquivos de integração, que rodam na bateria S); build de produção ok |
| `npm run test:e2e`, build limpo sem Supabase, desktop e celular, com `responsividade-site.spec.ts` | 446 passaram, 0 falharam, 818 pulados (`@cms` e o que não depende da largura) |
| `responsividade-site.spec.ts` e demais specs desta entrega, sem Supabase, `--repeat-each=3` | 693 passaram, 0 falharam, 1605 pulados |
| Capturas, `E2E_EVIDENCE=1` | 69 testes passaram, 59 capturas por tela e largura |
| Painel em 360, 768 e 1280 px, com CTAs, detalhe de mídia e prévia (`painel-responsivo.spec.ts`), dentro de `npm run test:e2e:cms` | 425 de 425 (421 em paralelo e 4 de `@home-global`, em série) |

## 9. Pendências

- Conferir em aparelho físico e em Safari na homologação (QA-11, GO-02).
- Repetir com os textos aprovados pela agência (CON-03 a CON-05). A verificação é a mesma.
