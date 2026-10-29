# API pública

A API `/api/v1` expõe **somente conteúdo publicado**, em JSON, sem autenticação. Ela usa a mesma
regra de visibilidade do site: o que não aparece no site não aparece na API.

## Convenções

- Sucesso: `{ "data": ..., "meta"?: {...} }`. Erro: `{ "error": { code, message, requestId, fieldErrors? } }`.
- Campos em `camelCase`, datas ISO 8601 em UTC, mês de referência `AAAA-MM`.
- O identificador público é o **slug**; UUIDs internos não são expostos.
- Toda resposta traz `X-Request-Id`, o mesmo que aparece no log.
- Cache: `public, s-maxage=300, stale-while-revalidate=3600` nas leituras.
- Listas paginadas aceitam `page` (≥ 1) e `pageSize` (1–50, padrão 12).

## Endpoints

| Endpoint | Retorna |
| --- | --- |
| `GET /api/v1/health` | `{ status: "ok", service, apiVersion }` |
| `GET /api/v1/settings` | Configuração institucional do site |
| `GET /api/v1/pages/{slug}` | Página publicada e blocos |
| `GET /api/v1/ctas?placement=` | Chamadas para ação, com o link já resolvido |
| `GET /api/v1/areas` · `/areas/{slug}` | Áreas de atuação; o detalhe inclui os serviços publicados |
| `GET /api/v1/services?featured=` · `/services/{slug}` | Serviços; o detalhe inclui os cases |
| `GET /api/v1/categories` | Categorias de cases |
| `GET /api/v1/cases?category=&service=&area=&client=` · `/cases/{slug}` | Cases paginados e detalhe |

O detalhe do case traz os links externos com veículo e data opcionais (`source`, `date`), usados nos
clippings de imprensa.

## Compatibilidade

Mudanças na `v1` só **acrescentam** campos opcionais. Remover ou renomear um campo exige uma nova
versão. Escritas (formulários e painel) não passam pela API: são Server Actions.

Contrato completo: [`docs/api/contratos.md`](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/api/contratos.md) ·
[integração e compatibilidade](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/api/integracao-e-compatibilidade.md)
