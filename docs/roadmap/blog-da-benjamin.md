# Blog da Agência Benjamin

| Campo | Valor |
| ----- | ----- |
| Origem | Solicitação de criação do blog e FUT-10 (#211) |
| Escopo | Evolução pós-MVP; não altera o aceite da primeira entrega |
| Migration | `20261112000100_blog.sql` |
| Rollback | `supabase/rollbacks/20261112000100_blog.down.sql` |
| Testes de banco | `supabase/tests/database/blog.test.sql` |

O blog usa o Benjamin Studio e os componentes visuais do site. A listagem em `/blog` oferece busca,
assunto e paginação; `/blog/<slug>` mostra o artigo, capa opcional e artigos do mesmo assunto. A
agência preenche o conteúdo no painel; a implementação não publica artigos de exemplo.

## Operação e conteúdo

O artigo nasce como rascunho. Título, endereço, resumo de pelo menos 30 caracteres, autoria e ao menos
um parágrafo são exigidos para publicação. O campo de texto recebe um parágrafo por linha; `## ` no início
cria um subtítulo e `[texto](https://endereço)` cria um link. HTML é exibido como texto. A capa opcional vem da biblioteca de mídia; para publicar é necessário
texto alternativo e a imagem não pode estar marcada como decorativa. A equipe deve conferir direitos
de uso, conteúdo e autoria antes de publicar. A prévia é autenticada e não indexável.

O fluxo de `draft`, `published` e `archived` e as permissões existentes de `page` também valem para o
blog. O editor pode publicar diretamente, seguindo o fluxo atual; aprovação por uma segunda pessoa não
é uma função implementada (veja [FUT-05](workflow-editorial.md)). Salvar um artigo publicado atualiza
o site; a despublicação ou o arquivamento o retira. O endereço não muda depois da primeira publicação,
e artigos que já estiveram publicados permanecem arquivados para reservar o endereço. Itens nunca
publicados podem ser excluídos depois de arquivados por administrador autorizado.

A leitura pública usa cliente anônimo, RLS, status e data de publicação. As ações exigem autorização
no servidor e a RLS aplica as mesmas permissões no banco. A alteração tem controle de concorrência,
auditoria e invalidação da listagem e dos detalhes. A chave estrangeira impede apagar uma capa em uso;
o banco impede remover texto alternativo de capa de artigo publicado. A leitura de metadados da capa
pelo visitante exige um artigo publicado com data alcançada.

## Banco e rollback

O modelo `blog_articles` guarda título, slug único, resumo, autoria, assunto opcional, parágrafos, capa
opcional, estado e datas de controle. O público só lê itens publicados com `published_at` alcançado; as
permissões administrativas reutilizam `page`. Não há dados de assinantes ou de formulários nessa tabela.

Teste a migration, RLS, prévia, publicação, capa, despublicação e cache em ambiente de homologação.
A migration deve ser aplicada pelo fluxo versionado antes da publicação do código que consulta a nova
tabela. Para reverter, faça primeiro uma cópia de segurança dos artigos e retire o código que os lê; o
rollback recusa remover a tabela enquanto houver registros. A remoção de dados exige autorização
explícita e confirmação do backup. Nunca aplicar migrations em produção sem instrução explícita.

## Aceite editorial e tarefas relacionadas

A criação do blog não comprova aceite do MVP, autorização de conteúdo nem aprovação das propostas de
pós-MVP. As decisões institucionais permanecem registradas em:

| Tarefa | Documento | Decisão ou aceite necessário |
| ------ | --------- | --------------------------- |
| GOV-03 (#3) | [Critérios de aceite](../gestao/criterios-de-aceite.md) e [mapa de requisitos](../requisitos/mapa-de-requisitos.md) | Aceite escrito e rastreável da Benjamin sobre o MVP e itens adiados. |
| FUT-01 (#202) | [Evolução de leads para CRM](evolucao-crm.md) | Definir escopo, dados, responsáveis, retenção e acessos. |
| FUT-02 (#203) | [Newsletter](newsletter.md) | Definir público, finalidade, consentimento, retenção, fornecedor e domínio; sem disparos em massa antes da aprovação. |
| FUT-03 (#204) | [Automações de comunicação](automacoes-de-comunicacao.md) | Aprovar finalidades, destinatários, gatilhos e fornecedores. |
| FUT-06 (#207) | [Analytics avançado](analytics-avancado.md) | Definir indicadores, tratamento de dados e aviso de privacidade antes de ativar medição. |
| FUT-10 (#211) | [Priorização editorial](priorizacao-editorial.md) | A agência deve escolher e autorizar pautas, imagens, cases e prioridades. |

As propostas não comprovam aprovação, revisão, mudança de status no Project ou conclusão das issues.
Não reutilizar dados de leads como assinantes de newsletter.
