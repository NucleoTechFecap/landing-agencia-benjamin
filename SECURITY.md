# Política de segurança

## Reportar uma vulnerabilidade

Não publique detalhes de uma vulnerabilidade em issues, pull requests, discussões ou canais
públicos. Use o botão **Report a vulnerability** na aba **Security → Advisories** deste repositório
para enviar um relato privado. O recurso de relato privado está habilitado no GitHub.

Inclua no relato, quando possível, o impacto, os passos mínimos para reproduzir, a versão ou commit
afetado e uma sugestão de mitigação. Não anexe dados pessoais reais, credenciais válidas ou dumps de
produção. Se uma chave tiver sido exposta, revogue-a no provedor e faça a rotação imediatamente.

## Escopo e resposta

O escopo inclui o site institucional, painel administrativo, APIs, integrações e migrations deste
repositório. A equipe NúcleoTech fará a triagem pelo canal privado do GitHub e poderá pedir dados
adicionais pelo próprio advisory. Não há prazo de resposta ou correção garantido; evite divulgar a
falha publicamente enquanto a triagem e a correção coordenada estiverem em andamento.

## Práticas de segurança

- Não armazene segredos ou dados pessoais nos commits, issues, logs ou documentação.
- Proteja operações administrativas no servidor e mantenha as políticas RLS do Supabase.
- Revogue credenciais comprometidas e siga o procedimento de rotação em
  [`docs/ambientes/variaveis-de-ambiente.md`](docs/ambientes/variaveis-de-ambiente.md).
- Consulte os documentos de segurança listados em [`docs/README.md`](docs/README.md).
