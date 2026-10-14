# Architecture Decision Records (ADR)

Decisões técnicas relevantes ficam registradas aqui, numeradas e imutáveis: uma decisão revista
gera um novo ADR que **substitui** o anterior (o antigo muda para `Substituída por ADR-XXXX`).

## Índice

| ADR | Título | Status | Issue |
| --- | ------ | ------ | ----- |
| [0001](0001-arquitetura-da-plataforma.md) | Arquitetura da plataforma e critérios de decisão | Aceita | ARC-01 |
| [0002](0002-stack-de-desenvolvimento.md) | Stack final de desenvolvimento | Aceita | ARC-02 |
| [0003](0003-limites-de-dominio.md) | Limites de domínios e responsabilidades | Aceita | TECH-01 |
| [0004](0004-logs-e-tratamento-de-erros.md) | Estratégia de logs e tratamento de erros | Aceita | ARC-09 |
| [0005](0005-armazenamento-de-midia.md) | Armazenamento e otimização de mídia | Aceita | ARC-10 |
| [0006](0006-cache-e-invalidacao.md) | Cache, invalidação e consistência após publicação | Aceita | TECH-09 |
| [0007](0007-historico-de-versoes.md) | Histórico de versões do conteúdo (fora do MVP) | Aceita | ADM-17 |

## Modelo

```markdown
# ADR-XXXX — Título

| Campo | Valor |
| ----- | ----- |
| Issue | ID (#n) |
| Status | Proposta · Aceita · Substituída por ADR-YYYY · Rejeitada |
| Data | dd/mm/aaaa |
| Decisor | Nome (`@github`) |

## Contexto
## Opções avaliadas
## Decisão
## Consequências e trade-offs
```
