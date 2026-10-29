# ADR-0005 — Armazenamento e otimização de arquivos de mídia

| Campo        | Valor                                                             |
| ------------ | ----------------------------------------------------------------- |
| Issue        | ARC-10 (#51)                                                      |
| Status       | **Aceita** — coordenação técnica                                  |
| Data         | 13/10/2026                                                        |
| Decisor      | Vinícius Nishimura Reis (`@Vinishireis`)                          |
| Código       | `lib/domain/media/policy.ts` + testes · `next.config.ts` (`images`) |

## Contexto

O CMS precisa receber imagens de serviços e cases (capas, galerias, peças de social media) e
documentos de assessoria de imprensa (releases, clippings em PDF). A Benjamin enviará arquivos
pesados (exports do Illustrator/Photoshop), e o site precisa continuar rápido em mobile (RNF-04).

## Decisão

### Storage

| Item | Decisão |
| ---- | ------- |
| Serviço | **Supabase Storage**, bucket `media` por ambiente (dev/hml/prd) |
| Leitura | Bucket **público**: cada arquivo abre pela URL pública, com caminho que leva UUID. **Listar** o bucket exige `media:view` (só o painel); com a chave anon a listagem vem vazia (TECH-13) |
| Escrita | Somente usuários com `media:create` (RLS em `storage.objects` usando `has_permission`) |
| Limpeza | Quem enviou pode apagar o próprio arquivo enquanto ele não estiver registrado na biblioteca (envio que falhou no meio). Arquivo registrado exige `media:delete` (TECH-13) |
| Exclusão | Somente `media:delete` (`admin`, `super_admin`); bloqueada se o arquivo estiver em uso |
| Conteúdo proibido | Documentos com dados pessoais, contratos, planilhas de leads — o bucket é público |
| Vídeo | Não armazenado: entra como link externo (YouTube, Vimeo, Instagram, TikTok) |
| Assets da marca | Logos (SVG), ícones e stickers oficiais ficam versionados em `public/brand` (não no bucket); o pacote original da agência fica em `assets/brand`, fora do deploy |

### Formatos e limites

| Tipo | MIME | Limite | Observação |
| ---- | ---- | ------ | ---------- |
| JPG | `image/jpeg` | 5 MB | Fotos |
| PNG | `image/png` | 5 MB | Peças com transparência |
| WebP | `image/webp` | 5 MB | Formato preferido para exportação |
| AVIF | `image/avif` | 5 MB | Opcional |
| PDF | `application/pdf` | 10 MB | Releases e clippings |
| SVG | — | **recusado** | Pode conter script (XSS) |

**O painel envia diretamente ao Storage por URL assinada (TECH-13 #313).** As Server Actions
autorizam `media:create`, validam os metadados e emitem um caminho/token de uso único. O navegador
transfere os bytes com `uploadToSignedUrl`; uma segunda action baixa os primeiros 256 KiB, valida
assinatura, tamanho total e dimensões, registra `media_assets` e audita. Arquivos inválidos ou cujo
registro falha são removidos. Assim o corpo da Server Action não contém os bytes da mídia.

- Maior lado da imagem ≤ **4000 px**; exportação recomendada: **2400 px** de largura (UX-14).
- O tipo real é conferido pela **assinatura dos bytes** (`sniffMimeType`), não pela extensão.
- Texto alternativo é obrigatório para publicar (regra R12 de TECH-05).

### Nomes e URLs

```text
media/AAAA/MM/<uuid>-<nome-normalizado>.<ext>
https://<projeto>.supabase.co/storage/v1/object/public/media/2026/10/6f1c…-capa-meridiano.webp
```

`buildStoragePath()` gera o caminho; `publicMediaUrl()` monta a URL. O banco guarda o **caminho**
(não a URL completa), permitindo trocar de projeto/CDN sem migrar dados.

### Otimização

- `next/image` com `formats: ["image/avif", "image/webp"]` e `remotePatterns` restrito a
  `/storage/v1/object/public/media/**` do projeto do ambiente (`next.config.ts`).
- Sempre informar `sizes` nas grades (ex.: `(min-width: 1024px) 33vw, 100vw`) e `priority` apenas
  na imagem principal acima da dobra.
- Imagens decorativas da marca (halftone, stickers) em WebP com `alt=""`.

## Fluxo de upload (ADM-09)

```mermaid
sequenceDiagram
  participant E as Editor (painel)
  participant A as Server Actions do painel
  participant S as Supabase Storage
  participant D as Banco (media_assets)
  E->>A: metadados + alt
  A->>A: requirePermission(media, create)
  A->>S: createSignedUploadUrl(path)
  S-->>E: path + token temporário
  E->>S: uploadToSignedUrl(arquivo)
  S-->>E: ok
  E->>A: path + metadados
  A->>S: GET Range (início do objeto)
  S-->>A: cabeçalho + tamanho total
  A->>A: validateUpload (assinatura, tamanho, dimensões)
  A->>D: insert {path, mime, size, width, height, alt, uploaded_by}
  A-->>E: URL pública + id
```

## Demonstração em homologação (pendente)

O critério de aceite exige upload e recuperação demonstrados em homologação. Depende de:
projeto Supabase `benjamin-hml` (GO-02), bucket/políticas (migration de ADM-03) e tela de
upload do CMS (ADM-09). Roteiro de verificação:

1. Entrar como `editor` em homologação e enviar PDF de 8 MB e imagem de 5 MB com texto alternativo.
2. Confirmar a URL pública e a exibição otimizada (`/_next/image?...`) em um case de teste.
3. Tentar enviar `logo.svg` e um `.png` renomeado como `.jpg` → ambos recusados e sem objeto órfão.
4. Como `editor`, tentar excluir a mídia → negado; como `admin` → permitido se não estiver em uso.
