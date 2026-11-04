# Guia do painel (CMS)

Como a equipe da Agência Benjamin atualiza o site pelo painel, sem depender do NúcleoTech.
Acesso em `/admin` com a conta convidada (INT-08).

## Primeiros passos: entrar e sair do painel

### Receber o convite (só na primeira vez)

1. A coordenação da Benjamin indica quem deve ter acesso e o NúcleoTech envia um convite para o e-mail
   institucional da pessoa.
2. Abra o e-mail, clique no link e defina a sua senha na tela "Defina sua senha" (botão **Salvar senha**).
   Ninguém da equipe conhece ou recebe a sua senha.
3. Se o link disser "inválido ou expirou", peça um novo convite ao NúcleoTech.

### Entrar

1. Acrescente `/admin` ao endereço do site. A tela "Painel da Benjamin" pede e-mail e senha.
2. Preencha e clique em **Entrar**.
3. Confira no topo da tela o seu nome e o seu **papel** (Administrador, Editor ou Leitor).

| O que aparece                         | O que significa                          | O que fazer                                                           |
| ------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------- |
| "Acesso pendente"                     | A conta existe, mas ainda não tem papel  | A coordenação da Benjamin pede ao NúcleoTech que atribua o papel      |
| "Sem permissão"                       | O seu papel não permite aquela área      | Volte ao início; se precisar da área, peça outro papel                |
| "Sua sessão expirou. Entre novamente" | A sessão acabou                          | Entre de novo; o que não foi salvo se perde                           |

### Esqueci a senha

Na tela de login, clique em **Esqueci minha senha**, informe o e-mail e clique em **Enviar link**. Abra o
e-mail, defina a nova senha e entre.

### Sair

Clique em **Sair**, no rodapé do menu. No celular e no tablet, ele também fica no seu perfil, no canto superior direito
(o círculo com as suas iniciais). Faça isso sempre que usar um computador compartilhado. Não compartilhe a senha nem o
link recebido por e-mail.

## Editar e publicar, passo a passo

O fluxo é o mesmo para áreas, serviços, categorias, cases e CTAs. O exemplo usa um serviço.

1. **Abrir.** No menu, clique em **Serviços** e depois no item. Para criar, use **Novo serviço**: todo
   item novo nasce como Rascunho e não aparece no site.
2. **Editar.** Altere os campos. Se precisar de imagem, envie-a antes em **Imagens e arquivos** (com
   texto alternativo) e escolha-a no formulário.
3. **Salvar.** Clique em **Salvar alterações**. Em rascunho, nada vai ao ar. Em item **já publicado**,
   salvar já muda o site.
4. **Conferir o que falta.** A lista "Para publicar, falta:", ao lado do formulário, mostra o que ainda
   precisa ser preenchido.
5. **Publicar.** Com a lista vazia, clique em **Publicar**. O item passa a aparecer no site.
6. **Conferir no site.** Abra a página pública do item (por exemplo, `/servicos/<endereço>`) e confira
   texto, imagem e links. Para conferir **antes** de publicar, use **Ver prévia** (abaixo).
7. **Corrigir, se preciso.** Ajuste e salve de novo, ou clique em **Despublicar** para tirar o item do
   site (ele volta a Rascunho).

### Ver prévia

Em serviços, cases e páginas, o link **Ver prévia**, ao lado do formulário, abre o item como o site o
mostraria, mesmo em Rascunho. Salve antes: a prévia mostra o que está salvo.

- Só quem entra no painel consegue abrir. O link não serve para enviar a quem não tem conta.
- Ela mostra só o que o visitante veria: área, serviço ou categoria ainda em Rascunho não aparecem junto do
  item.
- Em páginas, aparecem os blocos editáveis, sem as seções fixas da rota.
- A imagem enviada à biblioteca já tem endereço público, difícil de adivinhar. A prévia não muda isso:
  não envie à biblioteca o que não pode vazar.
- Em item já publicado, salvar já muda o site, então a prévia mostra a versão que está no ar. Para revisar
  com calma, use antes **Despublicar**: o item sai do site enquanto isso.

Conteúdo novo que ainda não deve aparecer fica em Rascunho até a aprovação da Benjamin.

