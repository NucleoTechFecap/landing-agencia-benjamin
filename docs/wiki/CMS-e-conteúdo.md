# CMS e conteúdo

O painel (`/admin`) deixa a equipe da Benjamin manter **páginas e blocos, manifesto, texto Sobre, áreas
de atuação, serviços, categorias, cases e a biblioteca de mídia** sem deploy. O site lê do Supabase só o que está publicado. O conteúdo
versionado em `content/` serve de fallback de desenvolvimento e de fonte de parte do seed (os cases do
seed são fictícios).

## Páginas e textos do site

Manifesto e texto Sobre são blocos das páginas `home` e `sobre`: publicados, tomam o lugar do valor de
`site_settings`; sem página publicada, o site segue com ele. Os demais blocos entram depois das seções
fixas de cada rota. Despublicar devolve o texto anterior.

## Estados de publicação

| Estado | No site | Como chega lá |
| --- | --- | --- |
| Rascunho | Não aparece | Todo item nasce assim |
| Publicado | Aparece (ou a partir da data agendada) | "Publicar", só com os campos obrigatórios preenchidos |
| Arquivado | Não aparece; o link antigo dá 404 | "Arquivar"; "Restaurar" devolve como rascunho |

Editar um item publicado o mantém publicado: a alteração vai ao ar ao salvar. Depois da primeira publicação, o endereço
(slug) de serviço e case pode mudar, e o antigo leva ao novo (301); o de área e categoria fica fixo. Arquivar ou excluir algo de que outra página depende é
bloqueado, com a lista do que quebraria.

## Quem pode o quê

| Papel | Pode |
| --- | --- |
| Administrador (coordenação da Benjamin) | Tudo no conteúdo, inclusive excluir; pedidos de clientes e feedbacks; convidar editores |
| Editor | Criar, editar, publicar e arquivar; enviar mídia |
| Leitor | Só olhar o painel |
| Pendente | Nada: vê "Acesso pendente" até receber um papel |

Contas são criadas **por convite**; ninguém conhece a senha de outra pessoa. Matriz completa:
[`docs/seguranca/perfis-e-permissoes.md`](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/seguranca/perfis-e-permissoes.md).

## Mídia

JPG, PNG, WebP e AVIF **até 5 MB** e PDF **até 10 MB**. O arquivo vai direto do navegador ao Storage,
sem passar pela Vercel, que recusa requisições acima de 4,5 MB. Toda imagem precisa de texto alternativo, salvo as decorativas. SVG não é aceito.

## Conteúdo provisório e aprovação da agência

Os textos atuais são provisórios até a Benjamin aprovar. O painel sinaliza esses itens; o site público
não exibe selo.
Cada item tem uma ficha de aprovação em
[`docs/conteudo/`](https://github.com/NucleoTechFecap/landing-agencia-benjamin/tree/main/docs/conteudo).
O gate de release (`npm run check:release-content`) **bloqueia a publicação** enquanto houver item
provisório publicado. Não remova o gate nem marque como final um texto que não foi aprovado.

## Antes de publicar

- Confira texto, links, imagens, categoria, áreas e serviços relacionados.
- Não publique dados pessoais sem base e finalidade.
- Revise na pré-visualização quando a mudança afetar o site público.

Guias: [Guia do painel](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/cms/guia-do-painel.md) ·
[Fluxo de publicação](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/negocio/fluxo-de-publicacao.md) ·
[Máquina de estados](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/negocio/maquina-de-estados-publicacao.md) ·
[Integridade do conteúdo](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/negocio/integridade-de-conteudo.md)
