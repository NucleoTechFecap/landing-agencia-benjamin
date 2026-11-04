# content/

Conteúdo **provisório** versionado que alimenta o site enquanto as tabelas do CMS não estão
publicadas (PRJ §40). Os textos não são finais: itens marcados com `provisional: true` aparecem
como provisórios só no painel e bloqueiam o go-live (checklist de release, GO-01). O site público
não exibe selo.

Com o Supabase configurado, o repositório de conteúdo (`lib/server/content/sources.ts`) lê o que
foi publicado no CMS e estes arquivos ficam só para desenvolvimento sem banco (INT-02). Para forçar
o conteúdo daqui com o Supabase configurado, use `CONTENT_SOURCE=local` (recusado em homologação e
produção).

Em produção, o conteúdo daqui entra no banco uma vez, pela [carga inicial](../docs/operacao/carga-inicial.md).
Depois, quem manda é o painel: mudar estes arquivos não muda o site, salvo com `CONTENT_SOURCE=local`.

`npm run check:release-content` falha enquanto houver item provisório publicado — use no
checklist de go-live (GO-01).