Se aparecer uma mensagem de erro, consulte "Mensagens comuns", mais abaixo.

## Estados de um conteúdo

| Estado | O que significa | Aparece no site? |
| ------ | --------------- | ---------------- |
| **Rascunho** | Em preparação. Todo item novo nasce assim | Não |
| **Publicado** | Visível no site e na API pública | Sim |
| **Arquivado** | Saiu do site e da lista principal; pode voltar como rascunho | Não |

```mermaid
stateDiagram-v2
  [*] --> Rascunho: criar
  Rascunho --> Publicado: publicar
  Publicado --> Rascunho: despublicar
  Rascunho --> Arquivado: arquivar
  Publicado --> Arquivado: arquivar
  Arquivado --> Rascunho: restaurar
  Arquivado --> [*]: excluir (só administrador)
```

- **Publicar** só funciona com o conteúdo completo. O painel mostra, ao lado do formulário, a
  lista "Para publicar, falta" com o que ainda precisa ser preenchido.
- **Editar algo publicado** mantém o item no site: ao salvar, o painel confere de novo se está
  completo e o site já mostra a versão nova.
- **Item arquivado** não é editável: restaure como rascunho primeiro.
- **Excluir** é definitivo e só existe para itens arquivados, feito por administrador.
- **Endereço (slug)** é a parte final do link (ex.: `/servicos/social-media`). Deixe em branco
  para o painel gerar a partir do nome (ou título, no case). Depois da primeira publicação:
  - **serviço e case**: o endereço pode mudar, e o antigo continua funcionando, levando ao novo;
  - **área e categoria**: o endereço não muda mais, porque o link já circulou.

  O endereço de um item que já foi publicado não pode ser usado por outro item, nem depois de
  excluído: quem tiver o link antigo nunca cai em outro conteúdo.

## O que cada papel pode fazer

| Papel | Ver | Criar e editar | Publicar, despublicar, arquivar | Excluir |
| ----- | --- | -------------- | ------------------------------- | ------- |
| Leitor | Sim | — | — | — |
| Editor | Sim | Sim | Sim | — |
| Administrador | Sim | Sim | Sim | Sim |

Contato, links e redes sociais são uma exceção: só o Administrador altera. Veja a seção própria, abaixo.

Contatos e feedbacks têm dados pessoais: só o Administrador vê. O NúcleoTech (Super administrador), o
Editor e o Leitor recebem "Sem permissão". A lista de quem pode ver ainda aguarda a aprovação da Benjamin.

Matriz completa em [perfis e permissões](../seguranca/perfis-e-permissoes.md).

## Menu do painel

O menu fica à esquerda no computador, organizado em grupos: Visão geral (com o histórico de alterações), Conteúdo do
site, Comunicação, Biblioteca e Administração (com a aparência do site). O item da tela atual fica destacado.

- **Recolher menu**, no rodapé, deixa só os ícones e dá mais espaço para o conteúdo. O nome de cada item aparece ao
  passar o mouse. A escolha fica guardada neste navegador.
- No celular e no tablet, use **Abrir menu**, no canto superior esquerdo. O menu abre por cima da tela e fecha com
  **Fechar menu**, com a tecla Esc, tocando fora dele ou ao escolher um módulo.
- O cabeçalho mostra onde você está (a trilha) e traz **Ver site**, que abre o site em outra aba.
- Cada pessoa vê só os módulos que o papel permite: Editor e Leitor não veem Contatos e feedbacks. Isso é só o que
  aparece: cada tela e cada ação conferem de novo a permissão no servidor.
- Módulo que ainda não tem tela, como usuários e papéis, não aparece no menu.
- Pelo teclado, o primeiro Tab da página oferece **Pular para o conteúdo**, sem passar pelo menu.

## Início do painel (`/admin`)

Mostra o que importa para começar o dia, sempre com dados reais:

- **Ações rápidas:** os atalhos que o seu papel pode usar.
- **Como está o conteúdo:** cases, serviços, rascunhos e o que precisa de revisão. Cada número leva à lista de onde ele
  vem.
- **Caixa de entrada:** solicitações e feedbacks novos, só para quem pode lê-los.
- **Conteúdos recentes** e **Pedem atenção:** para retomar o trabalho.

