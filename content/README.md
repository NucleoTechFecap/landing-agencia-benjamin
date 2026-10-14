# content/

Conteúdo **provisório** versionado que alimenta o site enquanto as tabelas do CMS não estão
publicadas (PRJ §40). Os textos não são finais: itens marcados com `provisional: true` exibem o
selo "Conteúdo provisório" e bloqueiam o go-live (checklist de release, GO-01).

Quando o CMS estiver ativo, o repositório de conteúdo (`lib/server/content`) passa a ler do
Supabase e estes arquivos ficam apenas como fallback de desenvolvimento.

`npm run check:release-content` falha enquanto houver item provisório publicado — use no
checklist de go-live (GO-01).
