# Tratamento de dados e finalidade de cada formulário

| Campo        | Valor                                                                  |
| ------------ | ---------------------------------------------------------------------- |
| Issue        | SEG-01 (#95)                                                           |
| Responsável  | Vinícius Nishimura Reis (`@Vinishireis`)                               |
| Versão       | 1.0.0 — **registrado para aprovação institucional**                    |
| Data         | 13/10/2026                                                             |
| Depende de   | [FORM-01 — matriz de campos](../formularios/matriz-de-campos.md)       |
| Referências  | LGPD (Lei 13.709/2018) arts. 6º (princípios), 7º (bases legais), 18 (direitos do titular); PRJ §32 |

> Este documento descreve **o que o sistema coleta, por quê, onde guarda, quem acessa e por
> quanto tempo**. A definição da base legal, do controlador/encarregado e do texto do aviso de
> privacidade é **decisão institucional** (Agência Benjamin/FECAP) — as colunas de base legal
> trazem sugestões técnicas para apoiar essa decisão (SEG-02).

## 1. Papéis no tratamento (a confirmar — SEG-02)

| Papel LGPD | Proposta |
| ---------- | -------- |
| Controlador | FECAP / Agência Benjamin (decide finalidades) |
| Operador | NúcleoTech (opera a plataforma), Supabase (banco), Vercel (hospedagem), Resend (e-mail) |
| Encarregado (DPO) | Encarregado institucional da FECAP — contato a publicar no aviso |

## 2. Matriz de dados por formulário

### 2.1 Novo projeto (prospecção — `lead`)

| Dado | Obrig. | Necessidade | Finalidade | Base legal sugerida |
| ---- | :----: | ----------- | ---------- | ------------------- |
| Nome | O | Identificar quem pede o projeto | Retorno comercial | Procedimentos preliminares a contrato a pedido do titular (art. 7º, V) |
| E-mail | O | Canal de resposta | Retorno comercial | art. 7º, V |
| Telefone | Op | Alternativa de contato escolhida pelo titular | Retorno comercial | art. 7º, V |
| Empresa | Op | Contexto da demanda | Avaliação da proposta | art. 7º, V |
| Serviço de interesse / descrição do projeto | O | Entender a demanda | Avaliação e encaminhamento | art. 7º, V |

### 2.2 Contato institucional (`contact`)

| Dado | Obrig. | Necessidade | Finalidade | Base legal sugerida |
| ---- | :----: | ----------- | ---------- | ------------------- |
| Nome, e-mail | O | Responder à mensagem | Atendimento institucional | Legítimo interesse do controlador em responder a quem o procurou (art. 7º, IX), com aviso claro |
| Telefone | Op | Alternativa de contato | Atendimento | art. 7º, IX |
| Assunto, mensagem | O | Entender e encaminhar | Atendimento e categorização | art. 7º, IX |

### 2.3 Feedback (`feedback`)

| Dado | Obrig. | Necessidade | Finalidade | Base legal sugerida |
| ---- | :----: | ----------- | ---------- | ------------------- |
| Perfil, nota, mensagem | O/Op | Avaliar a percepção sobre a agência | Melhoria contínua | Legítimo interesse (art. 7º, IX) |
| Nome, e-mail | Op | Somente se a pessoa quiser se identificar/receber retorno | Responder ao feedback | Consentimento (art. 7º, I) — checkbox "Quero receber retorno" |

### 2.4 Dados técnicos coletados em todos os envios

| Dado | Tratamento | Finalidade |
| ---- | ---------- | ---------- |
| Endereço IP | **Não armazenado em claro**: guardado apenas como HMAC (hash com segredo) | Limite de envios e prevenção de abuso |
| Agente do navegador | Não armazenado | — |
| Página de origem, data/hora, protocolo | Armazenados | Rastreabilidade do atendimento |

## 3. Armazenamento, acesso e compartilhamento

| Item | Regra |
| ---- | ----- |
| Onde | Banco Supabase do ambiente de produção (região a confirmar no GO-02), tabelas com RLS |
| Cópias | Notificação por e-mail aos destinatários definidos (CON-10) com o conteúdo do envio |
| Quem acessa no painel | Somente papel `admin` (Benjamin). `super_admin` (NúcleoTech) **não** acessa por padrão |
| Logs | Sem dados pessoais (mascaramento automático — ARC-09) |
| Ambientes de teste | Nunca recebem dados reais de produção (ARC-06) |
| Compartilhamento externo | Nenhum além dos operadores listados; sem venda ou uso para publicidade |
| Transferência internacional | Supabase/Vercel/Resend podem processar dados fora do Brasil — mencionar no aviso (art. 33) |

## 4. Retenção proposta

| Registro | Prazo após o último andamento | Ação ao vencer |
| -------- | ----------------------------- | -------------- |
| `lead` | 12 meses (ou até virar contrato, quando passa a seguir a política de contratos) | Exclusão |
| `contact` | 6 meses | Exclusão |
| `feedback` identificado | 12 meses | Anonimização (remove nome e e-mail, mantém perfil, nota e mensagem) |
| `feedback` anônimo | 24 meses | Exclusão |
| E-mails de notificação | Mesmo prazo do registro | Exclusão manual na caixa dos destinatários |

Detalhamento técnico do ciclo de vida, rotina de descarte e trilha de acesso: TECH-08.

## 5. Direitos do titular (art. 18)

| Pedido | Como atender |
| ------ | ------------ |
| Confirmação/acesso | `admin` localiza pelo e-mail no painel e envia cópia ao titular |
| Correção | `admin` corrige os campos de contato |
| Eliminação | `admin` exclui o registro (ação auditada) |
| Revogação do consentimento (feedback) | Anonimização imediata do feedback |

Canal para pedidos: e-mail do encarregado informado no aviso de privacidade (SEG-02).

## 6. Pontos para aprovação institucional

- [ ] Controlador, operadores e encarregado.
- [ ] Bases legais por formulário (seção 2).
- [ ] Prazos de retenção (seção 4).
- [ ] Texto do aviso de privacidade e local de publicação (SEG-02/SEG-10).
- [ ] Menção à transferência internacional de dados.
