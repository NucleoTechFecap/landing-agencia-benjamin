# CMS e conteúdo

O painel administrativo permite à equipe autorizada manter áreas, serviços, cases, categorias,
configurações e mídia. O site público lê os registros publicados do CMS quando o Supabase está
configurado. Conteúdo versionado em `content/` é um fallback provisório para desenvolvimento.

## Ciclo editorial

Os itens seguem estados de rascunho, publicado e arquivado. Regras de integridade e campos
obrigatórios são validados no domínio, na aplicação e no banco. Operações críticas geram trilha de
auditoria; permissões são limitadas por papel.

## Antes de publicar

- Confira texto, links, imagens, categoria, áreas e serviços relacionados.
- Verifique se o conteúdo não contém dados pessoais sem base e finalidade apropriadas.
- Confirme que os campos requeridos para o estado publicado estão preenchidos.
- Faça revisão em preview/homologação quando a alteração afetar o site público.
- Não marque conteúdo provisório como definitivo para passar pelo gate de release.

Consulte o [Guia do painel](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/cms/guia-do-painel.md),
o [fluxo de publicação](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/negocio/fluxo-de-publicacao.md)
e as invariantes em `docs/negocio/`.
