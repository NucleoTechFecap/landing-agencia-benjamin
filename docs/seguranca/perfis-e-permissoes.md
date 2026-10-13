# Perfis e permissões administrativas

| Campo        | Valor                                                                 |
| ------------ | --------------------------------------------------------------------- |
| Issue        | ADM-01 (#77)                                                          |
| Responsável  | Vinícius Nishimura Reis (`@Vinishireis`)                              |
| Versão       | 1.0.0 — **proposta para aprovação da Agência Benjamin**               |
| Data         | 13/10/2026                                                            |
| Origem       | PRJ §25 (tipos de usuário, permissões, quantidade e níveis ainda não formalizados) |
| Detalhamento | Matriz granular papel × recurso × ação em TECH-03                     |

## 1. Princípios

1. **Negar por padrão:** conta autenticada sem papel atribuído não acessa o painel.
2. **Menor privilégio:** cada pessoa recebe o menor papel que permite seu trabalho.
3. **Dados pessoais só para quem atende:** leads e feedbacks ficam restritos à coordenação da
   Benjamin (minimização — TECH-08).
4. **Sem cadastro público:** contas são criadas por convite (INT-08).
5. **Autorização no servidor e no banco:** a interface apenas esconde o que o servidor já nega.

## 2. Perfis propostos

| Papel | Para quem | Resumo do que pode | Contas previstas (MVP) |
| ----- | --------- | ------------------ | ---------------------- |
| `super_admin` | NúcleoTech (manutenção técnica) | Gerenciar usuários e papéis, configurações técnicas, ler auditoria, todo o conteúdo. **Não lê leads/feedbacks por padrão** | 1 + 1 backup (Vinícius Nishimura Reis, Vinícius Binda) |
| `admin` | Coordenação da Agência Benjamin | Todo o conteúdo (inclusive excluir), mídia, contato/redes sociais, **leads e feedbacks**, convidar/desativar editores | 2 (Melissa Namie, Renan Hida — a confirmar) |
| `editor` | Equipe da Agência Benjamin que atualiza o site | Criar, editar, publicar e arquivar conteúdo; enviar mídia. Sem exclusão definitiva, sem dados pessoais, sem usuários | até 5 (nomes a indicar pela Benjamin) |
| `viewer` | Homologação/acompanhamento | Somente leitura do conteúdo no painel, sem dados pessoais | conforme necessidade (ex.: QA) |
| `pending` | Convite aceito, papel ainda não liberado | **Nada** — vê apenas a tela "acesso pendente" | — |

## 3. Matriz resumida

✔ permitido · ✖ negado · ◐ parcial (ver nota)

| Capacidade | super_admin | admin | editor | viewer | pending |
| ---------- | :---------: | :---: | :----: | :----: | :-----: |
| Entrar no painel | ✔ | ✔ | ✔ | ✔ | ✖ |
| Ver conteúdo (rascunhos inclusive) | ✔ | ✔ | ✔ | ✔ | ✖ |
| Criar/editar conteúdo | ✔ | ✔ | ✔ | ✖ | ✖ |
| Publicar/arquivar conteúdo | ✔ | ✔ | ✔ | ✖ | ✖ |
| Excluir conteúdo definitivamente | ✔ | ✔ | ✖ | ✖ | ✖ |
| Enviar/substituir mídia | ✔ | ✔ | ✔ | ✖ | ✖ |
| Excluir mídia | ✔ | ✔ | ✖ | ✖ | ✖ |
| Editar contato, redes sociais e CTAs globais | ✔ | ✔ | ◐¹ | ✖ | ✖ |
| Ver leads e feedbacks | ✖² | ✔ | ✖ | ✖ | ✖ |
| Exportar leads | ✖ | ✔ | ✖ | ✖ | ✖ |
| Convidar/desativar editores | ✔ | ✔ | ✖ | ✖ | ✖ |
| Atribuir papéis `admin`/`super_admin` | ✔ | ✖ | ✖ | ✖ | ✖ |
| Ler trilha de auditoria | ✔ | ✔ | ✖ | ✖ | ✖ |

¹ Editor altera CTAs de destaque da Home; contato institucional e redes sociais ficam com `admin`.
² Acesso emergencial a leads (suporte) exige atribuição temporária de `admin`, registrada na auditoria.

## 4. Regras de ciclo de vida das contas

| Evento | Regra |
| ------ | ----- |
| Criação | Convite por e-mail pelo `super_admin` ou `admin` (somente `editor`/`viewer`); conta nasce `pending` |
| Ativação | Quem convidou atribui o papel após confirmar a identidade |
| Desligamento | Conta desativada no mesmo dia (GO-09); sessões revogadas |
| Revisão periódica | A cada release ou mensalmente, `admin` revisa a lista de contas ativas |
| Senha | Mínimo 12 caracteres; redefinição só por e-mail; nunca compartilhada (INT-08) |

## 5. Aprovação

| Item a validar com a Benjamin | Situação |
| ----------------------------- | -------- |
| Quantidade de contas `admin` e `editor` | Pendente |
| Quem será `admin` (titular e suplente) | Pendente |
| Editor pode publicar sem aprovação de um `admin`? (proposta: **sim**, conforme PRJ §23) | Pendente |
| Leads/feedbacks visíveis apenas para `admin` | Pendente |

Registro da aprovação: comentário na issue ADM-01 com data, aprovadores e eventuais ajustes;
mudanças alteram esta matriz e a matriz granular de TECH-03 na mesma PR.
