# Pacote de identidade visual — Agência Benjamin

Arquivos oficiais da marca enviados pela Agência Benjamin (pacote *Arquivos Site - Agência
Benjamin*), organizados para consulta da equipe de design e desenvolvimento (CON-01).

> **Direitos:** brandbook e artes são © Agência Benjamin / FECAP — *todos os direitos
> reservados*. Uso restrito a este projeto; não redistribuir fora dele.

Esta pasta **não é servida pelo site**: fica fora de `public/` e não é lida pelo código, então
não entra no deploy nem no bundle. As versões otimizadas para web que o site usa ficam em
[`public/brand/`](../../public/brand) (veja [Versões para web](#versões-para-web)).

## Estrutura

```text
assets/brand/
├── brandbook/
│   └── brandbook-agencia-benjamin.pdf      # Guia de marca V1 (2025), 41 páginas
├── logos/
│   ├── illustrator/
│   │   ├── logo-agencia-benjamin.ai               # Prancheta com símbolo, horizontal e vertical
│   │   └── logo-agencia-benjamin-comemorativo.ai  # Versões rosa, azul, amarelo e arco-íris
│   ├── pdf/                                # Exportações vetoriais, uma por logo
│   │   ├── simbolo.pdf
│   │   ├── logo-horizontal.pdf
│   │   └── logo-vertical.pdf
│   └── png/                                # Exportações 2000 × 2000 px (fundo transparente)
│       ├── logo-horizontal.png
│       └── logo-vertical.png
├── paleta/
│   └── paleta-primaria.png                 # Verde paquistanês, verde lima, verde claro, nyanza
├── icones/
│   ├── illustrator/assets.ai               # Arquivo-fonte de todos os ícones
│   ├── pdf/benja-icons-e-estampas.pdf      # Prancha com ícones, cores e estampas
│   └── png/                                # 126 ícones, 2000 × 2000 px: <ícone>-<cor>.png
├── stickers/
│   ├── illustrator/stickers-drop-01.ai     # Arquivo-fonte do Drop 01 (42 pranchetas)
│   └── png/                                # 40 stickers, 2000 × 2000 px: <sticker>-<cor>.png
├── whatsapp/
│   ├── illustrator/icons-wpp.ai            # Arquivo-fonte (12 pranchetas)
│   ├── png-transparente/                   # 12 ícones 1080 × 1080 px, fundo transparente
│   └── png-fundo-verde/                    # 10 ícones 1080 × 1080 px, com fundo verde
├── texturas/
│   └── halftone-01.psd                     # Textura de meios-tons, 3000 × 3000 px
└── rascunhos/                              # Estudos antigos (pasta "old"); não usar como oficial
    ├── benja-id-nova.ai
    └── rascunhos-da-benja.ai
```

## Nomes e cores

Os nomes originais foram padronizados em minúsculas, sem acentos nem espaços, e o número da
variação virou o nome da cor — o mesmo padrão de `public/brand/icons` e
`public/brand/stickers`. A correspondência abaixo foi conferida comparando cada arquivo com a
versão já publicada no site.

### Ícones (`icones/png`)

| Número no pacote | 01 | 02 | 03 | 04 | 05 | 06 |
| ---------------- | -- | -- | -- | -- | -- | -- |
| Cor no nome | `verde-claro` | `verde` | `lima` | `laranja` | `rosa` | `azul` |

| Nome original | Nome no repositório |
| ------------- | ------------------- |
| `CALENDÁRIO`, `CHAPÉU`, `COMENTÁRIO`, `CORAÇÃO`, `ENVIADO`, `EXCLAMAÇÃO`, `HERMES`, `INTERROGAÇÃO`, `LIKE`, `MEGAFONE`, `RAIO`, `SALVO`, `SETA`, `SETA CURVA`, `XICARA` | `calendario`, `chapeu`, `comentario`, `coracao`, `enviado`, `exclamacao`, `hermes`, `interrogacao`, `like`, `megafone`, `raio`, `salvo`, `seta`, `seta-curva`, `xicara` |
| `PP - V1`, `PP - V2` (galo de Publicidade e Propaganda) | `pp-galo-v1`, `pp-galo-v2` |
| `RP - V1`, `RP - V2` (golfinho de Relações Públicas) | `rp-golfinho-v1`, `rp-golfinho-v2` |
| `ESTRELA - 01` a `06` (4 pontas, a usada no site) | `estrela-<cor>` |
| `ESTRELA - 07` a `012` (8 pontas) | `estrela-8-pontas-<cor>`, com a 07 em `nyanza` e as demais em `verde`, `lima`, `laranja`, `rosa`, `azul` |

### Stickers (`stickers/png`)

| Número no pacote | 01 | 02 | 03 | 04 | 05 |
| ---------------- | -- | -- | -- | -- | -- |
| Cor no nome | `verde` | `lima` | `laranja` | `rosa` | `azul` |

`BENJA`, `FOFOCA ACEITAS`, `POKKK`, `POUPA MEU TEMPO`, `PUBLI AMIGOS - V1`, `PUBLI AMIGOS - V2`,
`RPLOVERS` e `TA NO BRIEFING` viraram `benja`, `fofoca-aceitas`, `pokkk`, `poupa-meu-tempo`,
`publi-amigos-v1`, `publi-amigos-v2`, `rplovers` e `ta-no-briefing`.

### WhatsApp (`whatsapp/`)

As pranchetas `Prancheta 1` a `12` viraram `01-pessoas`, `02-estrela`, `03-alerta`,
`04-caneta`, `05-calendario`, `06-conversa`, `07-documento`, `08-instagram`, `09-tiktok`,
`10-linkedin`, `11-instagram-linkedin` e `12-logo`. A pasta `JPG` do pacote, apesar do nome,
tinha PNGs com fundo verde — por isso virou `png-fundo-verde/` (só de 01 a 10).

### Logos

| Original | No repositório |
| -------- | -------------- |
| `LOGO AGÊNCIA BENJAMIN.ai` | `logos/illustrator/logo-agencia-benjamin.ai` |
| `LOGO AGÊNCIA BENJAMIN - COMEMORATIVO.ai` | `logos/illustrator/logo-agencia-benjamin-comemorativo.ai` |
| `EXPORTS/Ativo 1.pdf` · `Ativo 2.pdf` · `Ativo 3.pdf` | `logos/pdf/simbolo.pdf` · `logo-horizontal.pdf` · `logo-vertical.pdf` |
| `EXPORTS/LOGO-AGÊNCIA-BENJAMIN---HORIZONTAL.png` · `LOGO AGÊNCIA BENJAMIN - VERTICAL.png` | `logos/png/logo-horizontal.png` · `logo-vertical.png` |

Os arquivos `.DS_Store` do macOS foram descartados. Nenhum outro arquivo foi alterado: o
conteúdo é byte a byte o mesmo do pacote recebido.

## Regras do brandbook

Resumo para quem implementa; em caso de dúvida, vale o
[brandbook](brandbook/brandbook-agencia-benjamin.pdf).

- **Zona de exclusão:** manter livre ao redor do logotipo um espaço igual ao retângulo entre o
  rosto e o bico do símbolo.
- **Redução mínima:** 70 px em telas e 2,5 cm em impressos.
- **Usos incorretos:** alterar transparência, distorcer, trocar cores, mudar a posição da
  tagline, aplicar gradiente ou aplicar sobre linhas.
- **Tipografia:** Aptly (usada no logotipo; depende de licença e não é carregada no site) e
  Poppins — Black e ExtraBold para títulos, Medium para o corpo do texto e Regular para
  informações pontuais.
- **Cores:** primárias verde paquistanês `#004a1b`, verde lima `#24d139`, verde claro
  `#a0ef91` e nyanza `#f1fcd0`; secundárias azul cobalto, laranja abóbora e rosa lavanda;
  neutros creme, preto noite e grafite. Os valores usados no site são os tokens
  `--color-benja-*` de [`app/globals.css`](../../app/globals.css).

## Versões para web

O site não usa estes arquivos diretamente. As versões otimizadas ficam em `public/brand/`:

| Pasta | Conteúdo |
| ----- | -------- |
| `public/brand/icons/` | 14 ícones × 6 cores em WebP 160 px (`BrandIcon`) |
| `public/brand/stickers/` | 8 stickers × 5 cores em WebP (`Sticker`) |
| `public/brand/` | Logos horizontal e vertical (PNG/WebP) e símbolo (PNG) |

Para usar um ícone ou sticker que ainda não está no site (por exemplo `exclamacao`,
`interrogacao`, `pp-galo-v1` ou `estrela-8-pontas`), gere o WebP a partir do PNG daqui com
o mesmo padrão de nome e tamanho dos que já existem em `public/brand/`.
