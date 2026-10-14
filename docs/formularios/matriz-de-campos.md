# Matriz de campos dos formulários

| Campo        | Valor                                                                    |
| ------------ | ------------------------------------------------------------------------ |
| Issue        | FORM-01 (#67)                                                            |
| Responsável  | Vinícius Nishimura Reis (`@Vinishireis`)                                 |
| Versão       | 1.0.0 — **proposta para aprovação da Agência Benjamin**                  |
| Data         | 13/10/2026                                                               |
| Origem       | PRJ §14 (feedback), PRJ §15 (contato e prospecção — "lista definitiva deve ser validada") |
| Código       | `lib/domain/forms/schemas.ts` (validação idêntica no navegador e no servidor) |

## 1. Formulários

| Formulário | Onde aparece | Objetivo | Registro gerado |
| ---------- | ------------ | -------- | --------------- |
| **Novo projeto** (prospecção) | `/contato` (aba "Quero um projeto"), CTAs de serviços | Captar pedidos de novos clientes e projetos | `lead` |
| **Contato institucional** | `/contato` (aba "Fale com a gente") | Parcerias, imprensa, dúvidas, interesse em participar | `contact` |
| **Feedback** | `/feedback` | Ouvir clientes, parceiros, alunos e comunidade | `feedback` |

## 2. Matriz de campos

Legenda: **O** obrigatório · **Op** opcional · **—** não existe no formulário.

| Campo | Novo projeto | Contato | Feedback | Validação | Finalidade |
| ----- | :----------: | :-----: | :------: | --------- | ---------- |
| Nome | O | O | Op | 2–120 caracteres | Identificar a pessoa no retorno |
| E-mail | O | O | Op¹ | Formato válido, minúsculas | Responder ao contato |
| Telefone (com DDD) | Op | Op | — | 10–11 dígitos (+55 opcional); só dígitos são guardados | Retorno mais rápido, se a pessoa preferir |
| Empresa/organização | Op | — | — | até 120 | Contextualizar o pedido comercial |
| Serviço de interesse | Op | — | — | Lista dos serviços publicados + "Ainda não sei" | Encaminhar para a área certa; pré-selecionado pelo CTA do serviço |
| Descrição do projeto | O | — | — | 20–3000 | Entender a demanda |
| Assunto | — | O | — | Lista fechada: Parcerias e eventos, Imprensa, Quero fazer parte da Benjamin, Dúvidas gerais, Outro | Categorizar e encaminhar |
| Mensagem | — | O | O | 10–3000 (feedback: 10–2000) | Conteúdo do contato/feedback |
| Perfil | — | — | O | Cliente, Parceiro, Aluno(a), Comunidade FECAP, Outro | Segmentar feedbacks |
| Nota (1 a 5) | — | — | Op | Inteiro 1–5 | Medir satisfação |
| "Quero receber retorno" | — | — | Op | Exige e-mail quando marcado | Consentir com o contato de volta |
| Ciência do aviso de privacidade | O | O | O | Checkbox marcado | Transparência LGPD (SEG-01/SEG-03) |

¹ Feedback pode ser anônimo; o e-mail torna-se obrigatório apenas se "Quero receber retorno" estiver marcado.

**Campos considerados e deixados de fora (minimização):** CPF, endereço, cargo, faixa de
orçamento, prazo, "como nos conheceu". Podem ser incluídos se a Benjamin justificar a necessidade.

### Campos técnicos (não pessoais, invisíveis ao usuário)

| Campo | Uso |
| ----- | --- |
| `submissionId` (UUID gerado no navegador) | Idempotência de reenvio (TECH-07) |
| `website` (honeypot) | Antispam: precisa chegar vazio |
| `startedAt` | Antispam: envio em menos de 3 s é tratado como robô |
| `sourcePath` | Página de origem (ex.: `/servicos/audiovisual`) |

## 3. Destinatários

| Registro | Variável de configuração | Proposta de destinatário | Quem consulta no painel |
| -------- | ------------------------ | ------------------------ | ----------------------- |
| `lead` | `LEAD_NOTIFICATION_TO` | E-mail comercial/coordenação da Benjamin (CON-10) | `admin` |
| `contact` | `CONTACT_NOTIFICATION_TO` (fallback: lead) | E-mail institucional da Benjamin | `admin` |
| `feedback` | `FEEDBACK_NOTIFICATION_TO` (fallback: lead) | Coordenação da Benjamin | `admin` |

Nenhum destinatário fica fixo no código (TECH-06). Os e-mails reais dependem de **CON-10**.

## 4. Mensagens ao usuário

| Situação | Mensagem |
| -------- | -------- |
| Sucesso | "Recebemos sua mensagem! Protocolo **AB-XXXXXX**. Responderemos pelo e-mail informado." |
| Campo inválido | Mensagem específica abaixo do campo (ex.: "Informe um e-mail válido.") |
| Envio repetido | Mesma confirmação e mesmo protocolo do primeiro envio (sem duplicar) |
| Falha do servidor | "Algo deu errado do nosso lado. Tente novamente em instantes." + código de atendimento |

## 5. Aprovação com a Agência Benjamin

| Ponto | Situação |
| ----- | -------- |
| Lista de campos e obrigatoriedade de cada formulário | Pendente |
| Assuntos do contato institucional | Pendente |
| Perfis do feedback | Pendente |
| Destinatário de cada formulário (CON-10) | Pendente |
| Necessidade de algum campo excluído pela minimização | Pendente |

Ao aprovar: registrar comentário na issue FORM-01 (data, aprovadores, ajustes) e alterar
`schemas.ts` + esta matriz no mesmo PR.
