# content/

Conteúdo **provisório** versionado que alimenta o site enquanto as tabelas do CMS não estão
publicadas (PRJ §40). Os textos não são finais: itens marcados com `provisional: true` exibem o
selo "Conteúdo provisório" e bloqueiam o go-live (checklist de release, GO-01).

Com o Supabase configurado, o repositório de conteúdo (`lib/server/content/sources.ts`) lê o que
foi publicado no CMS e estes arquivos ficam só para desenvolvimento sem banco (INT-02). Para forçar
o conteúdo daqui com o Supabase configurado, use `CONTENT_SOURCE=local` (recusado em homologação e
produção).

`npm run check:release-content` falha enquanto houver item provisório publicado — use no
checklist de go-live (GO-01).