Se o banco falhar, o início avisa e mantém os atalhos. Nenhum número é inventado no lugar do que não foi lido.

## Listas de cases, serviços e áreas

Mostram cartões, com capa ou ícone, ou uma tabela: escolha em **Cartões** e **Tabela**. A escolha fica guardada neste
navegador. **Buscar** procura no nome e na linha de apoio, sem diferenciar acento, e **Estado** filtra por publicado,
rascunho ou arquivado.

## Formulários

- Ao alterar um campo, aparece **Alterações não salvas** ao lado do botão de salvar. Se você tentar sair, o painel
  pergunta antes.
- O botão de salvar fica sempre à vista no fim da tela, mesmo em formulários longos.
- Na capa do case e na imagem do serviço, a prévia muda conforme a escolha. **Enviar imagem para a biblioteca** salva o
  arquivo e volta para o formulário.
- Despublicar, arquivar e excluir pedem confirmação em uma janela. Cancelar ou apertar Esc não muda nada.

## Revisão de conteúdos (`/admin/conteudos`)

Reúne em uma tela páginas, áreas, serviços, categorias e cases: o que está publicado, o estado de cada
item, quando foi atualizado e o link para abrir. Use aqui para saber o que falta antes de publicar ou de
pedir aprovação.

**Precisa de revisão** lista, primeiro o que já está no site:

| O que aparece | O que significa | O que fazer |
| ------------- | --------------- | ----------- |
| "Para publicar, falta:" | Rascunho incompleto: a mesma lista que aparece ao lado do formulário | Complete quando o material chegar. Ninguém é obrigado a publicar |
| "No ar com pendências:" | Item publicado que não passaria na conferência hoje (por exemplo, a categoria dele saiu do ar) | Corrija o item, ou o conteúdo de que ele depende |
| "Avisos:" | Item publicado com algo a decidir: serviço sem área publicada, destaques acima do limite no site ou data de publicação futura | Avalie: o site segue de pé |
| "Textos provisórios, sem outra pendência" | Item marcado como provisório, sem outro problema. A lista começa recolhida; clique para abrir | Desmarque só depois da aprovação da Benjamin. Enquanto houver texto provisório publicado, o go-live fica bloqueado |

