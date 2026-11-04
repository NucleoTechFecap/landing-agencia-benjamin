# Roteiro e checklist de homologação da Agência Benjamin

| Campo        | Valor                                                                                  |
| ------------ | -------------------------------------------------------------------------------------- |
| Issue        | QA-08 (#186)                                                                           |
| Responsável  | Flávio Santos (conforme `ownership-por-issue.csv`; backup: Julia Damásio)              |
| Versão       | 1.0.0 — roteiro pronto; **o ambiente ainda não existe**                                |
| Data         | 04/11/2026                                                                             |
| Depende de   | **GO-02 (#192)**, GOV-04, CON-04 a CON-08, CON-10, SEG-02                              |
| Base         | [Critérios de aceite](../gestao/criterios-de-aceite.md) (GOV-13)                       |
| Uso          | Conduzido na QA-09; o resultado apoia o aceite institucional (GO-07)                   |

> **O ambiente de homologação ainda não existe.** Ele depende do provisionamento (GO-02 #192), que espera
> decisões da coordenação. Este roteiro **não** traz endereço nem senha: eles serão enviados à equipe da
> Benjamin separadamente, de forma protegida, quando o ambiente estiver pronto. Se alguém mandar uma senha
> por grupo ou e-mail aberto, avise a coordenação.

## Para que serve

Homologar é testar antes de publicar. A equipe da Benjamin usa o site e o painel como no dia a dia e diz se
está de acordo. O teste técnico é do NúcleoTech. Aqui importa outra pergunta: **isso representa a agência, e
conseguimos usar sozinhos?**

Dá para fazer tudo em etapas e em mais de um dia.

## Antes de começar

**O NúcleoTech precisa ter deixado pronto** (a equipe da Benjamin não precisa fazer nada aqui):

| Pré-requisito | Situação em 04/11/2026 |
| ------------- | ----------------------- |
| Endereço de homologação, com HTTPS, fora dos buscadores | ⏳ Não existe (GO-02 #192) |
| Contas nominais para Melissa e Renan, com o papel adequado | ⏳ Depende do ambiente |
| Conteúdo cadastrado no painel para avaliação | ⏳ Depende do ambiente |
| E-mail de teste dos formulários ligado, com destinatário definido | ⏳ Depende do GO-02 e do CON-10 |
| Canal para relatar problemas | ⏳ A definir (GOV-04) |

**A equipe da Benjamin precisa ter à mão:**

- computador e celular; se puder, tablet;
- o endereço e o acesso enviados pelo NúcleoTech;
- os textos e cases que quer ver no site, ou as fichas de aprovação ([conteúdo](../conteudo/README.md));
- uma imagem qualquer, em JPG ou PNG, para testar o envio.

**Três cuidados:**

1. Use só dados inventados nos formulários (como "Pessoa Teste"), nunca dados de clientes reais.
2. Tudo aqui é teste: pode publicar, apagar e errar sem medo. Nada vai para o site oficial.
3. Texto provisório continua provisório até você aprovar. Se vir um texto que a agência não escreveu ou
   não aprovou, é justamente o que este roteiro quer pegar.

## Como anotar o resultado

Em cada linha, marque uma opção:

- **OK:** funcionou e está de acordo.
- **Problema:** não funcionou ou não está de acordo. Anote na tabela do final.
- **N/A:** não se aplica ainda, como uma tela que não existe. Anote o motivo.

Se um passo não sair como o esperado, não precisa descobrir a causa: anote o que viu.

## Parte 1. O site, como visitante

Faça primeiro no celular e depois no computador, sem entrar no painel.

### 1.1 Primeira impressão e marca

| # | O que fazer | O que deve acontecer | Critério | OK | Problema | N/A |
| - | ------------ | --------------------- | -------- | -- | -------- | --- |
| 1 | Abrir a página inicial | Aparecem o manifesto, quem é a Benjamin, áreas, serviços e cases em destaque | CA-01 | ☐ | ☐ | ☐ |
| 2 | Olhar cores, logos e ícones | Está de acordo com a identidade da agência | CA-01 | ☐ | ☐ | ☐ |
| 3 | Clicar nos botões da página inicial | Levam a Serviços, Cases, Sobre e Contato | CA-01 | ☐ | ☐ | ☐ |
| 4 | Ler o texto de ponta a ponta | Nada inventado, nenhuma promessa que a agência não faria | CA-01 | ☐ | ☐ | ☐ |

### 1.2 Sobre e áreas de atuação

| # | O que fazer | O que deve acontecer | Critério | OK | Problema | N/A |
| - | ------------ | --------------------- | -------- | -- | -------- | --- |
| 5 | Abrir **Sobre** | Explica a agência experimental, a proposta, o modelo de atuação e a relação com a FECAP, com o texto aprovado | CA-02 | ☐ | ☐ | ☐ |
| 6 | Abrir **Áreas de atuação** | As seis áreas, com o texto aprovado e os serviços certos em cada uma | CA-03 | ☐ | ☐ | ☐ |

### 1.3 Serviços

| # | O que fazer | O que deve acontecer | Critério | OK | Problema | N/A |
| - | ------------ | --------------------- | -------- | -- | -------- | --- |
| 7 | Abrir **Serviços** | Os nove serviços oficiais, com a descrição aprovada | CA-09 | ☐ | ☐ | ☐ |
| 8 | Abrir um serviço e clicar em **Quero este serviço** | Abre o formulário com esse serviço já escolhido | CA-10 | ☐ | ☐ | ☐ |

### 1.4 Cases

| # | O que fazer | O que deve acontecer | Critério | OK | Problema | N/A |
| - | ------------ | --------------------- | -------- | -- | -------- | --- |
| 9 | Abrir **Cases** | Só aparecem os cases com material enviado e autorizado | CA-11, CA-13 | ☐ | ☐ | ☐ |
| 10 | Usar os filtros | A lista muda de acordo com o filtro | CA-12 | ☐ | ☐ | ☐ |
| 11 | Abrir um case | Cliente, textos, imagens e links certos e autorizados | CA-11 | ☐ | ☐ | ☐ |

### 1.5 Contato e redes

Use dados inventados. Anote o número de protocolo que aparecer.

| # | O que fazer | O que deve acontecer | Critério | OK | Problema | N/A |
| - | ------------ | --------------------- | -------- | -- | -------- | --- |
| 12 | Enviar o formulário de **novo projeto** em branco | Avisa o que falta, sem perder o que já foi digitado | CA-14 | ☐ | ☐ | ☐ |
| 13 | Enviar o mesmo formulário preenchido | Confirma o envio e mostra um protocolo | CA-14 | ☐ | ☐ | ☐ |
| 14 | Enviar o formulário de **contato** | Confirma o envio e mostra um protocolo | CA-14 | ☐ | ☐ | ☐ |
| 15 | Enviar o formulário de **feedback** | Confirma o envio; nome e e-mail são opcionais | CA-14 | ☐ | ☐ | ☐ |
| 16 | Conferir a caixa do destinatário de teste | Cada envio chegou a quem deveria receber | CA-15 | ☐ | ☐ | ☐ |
| 17 | Em cada formulário, abrir o **aviso de privacidade** | O link funciona; o texto é o validado pela instituição | CA-17 | ☐ | ☐ | ☐ |
| 18 | No rodapé, abrir Instagram, TikTok e LinkedIn | Cada um abre o perfil oficial da agência em nova aba | CA-05 | ☐ | ☐ | ☐ |
| 19 | Conferir endereço e contatos no rodapé e em **Contato** | Dados oficiais e atualizados | CON-10 | ☐ | ☐ | ☐ |

### 1.6 Navegação no celular, tablet e computador

| # | O que fazer | O que deve acontecer | Critério | OK | Problema | N/A |
| - | ------------ | --------------------- | -------- | -- | -------- | --- |
| 20 | Usar o menu nas três telas | Todos os itens abrem a página certa | CA-04 | ☐ | ☐ | ☐ |
| 21 | Rolar as páginas nas três telas | Nada cortado, sobreposto nem andando para o lado | CA-06 | ☐ | ☐ | ☐ |
| 22 | Digitar um endereço que não existe | Aparece a página "não encontrada" da marca | CA-04 | ☐ | ☐ | ☐ |

## Parte 2. O painel, como equipe da Benjamin

Use um computador. O [guia do painel](../cms/guia-do-painel.md) explica cada campo. **O objetivo é fazer sem
ajuda do NúcleoTech**: se precisar pedir ajuda, anote, porque isso também é um resultado (CA-20).

| # | O que fazer | O que deve acontecer | Critério | OK | Problema | N/A |
| - | ------------ | --------------------- | -------- | -- | -------- | --- |
| 23 | Entrar com a sua conta e, depois, sair | Entra e sai; voltar pelo navegador não reabre o painel | CA-18 | ☐ | ☐ | ☐ |
| 24 | Criar um case de teste e salvar como rascunho | Salva; o painel mostra o que falta para publicar | CA-20 | ☐ | ☐ | ☐ |
| 25 | Abrir o endereço do site em outra aba | O rascunho **não** aparece | CA-21 | ☐ | ☐ | ☐ |
| 26 | Enviar uma imagem e usá-la como capa, com texto alternativo | A imagem aparece no case | CA-22 | ☐ | ☐ | ☐ |
| 27 | Completar e publicar o case | Aparece no site em poucos segundos, sem precisar de ninguém | CA-20, CA-21 | ☐ | ☐ | ☐ |
| 28 | Editar o texto do case e salvar | O site mostra o texto novo | CA-20 | ☐ | ☐ | ☐ |
| 29 | Editar a descrição de um serviço e publicar | O site mostra o texto novo | CA-20 | ☐ | ☐ | ☐ |
| 30 | Editar um texto institucional em **Páginas** | O site mostra o texto novo | CA-20 | ☐ | ☐ | ☐ |
| 31 | Com o papel Administrador, alterar contato e redes sociais em **Contato, links e redes sociais** | Salvar vai direto ao ar: o rodapé e a página de contato mostram os dados novos em poucos segundos. Restaure os valores ao terminar | CA-20 | ☐ | ☐ | ☐ |
| 32 | Abrir os pedidos e feedbacks recebidos | Aparecem os envios da Parte 1, só para quem é administrador. Marque N/A se a tela ainda não existir (FORM-09) | CA-23 | ☐ | ☐ | ☐ |
| 33 | Arquivar o case de teste | Sai do site; o endereço responde "não encontrada" | CA-21 | ☐ | ☐ | ☐ |

## Parte 3. Os pontos que dependem de decisão da Benjamin

Não são testes: são confirmações que só a agência pode dar. Marque quando estiver de acordo.

| # | Confirmação | Item |
| - | ------------ | ---- |
| 34 | ☐ Textos das páginas e das áreas aprovados | CON-03, CON-04 |
| 35 | ☐ Textos dos serviços aprovados | CON-05 |
| 36 | ☐ Cada case publicado tem material e autorização do cliente | CON-06 a CON-08 |
| 37 | ☐ Destinatários dos formulários e dados de contato corretos | CON-10 |
| 38 | ☐ Aviso de privacidade validado pelos responsáveis institucionais | SEG-02, SEG-10 |
| 39 | ☐ Situação do domínio definida | CON-11 |

## Como relatar um problema

| # | Página ou tela | Dispositivo e navegador | O que fiz | O que esperava | O que aconteceu | Gravidade | Print |
| - | -------------- | ------------------------ | --------- | --------------- | ---------------- | --------- | ----- |
|   |                |                          |           |                 |                  |           |       |

Gravidade, em palavras simples (a mesma ideia da [proposta de suporte](../operacao/suporte-e-evolucao.md)):

- **Impede publicar:** dados expostos, página fora do ar, formulário sem funcionar, painel inacessível.
- **Atrapalha muito:** uma função importante falha e não há outro jeito de fazer.
- **Atrapalha pouco:** há outro jeito, ou é um detalhe em uma tela.
- **Detalhe:** ajuste visual ou de texto.

Não coloque senhas nem dados reais de pessoas nos prints. O canal de envio será informado junto com o acesso
(⏳ GOV-04).

O NúcleoTech transforma cada anotação em issue, corrige o que impede a publicação (QA-10), repete os testes
(QA-11) e avisa o que mudou. Ajuste de texto, em geral, a própria Benjamin faz pelo painel.

## Resultado da homologação

Preenchido na condução da QA-09. **Em branco: a homologação não aconteceu.**

| Data | Versão avaliada | Quem avaliou | Problemas que impedem publicar | Resultado |
| ---- | ---------------- | ------------- | ------------------------------- | ---------- |
|      |                  |               |                                  | ☐ Aprovado ☐ Aprovado com ressalvas ☐ Reprovado |

Conforme a GOV-13 (§1), os critérios institucionais são validados por Melissa Namie e Renan Hida. Aprovar
aqui não publica o site: a publicação depende também da decisão técnica (TECH-14) e do aceite final (GO-07).

## Para o NúcleoTech: antes de liberar o acesso

Parte técnica, que a equipe da Benjamin pode ignorar.

- [ ] GO-02 concluído: homologação em projeto próprio, isolada da produção ([provisionamento §6](../operacao/provisionamento-producao.md)).
- [ ] `noindex` e `robots.txt` bloqueando indexação ([ARC-06 §4](../ambientes/matriz-de-ambientes.md)).
- [ ] Sem dados pessoais reais; só conteúdo provisório aprovado, cadastrado pelo painel, sem seed.
- [ ] Contas nominais criadas pelo [roteiro de administrador](../operacao/administrador-inicial.md); acesso enviado por canal protegido, fora do repositório, de issues e de grupos.
- [ ] Baterias da [matriz de testes](matriz-de-testes.md) rodadas contra a versão avaliada; `npm run test:e2e` com `E2E_BASE_URL` apontando para homologação.
- [ ] E-mail ligado, com destinatário de teste da equipe.
- [ ] Versão (commit) registrada na tabela de resultado.
- [ ] Depois da homologação: contas de avaliação revistas e case de teste removido.

A issue QA-08 só fecha quando a agência tiver recebido o acesso protegido e as instruções, com evidência: por
enquanto, este documento cobre só as instruções.