Ficam fora da fila: item publicado em dia, rascunho completo (na coluna **Revisão** aparece "Pronto para
publicar") e arquivado, que já saiu do site. Publicar continua sendo decisão de quem edita.

Editor e Administrador veem **Editar**; o Leitor vê **Ver**, que abre o item sem poder salvar. Se a tela
mostrar "Algo deu errado", o conteúdo não foi lido e a lista não diz nada sobre ele: tente de novo e, se
persistir, envie o código ao NúcleoTech.

## Páginas e textos (`/admin/paginas`)

Aqui muda quase tudo o que o visitante lê. A lista tem três partes:

- **As páginas do site** (Home, Sobre, Áreas, Serviços, Cases, Contato, Feedback e Privacidade).
- **As páginas que vocês criaram**, cada uma com endereço próprio.
- **O que aparece em várias páginas:** menu, rodapé e textos gerais, os formulários do site e os textos fixos das
  páginas de serviço e de case.

Em uma página sem conteúdo ainda, **Criar conteúdo** abre um rascunho. Enquanto ela não for publicada, o site continua
com os textos originais. Depois de publicada, **salvar muda o site na hora, sem deploy**.

### Textos e imagens

Cada seção da página abre e fecha, com todos os textos, imagens, ícones, botões e a cor de fundo dela.

- **Voltar ao texto original** aparece embaixo do campo alterado e desfaz só aquele campo. O site só guarda o que
  difere do original.
- **Esconder esta seção do site** tira a seção sem apagar o que está escrito nela.
- O texto entre chaves, como `{total}`, é trocado pelo valor real. A dica do campo diz o que cada um significa.
- As listas de serviços, cases e áreas vêm das telas próprias de cada um. Aqui ficam os títulos e chamadas em volta.

### Criar uma página nova

**Nova página** pede título e endereço. Em branco, o endereço sai do título. Ela nasce como rascunho e só vai ao ar ao
publicar; depois da primeira publicação, o endereço não muda.

Monte o conteúdo com blocos, na ordem que quiser:

| Bloco | O que faz |
| ----- | --------- |
| Abertura com título e botões | Como primeiro bloco, vira o topo da página. Só nas páginas novas |
| Texto | Título opcional e parágrafos, um por linha |
| Texto com imagem | Parágrafos, imagem à direita ou à esquerda, e botão opcional |
| Imagem | Uma imagem larga, com legenda |
| Cartões | Até 12, cada um com ícone ou imagem, título, texto e link |
| Lista de destaques | Um item por linha: `Título \| texto opcional` |
| Galeria de imagens | Até 24 imagens da biblioteca |
| Perguntas frequentes | Perguntas que abrem e fecham |
| Botões | Até 4 botões, com título e texto opcionais |
| Nosso time | Nome, cargo e foto. Publique só o que a pessoa autorizou |
| Chamada para ação | Título, texto, botão e destino |

Os blocos também podem ser acrescentados às páginas do site: eles entram depois das seções fixas. Para a página nova
aparecer no menu, acrescente o endereço dela em **Menu, rodapé e textos gerais**.

### SEO e compartilhamento

A aba **SEO e compartilhamento** tem o título e a descrição para buscadores, as palavras-chave, a opção de não listar a
página e o cartão que aparece ao compartilhar: título, descrição e imagem (Open Graph). As duas prévias acompanham o que
você digita. O que ficar em branco segue o padrão da página. Serviços e cases têm o mesmo formulário, numa aba própria.

### Blocos e dados

| Campo | Obrigatório para | Observação |
| ----- | ---------------- | ---------- |
| Título | salvar | Nas páginas do site, é só o nome interno. Nas novas, aparece no topo se a página não começar por uma abertura |
| Descrição | — | Até 300 caracteres |
| Texto provisório | — | Nasce marcado. Desmarque só depois da aprovação da Benjamin: o site não mostra aviso ao visitante, mas o go-live fica bloqueado enquanto houver texto provisório publicado |
| Conteúdo | publicar | Página nova: ao menos um bloco. Página do site: ao menos um bloco, um texto alterado ou o SEO preenchido |

Os blocos são editados um de cada vez, com **Editar**, **Subir**, **Descer** e **Excluir**. Em página publicada, a
exclusão do último bloco é recusada quando ela ficaria vazia: despublique a página antes.

Despublicar ou arquivar a página do site devolve os textos originais. Os blocos **Manifesto** e **Sobre a Benjamin**
continuam valendo, mas o caminho mais simples agora é **Textos e imagens**, que vale por cima deles.

## Aparência do site (`/admin/aparencia`)

Cores, fontes, logotipos, ícone da aba e imagem padrão de compartilhamento. Só o papel Administrador altera; Editor e
Leitor só veem. **Salvar vai direto ao ar**, em todas as páginas.

- A **prévia** acompanha as cores e as fontes enquanto você escolhe.
- O **contraste** é conferido a cada mudança. Abaixo de 3:1, o texto fica ilegível e o painel não salva. Entre 3:1 e
  4,5:1, ele avisa e deixa salvar.
- **Voltar à identidade da marca** só preenche o formulário: nada muda até salvar.
- Os ícones e stickers ilustrados são arquivos da marca, com as cores deles: não acompanham a paleta.
- Fontes: há uma lista fechada, porque cada uma é baixada com o site e precisa de licença livre. Outra fonte, como a
  Aptly, depende de licença e de uma alteração do NúcleoTech.
- Logotipos vêm da biblioteca, em PNG ou WebP. A biblioteca não aceita SVG, por segurança.

## Histórico de alterações (`/admin/historico`)

Toda edição fica guardada: páginas, blocos, áreas, serviços, categorias, cases, CTAs, configurações e aparência.

- **Histórico de alterações**, no menu, mostra tudo o que mudou no site, das alterações mais recentes às mais antigas,
  com o nome de quem alterou e o horário.
- **Ver histórico e restaurar**, ao lado de cada item, mostra as versões só dele.
- Ao abrir uma versão, a tabela compara **Hoje** e **Nesta versão**, campo a campo.
- **Restaurar esta versão** traz o conteúdo de volta. Em item publicado, o site muda na hora. Nada se perde: o conteúdo
  atual continua guardado, e a restauração vira uma versão nova, que também pode ser desfeita.

O que a restauração não faz:

- Não muda o endereço nem o estado do item (publicado, rascunho ou arquivado).
- Não recria item excluído: a versão fica guardada, mas o botão não aparece.
- Não traz de volta arquivo apagado da biblioteca: nesse caso, ela avisa quais imagens faltam, e nada muda.
- Item arquivado precisa voltar a rascunho antes.

Editor restaura o que ele pode editar. Leitor vê o histórico, sem o botão.

## Áreas de atuação (`/admin/areas`)

| Campo | Obrigatório para | Observação |
| ----- | ---------------- | ---------- |
| Nome | salvar | Até 120 caracteres |
| Endereço (slug) | salvar | Minúsculas, números e hífens; único entre as áreas |
| Resumo | publicar | 10 a 200 caracteres; aparece no card |
| Descrição | publicar | Mínimo de 20 caracteres |
| Destaques | — | Um por linha, até 12 |
| Ícone | — | Um dos 14 ícones oficiais do brandbook |
| Ordem | — | Menor aparece primeiro |

O vínculo entre área e serviço é feito no cadastro do serviço. Uma área **não pode ser arquivada
nem despublicada** se algum serviço publicado ficaria sem nenhuma área publicada — o painel lista
quais são.

## Serviços (`/admin/servicos`)

| Campo | Obrigatório para | Observação |
| ----- | ---------------- | ---------- |
| Nome | salvar | Até 120 caracteres |
| Endereço (slug) | salvar | Vira o link `/servicos/<slug>`; único entre os serviços |
| Resumo | publicar | 10 a 200 caracteres; aparece no card |
| Descrição | publicar | Mínimo de 20 caracteres; texto da página do serviço |
| Exemplos de entregas | — | Um por linha, até 12 |
| Áreas de atuação | publicar | Ao menos uma; áreas em rascunho não aparecem no site |
| Ícone | — | Um dos 14 ícones oficiais |
| Imagem | — | Escolhida na biblioteca de mídia; precisa de texto alternativo |
| Destaque na Home | — | Até 6 serviços publicados em destaque. Acima disso o painel avisa e a Home mostra os 6 primeiros, pela ordem |
| Ordem | — | Menor aparece primeiro |

A página pública do serviço já traz o botão de contato com o serviço pré-selecionado no
formulário. Um serviço **não pode ser arquivado nem despublicado** se for o único serviço de algum
case publicado — o painel lista quais cases.

## Contato, links e redes sociais (`/admin/configuracoes`)

**Salvar vai direto ao ar.** Esta tela não tem rascunho nem botão de publicar: ao clicar em **Salvar e
colocar no ar**, o site muda para todos os visitantes. Confira os links antes de salvar.

Só o **Administrador** altera. Editor e Leitor abrem a tela em modo leitura; se algo precisar mudar, peçam à
coordenação da Benjamin.

| Campo | Regra | Onde aparece |
| ----- | ----- | ------------ |
| E-mail | Opcional. Um endereço válido | Rodapé e página de contato |
| Telefone | Opcional. Com DDD, só números, espaços, parênteses e hífen | Rodapé e página de contato |
| Endereço | Opcional. Até 200 caracteres | Rodapé e página de contato |
| Link do mapa | Opcional. Link completo começando com `https://`. Exige o endereço, porque abre a partir dele | Vira o link do endereço |
| Instagram, TikTok, LinkedIn | Opcionais. Link completo começando com `https://`, no site da própria rede | Ícones do rodapé e da página de contato |
| Slogan | Obrigatório. Até 120 caracteres | Rodapé |
| Descrição da agência | Obrigatória. De 50 a 300 caracteres | Rodapé e resumo do site nas buscas |

- **Campo em branco não aparece no site.** Sem endereço, o item some; sem mapa, o endereço aparece como
  texto, sem link; sem uma rede, o ícone dela some.
- **Link recusado:** o painel mostra o erro embaixo do campo e não muda nada no site. Só são aceitos links
  `https://`. Se copiou o link sem o começo (por exemplo, `instagram.com/benja`), inclua `https://www.`.
- **Duas pessoas na mesma tela:** quem salvar por último recebe "O conteúdo foi alterado por outra pessoa".
  Recarregue a página e refaça a alteração.
- **Quem alterou:** cada gravação fica na trilha de auditoria, com autor, data e os nomes dos campos
  alterados, sem guardar os valores.

O que **não** se edita aqui:

- **Manifesto e textos do Sobre:** ficam em **Páginas e textos**, com rascunho e publicação. Manter uma fonte
  só evita dúvida sobre qual texto vale.
- **Quem recebe os formulários do site:** é definido pelo NúcleoTech, fora do painel. Trocar o e-mail desta
  tela muda só o que aparece no site, e não o destino das mensagens.
- **Nome da agência:** também está no logotipo, no rodapé e em outros pontos fixos do site. Se precisar mudar,
  fale com o NúcleoTech.

Os dados oficiais de contato ainda dependem da definição da agência (CON-10). Esta tela só altera o que
estiver no site: preencher um campo aqui não conta como aprovação.

## Imagens e arquivos (`/admin/midia`)

Envie aqui as imagens antes de usá-las em cases e serviços. Nos formulários, o link **Enviar imagem
para a biblioteca** abre esta tela e, depois do envio, volta para o item que você estava editando
(salve o que já digitou antes de sair).

| Regra | Valor |
| ----- | ----- |
| Formatos | JPG, PNG, WebP e AVIF até 5 MB; PDF até 10 MB. Arquivo maior é recusado antes do envio: reduza (para imagens, exporte em WebP). SVG não é aceito |
| Tamanho da imagem | Até 4000 px no maior lado; recomendado 2400 px de largura |
| Texto alternativo | Obrigatório (3 a 160 caracteres), exceto se a imagem for marcada como decorativa |

O arquivo é conferido pelo conteúdo, não só pela extensão: um arquivo renomeado é recusado.

### Detalhes de um arquivo

Na lista, **Detalhes** abre o arquivo, com três coisas:

- **Onde é usado:** os serviços, cases e páginas que usam o arquivo, em qualquer estado.
- **Texto alternativo:** quem edita mídia pode corrigir e clicar em **Salvar alterações**. Imagem em
  conteúdo publicado ou no bloco "Nosso time" não pode virar decorativa. Se o arquivo for foto do bloco,
  abra a página e salve o bloco de novo: ele guarda uma cópia do texto.
- **Excluir arquivo** (Administrador): só aparece se nenhum conteúdo usa o arquivo, inclusive rascunhos e
  arquivados. Quem tem a imagem em uso precisa trocá-la antes. A exclusão não tem volta: o arquivo sai da
  biblioteca e do armazenamento.

## Categorias de cases (`/admin/categorias`)

Nome e endereço bastam para publicar. Uma categoria **não pode ser despublicada nem arquivada**
enquanto houver case publicado nela, e **não pode ser excluída** enquanto qualquer case (até
rascunho ou arquivado) a usar — o painel lista quais.

## Cases (`/admin/cases`)

| Campo | Obrigatório para | Observação |
| ----- | ---------------- | ---------- |
| Título e endereço (slug) | salvar | O link fica `/cases/<slug>` |
| Cliente | publicar | |
| Categoria | publicar | Precisa estar publicada |
| Serviços envolvidos | publicar | Ao menos um serviço publicado |
| Resumo | publicar | 30 a 280 caracteres |
| Capa | publicar | Imagem da biblioteca com texto alternativo |
| Galeria | — | Até 20 imagens, na ordem de envio |
| Desafio, solução, resultados | — | Resultados só reais e autorizados |
| Links externos | — | Um por linha: `Rótulo \| https://endereço` (até 10). Para clipping de imprensa, acrescente veículo e data: `Matéria \| https://… \| Estadão \| 2026-09-15` |
| Mês de referência | — | Não pode estar no futuro |
| Equipe | — | Um nome por linha, só com autorização |
| Destaque na Home | — | Até 6 cases em destaque. Acima disso a Home mostra os 6 primeiros, pela ordem |

Dá para salvar o case aos poucos, enquanto o material da Benjamin chega: a lista "Para publicar,
falta" mostra primeiro os campos vazios e, depois de completos, as regras que dependem de outros
conteúdos (como a categoria estar publicada).

## Contatos e feedbacks (`/admin/leads`)

Tudo o que chega pelos formulários do site fica aqui, mesmo se o e-mail de aviso falhar. Só quem é
Administrador abre esta tela.

| Tipo | O que é | De onde vem |
| ---- | ------- | ----------- |
| Novo projeto | Pedido de quem quer contratar um trabalho | Contato, aba "Quero um projeto" |
| Contato institucional | Parcerias, imprensa, dúvidas, interesse em participar | Contato, aba "Fale com a gente" |
| Feedback | Avaliação de clientes, parceiros, alunos e comunidade. Pode ser anônimo | Página de feedback |

### Encontrar um envio

A lista mostra primeiro os mais novos, 20 por página. Use os filtros **Tipo**, **Status**, **Categoria**
e **Notificação** e clique em **Filtrar**; **Limpar** volta à lista completa. A categoria é o serviço
pedido, o assunto do contato ou o perfil de quem deu o feedback.

Não há busca por nome ou e-mail, porque esses dados ficariam gravados no endereço da página e no
histórico do navegador. Se a pessoa informar o protocolo (`AB-XXXXXX`, mostrado na tela de confirmação
e no e-mail de aviso), procure por ele na lista.

### Abrir e atender

1. Clique no **protocolo** para abrir o envio. Toda abertura fica registrada na trilha de auditoria, com
   quem abriu e quando.
2. Leia o conteúdo e responda pelo seu e-mail. O painel não envia resposta e não permite editar o que a
   pessoa escreveu.
3. Em **Atendimento**, escolha o novo status e clique em **Salvar status**.

| Tipo | Status disponíveis (proposta, aguardando aprovação da Benjamin) |
| ---- | --------------------------------------------------------------- |
| Novo projeto e contato | Novo → Em atendimento → Respondido → Arquivado |
| Feedback | Novo → Lido → Arquivado |

Se aparecer "O conteúdo foi alterado por outra pessoa", alguém mudou o status enquanto a sua tela estava
aberta: recarregue a página e veja se ainda precisa alterar.

### O e-mail de aviso chegou?

A coluna **Notificação** e o quadro no detalhe mostram a situação do e-mail enviado à equipe. Quando há
falha, um aviso aparece no topo da lista, com o link **Ver quais são**.

| Situação | O que significa | O que fazer |
| -------- | --------------- | ------------ |
| Enviada | O provedor aceitou o e-mail. Se a caixa de destino o devolver, o painel não fica sabendo | Nada |
| Pendente | O e-mail ainda não saiu; o reenvio automático tenta de novo | Se demorar, atenda por aqui |
| Falhou | O e-mail não chegou. O reenvio tenta até 5 vezes | **Atenda por aqui.** Depois das 5 tentativas não há novo reenvio: avise o NúcleoTech |
| Sem destinatário | Nenhum destinatário configurado neste ambiente, então nada foi enviado | Atenda por aqui. Em produção, avise o NúcleoTech |

Os destinatários de cada formulário são definidos pela Benjamin (CON-10) e ainda estão pendentes.

### Excluir a pedido da pessoa

Quando a pessoa pede a exclusão dos dados, ou no fim do prazo de retenção:

1. Mude o status para **Arquivado** e salve. O botão de excluir só aparece depois disso.
2. Clique em **Excluir definitivamente** e confirme. Não há como desfazer. A trilha de auditoria guarda
   quem excluiu e quando, sem o conteúdo.
3. **Apague também o e-mail de aviso** na caixa de quem recebeu: ele é uma cópia dos dados.

O canal e o responsável por esses pedidos ainda aguardam definição da Benjamin. Exportar para planilha,
corrigir dados e anonimizar um feedback não são feitos pelo painel: fale com o NúcleoTech.

### Cuidados

- Não encaminhe o conteúdo dos envios nem copie para planilhas ou conversas.
- O painel limpa da memória do navegador o que estava aberto quando você clica em **Sair**. Em computador
  compartilhado, saia sempre ao terminar.

## CTAs e destaques da Home (`/admin/ctas`)

CTA é o botão que leva o visitante ao próximo passo, como "Quero um projeto" ou "Ver cases". Texto e destino
são trocados aqui, sem mexer em código e sem novo deploy. O fluxo é o de sempre: o CTA nasce como rascunho,
só aparece no site depois de publicado, e despublicar tira o botão na hora.

| Campo | Obrigatório para | Observação |
| ----- | ---------------- | ---------- |
| Texto do botão | salvar | De 2 a 40 caracteres |
| Posição | salvar | Onde o botão aparece (quadro abaixo) |
| Tipo de destino | salvar | Muda o campo seguinte (quadro abaixo) |
| Ordem | — | Menor aparece primeiro **dentro da mesma posição**. O primeiro botão ganha o destaque de cor |

| Posição | Onde aparece | Sem nenhum botão publicado |
| ------- | ------------ | -------------------------- |
| Home: topo | Junto do manifesto, na primeira dobra | O topo fica só com o manifesto |
| Home: faixa final | Faixa "Tem um projeto em mente?", no fim da Home | A faixa inteira não aparece |
| Rodapé, página de serviço, página de case | **Ainda não aparecem no site.** Dá para deixar pronto, mas publicar não muda nenhuma página | — |

| Tipo de destino | Como escolher | Se o destino sair do site |
| --------------- | ------------- | ------------------------- |
| Página do site | Lista com as páginas fixas (Sobre, Serviços, Cases, Contato…) | — |
| Serviço, Case ou Área | Lista com os itens. O botão acompanha o item se o endereço dele mudar | O botão passa a levar à lista (Serviços, Cases ou Áreas) e o painel avisa. Nunca dá "página não encontrada" |
| Formulário de contato | Direto, ou com um serviço já marcado no formulário | Abre o formulário sem o serviço |
| Link externo | Link completo, começando com `https://` | — |

O painel recusa o que levaria o visitante a lugar errado:

- link sem `https://` ou com `javascript:`, espaços, usuário ou senha;
- página fora da lista. Para abrir um serviço ou case específico, use o tipo Serviço ou Case;
- botão da Home que levaria para a própria Home;
- destino que foi excluído: a lista "Para publicar, falta" pede outro. Enquanto isso, se o botão já estiver
  publicado, o site usa a lista como destino.

Ao lado do formulário, **Para onde o botão leva hoje** mostra o endereço que o visitante abre agora. Depois de
publicar, confira na Home.

### Destaques da Home

Não existe cadastro separado de destaque. Ele é marcado em cada item, na opção **Destacar na Home**:

- **Serviços em destaque**: no cadastro do serviço, em `/admin/servicos`;
- **Cases em destaque**: no cadastro do case, em `/admin/cases`.

A parte de baixo de `/admin/ctas` mostra o que está marcado, quantos estão no site e leva até cada item. Só
aparece na Home o que está publicado, até 6 de cada tipo. Sem nenhum destaque, a Home mostra um aviso no lugar
da lista, em vez de um espaço em branco.

### O que ainda não se edita por aqui

Os títulos e as descrições das seções Áreas, Serviços e Cases da Home (por exemplo, "Seis frentes, um mesmo
time.") ainda são fixos e dependem do NúcleoTech. Se uma sétima área for criada, avise para o título ser
ajustado.

## Mensagens comuns

| Mensagem | O que fazer |
| -------- | ----------- |
| "Ainda falta conteúdo para publicar" | Complete os itens listados e publique de novo |
| "O conteúdo foi alterado por outra pessoa" | Outra pessoa salvou o mesmo item depois que você abriu a tela. Recarregue a página e refaça a alteração |
| "Esta operação deixaria páginas do site quebradas" | Resolva os itens listados (ex.: vincule o serviço a outra área) antes de arquivar |
| "Já existe um item com este endereço" | Escolha outro slug |
| "Este botão já fica na Home e levaria para ela mesma" | Escolha outra página de destino para o CTA |
| "Não foi possível registrar a operação na auditoria" | Nada foi alterado. Tente de novo; se persistir, envie o código de atendimento ao NúcleoTech |

Toda publicação, despublicação, arquivamento, exclusão e alteração de contato e redes fica registrada na
trilha de auditoria com quem fez e quando (TECH-10).
