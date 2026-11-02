/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Scripts
 Arquivo      : content-seed.mjs
 Descrição    : Gera supabase/seed.sql: estrutura de content/ com cases e páginas fictícios (desenvolvimento).

 Desenvolvedor: Vinicius Binda

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 28/10/2026
 Modificado em: 02/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 28/10/2026 Vinicius Binda             Criação inicial (DBX-02).
 02/11/2026 Vinicius Binda             Cases e páginas fictícios, transação e trava por tabela (ARC-11).
──────────────────────────────────────────────────────────────────────────────
*/

/**
 * Seed de desenvolvimento (DBX-02 · ARC-11). Áreas, serviços, categorias, CTAs e configuração vêm
 * de content/ (textos institucionais, iguais aos do fallback do site). Cases e páginas são
 * fictícios: os cases de content/ citam clientes reais que ainda dependem de autorização
 * (CON-06 a CON-08), e o seed não pode tratá-la como dada. Traz também um rascunho, um agendado,
 * um arquivado e uma mídia sem uso, para exercitar a RLS e o painel. Nenhum dado pessoal, conta
 * ou senha (contas de teste: npm run seed:users).
 *
 * Os ids textuais de content/ viram UUID com md5(id)::uuid: o mesmo item tem sempre o mesmo
 * id, e o seed pode rodar de novo sem duplicar (on conflict do nothing).
 *
 * Uso (Node 22.18+, ou 22.6+ com a flag, para importar os .ts de content/):
 *   npm run seed:write    regrava supabase/seed.sql
 *   npm run seed:check    falha se supabase/seed.sql estiver desatualizado
 * O teste content-seed.test.mjs faz a mesma checagem no `npm test`.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const SEED_PATH = new URL("../supabase/seed.sql", import.meta.url);

const LONG_AGO = "2026-10-13T00:00:00.000Z";

/** Ilustrações genéricas de /public/brand/cases: o nome do arquivo não é conteúdo do case. */
const illustration = (file, icon) => ({
  src: `/brand/cases/${file}.webp`,
  alt: `Ilustração fictícia com ícone de ${icon}`,
  width: 1200,
  height: 750,
});
const ENVELOPE = illustration("aventura-de-construir", "envio");
const HEART = illustration("meridiano", "coração");
const MEGAPHONE = illustration("fecap", "megafone");

const fictionalCase = (item) => ({
  gallery: [],
  externalLinks: [],
  team: [],
  featured: false,
  status: "published",
  publishedAt: LONG_AGO,
  provisional: true,
  ...item,
});

/** Itens fictícios que não existem em content/. */
const DEMO = {
  cases: [
    fictionalCase({
      id: "case-ficticio-editora",
      slug: "editora-exemplo",
      title: "Blog da Editora Exemplo",
      client: "Editora Exemplo (fictícia)",
      categoryId: "category-copywriting",
      serviceIds: ["service-copywriting", "service-producao-de-conteudo"],
      deliveryType: "Artigos para blog",
      summary: "Case fictício do seed de desenvolvimento: artigos para o blog de uma editora que não existe.",
      challenge: "Texto fictício: organizar a pauta de um blog parado havia meses.",
      solution: "Texto fictício: calendário editorial e artigos com um tom de voz definido.",
      results: "Texto fictício: nenhum número aqui é real.",
      cover: ENVELOPE,
      gallery: [HEART, MEGAPHONE],
      date: "2026-08",
      team: ["Pessoa Fictícia A", "Pessoa Fictícia B"],
      featured: true,
      order: 1,
    }),
    fictionalCase({
      id: "case-ficticio-cafeteria",
      slug: "cafeteria-exemplo",
      title: "Redes sociais da Cafeteria Exemplo",
      client: "Cafeteria Exemplo (fictícia)",
      categoryId: "category-social-media-e-criacao",
      serviceIds: ["service-social-media", "service-design-e-identidade-visual"],
      deliveryType: "Redes sociais",
      summary: "Case fictício do seed de desenvolvimento: redes sociais de uma cafeteria que não existe.",
      cover: HEART,
      date: "2026-07",
      featured: true,
      order: 2,
    }),
    fictionalCase({
      id: "case-ficticio-instituto",
      slug: "instituto-exemplo",
      title: "Assessoria de imprensa do Instituto Exemplo",
      client: "Instituto Exemplo (fictício)",
      categoryId: "category-assessoria-de-imprensa",
      serviceIds: ["service-assessoria-de-imprensa"],
      deliveryType: "Releases e publicações",
      summary: "Case fictício do seed de desenvolvimento: releases de um instituto que não existe.",
      cover: MEGAPHONE,
      externalLinks: [
        {
          label: "Matéria fictícia",
          url: "https://example.com/materia-ficticia",
          source: "Portal Exemplo",
          date: "2026-06-15",
        },
      ],
      date: "2026-06",
      order: 3,
    }),
    fictionalCase({
      id: "case-ficticio-agendado",
      slug: "case-ficticio-agendado",
      title: "Case fictício agendado",
      client: "Cliente Fictício",
      categoryId: "category-copywriting",
      serviceIds: ["service-copywriting"],
      summary: "Item fictício do seed de desenvolvimento, agendado para o futuro: ainda não aparece no site.",
      cover: ENVELOPE,
      publishedAt: "2099-01-01T00:00:00.000Z",
      order: 98,
    }),
    fictionalCase({
      id: "case-ficticio-em-rascunho",
      slug: "case-ficticio-em-rascunho",
      title: "Case fictício em rascunho",
      client: "Cliente Fictício",
      categoryId: "category-copywriting",
      serviceIds: ["service-copywriting"],
      summary: "Item fictício do seed de desenvolvimento, em rascunho: nunca aparece no site.",
      status: "draft",
      publishedAt: null,
      order: 99,
    }),
  ],
  // "areas" é uma rota do site (PAGE_ROUTES): os blocos aparecem depois das seções fixas de /areas.
  pages: [
    {
      id: "page-ficticia-areas",
      slug: "areas",
      title: "Áreas de atuação",
      description: "Página fictícia do seed de desenvolvimento.",
      status: "published",
      publishedAt: LONG_AGO,
      provisional: true,
      blocks: [
        {
          type: "rich-text",
          content: {
            title: "Bloco de texto fictício",
            paragraphs: ["Texto fictício do seed de desenvolvimento, para testar os blocos das páginas."],
          },
        },
        {
          type: "list",
          content: {
            title: "Lista fictícia",
            items: [
              { title: "Primeiro item fictício", text: "Descrição fictícia." },
              { title: "Segundo item fictício" },
            ],
          },
        },
        {
          type: "team",
          content: {
            title: "Time fictício",
            members: [{ name: "Pessoa Fictícia A", role: "Função fictícia" }, { name: "Pessoa Fictícia B" }],
          },
        },
        {
          type: "cta",
          content: { title: "Chamada fictícia", text: "Texto fictício.", label: "Fale com a gente", href: "/contato" },
        },
      ],
    },
    {
      id: "page-ficticia-rascunho",
      slug: "pagina-ficticia-rascunho",
      title: "Página fictícia em rascunho",
      status: "draft",
      publishedAt: null,
      provisional: true,
      blocks: [
        { type: "rich-text", content: { paragraphs: ["Texto fictício de um rascunho: nunca aparece no site."] } },
      ],
    },
  ],
  unusedMedia: {
    src: "/brand/logos/simbolo.png",
    alt: "Símbolo da Agência Benjamin (mídia fictícia sem uso)",
  },
  archivedService: {
    id: "service-ficticio-arquivado",
    slug: "servico-ficticio-arquivado",
    name: "Serviço fictício arquivado",
    summary: "Item fictício do seed de desenvolvimento, arquivado: nunca aparece no site.",
    description: "Existe só no banco local, para testar listagens do painel e a RLS de itens arquivados.",
    areaIds: ["area-copywriting"],
    status: "archived",
    publishedAt: LONG_AGO,
    archivedAt: "2026-10-20T00:00:00.000Z",
  },
};

/* ─── Literais SQL ─────────────────────────────────────────────────────────── */

const text = (value) => (value == null || value === "" ? "null" : `'${String(value).replaceAll("'", "''")}'`);
const uuid = (id) => (id ? `md5(${text(id)})::uuid` : "null");
const textArray = (items = []) => (items.length ? `array[${items.map(text).join(", ")}]` : "'{}'::text[]");
const jsonb = (value) => `${text(JSON.stringify(value))}::jsonb`;
const timestamp = (iso) => (iso ? `${text(iso)}::timestamptz` : "null");

function insert(table, columns, rows, conflict) {
  if (rows.length === 0) return "";
  const values = rows.map((row) => `  (${row.join(", ")})`).join(",\n");
  return `insert into public.${table} (${columns.join(", ")}) values\n${values}\non conflict ${conflict} do nothing;\n`;
}

const MIME_BY_EXTENSION = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", avif: "image/avif" };

/** Mídia de /public referenciada pelo seed, uma linha por caminho. */
function collectMedia(services, cases) {
  const media = new Map();
  const add = (ref) => {
    if (ref && !media.has(ref.src)) media.set(ref.src, ref);
  };
  for (const service of services) add(service.image);
  for (const item of cases) {
    add(item.cover);
    item.gallery.forEach(add);
  }
  add(DEMO.unusedMedia);
  return [...media.values()];
}

/** Dados do seed, antes de virarem SQL. Os cases de content/ ficam de fora de propósito. */
export function seedDataset(snapshot) {
  const services = [
    ...snapshot.services,
    { examples: [], featured: false, order: 99, provisional: true, ...DEMO.archivedService },
  ];
  return { services, cases: DEMO.cases, pages: DEMO.pages, media: collectMedia(services, DEMO.cases) };
}

const mediaId = (ref) => (ref ? uuid(`media:${ref.src}`) : "null");
const publishable = (item) => [
  text(item.status),
  String(Boolean(item.provisional)),
  timestamp(item.publishedAt),
  timestamp(item.archivedAt),
];
const PUBLISHABLE_COLUMNS = ["status", "provisional", "published_at", "archived_at"];

function ctaTargetColumns(target) {
  const columns = { path: null, url: null, service: null, case: null, area: null };
  if (target.kind === "internal") columns.path = target.path;
  if (target.kind === "external") columns.url = target.url;
  if (target.kind === "service" || target.kind === "contact") columns.service = target.serviceId;
  if (target.kind === "case") columns.case = target.caseId;
  if (target.kind === "area") columns.area = target.areaId;
  return [text(columns.path), text(columns.url), uuid(columns.service), uuid(columns.case), uuid(columns.area)];
}

/** SQL completo do seed para o snapshot e a configuração informados. */
export function buildContentSeed(snapshot, settings) {
  const { services, cases, pages, media } = seedDataset(snapshot);

  const sections = [
    insert(
      "media_assets",
      ["id", "path", "mime_type", "width", "height", "alt_text", "decorative"],
      media.map((ref) => [
        mediaId(ref),
        text(ref.src),
        text(MIME_BY_EXTENSION[ref.src.split(".").pop()]),
        ref.width ? String(ref.width) : "null",
        ref.height ? String(ref.height) : "null",
        text(ref.alt),
        String(ref.alt === ""),
      ]),
      "(id)",
    ),
    insert(
      "areas",
      ["id", "slug", "name", "summary", "description", "highlights", "icon", "sort_order", ...PUBLISHABLE_COLUMNS],
      snapshot.areas.map((area) => [
        uuid(area.id),
        text(area.slug),
        text(area.name),
        text(area.summary),
        text(area.description),
        textArray(area.highlights),
        text(area.icon),
        String(area.order),
        ...publishable(area),
      ]),
      "(id)",
    ),
    insert(
      "services",
      [
        "id",
        "slug",
        "name",
        "summary",
        "description",
        "examples",
        "icon",
        "image_media_id",
        "featured",
        "sort_order",
        ...PUBLISHABLE_COLUMNS,
      ],
      services.map((service) => [
        uuid(service.id),
        text(service.slug),
        text(service.name),
        text(service.summary),
        text(service.description),
        textArray(service.examples),
        text(service.icon),
        mediaId(service.image),
        String(service.featured),
        String(service.order),
        ...publishable(service),
      ]),
      "(id)",
    ),
    insert(
      "service_areas",
      ["service_id", "area_id"],
      services.flatMap((service) => service.areaIds.map((areaId) => [uuid(service.id), uuid(areaId)])),
      "(service_id, area_id)",
    ),
    insert(
      "case_categories",
      ["id", "slug", "name", "description", "sort_order", ...PUBLISHABLE_COLUMNS],
      snapshot.categories.map((category) => [
        uuid(category.id),
        text(category.slug),
        text(category.name),
        text(category.description),
        String(category.order),
        ...publishable(category),
      ]),
      "(id)",
    ),
    insert(
      "cases",
      [
        "id",
        "slug",
        "title",
        "client_name",
        "category_id",
        "delivery_type",
        "summary",
        "challenge",
        "solution",
        "results",
        "cover_media_id",
        "external_links",
        "reference_month",
        "team",
        "featured",
        "sort_order",
        ...PUBLISHABLE_COLUMNS,
      ],
      cases.map((item) => [
        uuid(item.id),
        text(item.slug),
        text(item.title),
        text(item.client),
        uuid(item.categoryId),
        text(item.deliveryType),
        text(item.summary),
        text(item.challenge),
        text(item.solution),
        text(item.results),
        mediaId(item.cover),
        jsonb(item.externalLinks),
        item.date ? `${text(`${item.date}-01`)}::date` : "null",
        textArray(item.team),
        String(item.featured),
        String(item.order),
        ...publishable(item),
      ]),
      "(id)",
    ),
    insert(
      "case_services",
      ["case_id", "service_id"],
      cases.flatMap((item) => item.serviceIds.map((serviceId) => [uuid(item.id), uuid(serviceId)])),
      "(case_id, service_id)",
    ),
    insert(
      "case_media",
      ["case_id", "media_id", "sort_order"],
      cases.flatMap((item) => item.gallery.map((ref, index) => [uuid(item.id), mediaId(ref), String(index)])),
      "(case_id, media_id)",
    ),
    insert(
      "ctas",
      [
        "id",
        "label",
        "placement",
        "target_kind",
        "target_path",
        "target_url",
        "target_service_id",
        "target_case_id",
        "target_area_id",
        "sort_order",
        ...PUBLISHABLE_COLUMNS,
      ],
      snapshot.ctas.map((cta) => [
        uuid(cta.id),
        text(cta.label),
        text(cta.placement),
        text(cta.target.kind),
        ...ctaTargetColumns(cta.target),
        String(cta.order),
        ...publishable(cta),
      ]),
      "(id)",
    ),
    insert(
      "site_settings",
      ["id", "name", "short_name", "tagline", "description", "manifesto", "about", "contact", "socials", "keywords"],
      [
        [
          "true",
          text(settings.name),
          text(settings.shortName),
          text(settings.tagline),
          text(settings.description),
          jsonb(settings.manifesto),
          jsonb(settings.about),
          jsonb(settings.contact),
          jsonb(settings.socials),
          textArray(settings.keywords),
        ],
      ],
      "(id)",
    ),
    insert(
      "pages",
      ["id", "slug", "title", "description", ...PUBLISHABLE_COLUMNS],
      pages.map((page) => [
        uuid(page.id),
        text(page.slug),
        text(page.title),
        text(page.description),
        ...publishable(page),
      ]),
      "(id)",
    ),
    insert(
      "blocks",
      ["id", "page_id", "type", "content", "sort_order"],
      pages.flatMap((page) =>
        page.blocks.map((block, index) => [
          uuid(`${page.id}:bloco-${index}`),
          uuid(page.id),
          text(block.type),
          jsonb(block.content),
          String(index),
        ]),
      ),
      "(id)",
    ),
  ];

  return `/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : seed.sql
 Descrição    : Seed de desenvolvimento com cases e páginas fictícios (só banco local; recusado em produção).

 Desenvolvedor: Vinicius Binda

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 28/10/2026
 Modificado em: 02/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 28/10/2026 Vinicius Binda             Criação inicial (DBX-02).
 02/11/2026 Vinicius Binda             Cases e páginas fictícios, transação e trava por tabela (ARC-11).
──────────────────────────────────────────────────────────────────────────────
*/

-- GERADO por scripts/content-seed.mjs. Não edite à mão: altere content/ ou o script e rode
-- \`npm run seed:write\`.
--
-- Roda só no \`npx supabase db reset\` local. O \`db push\` não executa o seed; se alguém o rodar
-- num banco remoto (\`db push --include-seed\`, SQL Editor, psql), o bloco abaixo recusa bancos
-- marcados como produção em public.ambiente_banco (docs/operacao/provisionamento-producao.md).
-- A transação garante que uma falha no meio não deixe dados pela metade.
begin;

do $$
begin
  -- A tabela pode não existir num banco anterior à migration 20261102000100.
  if to_regclass('public.ambiente_banco') is not null then
    if exists (select 1 from public.ambiente_banco) then
      raise exception 'Seed de desenvolvimento recusado: este banco é de produção (public.ambiente_banco).';
    end if;
  end if;
end;
$$;

${sections.filter(Boolean).join("\n")}
commit;
`;
}

async function loadContent() {
  const load = (file) => import(new URL(`../content/${file}`, import.meta.url).href);
  const [{ areas }, { services }, { cases, categories }, { ctas }, { siteSettings }] = await Promise.all([
    load("areas.ts"),
    load("services.ts"),
    load("cases.ts"),
    load("ctas.ts"),
    load("site.ts"),
  ]);
  return { snapshot: { areas, services, categories, cases, ctas }, settings: siteSettings };
}

async function run() {
  const { snapshot, settings } = await loadContent();
  const sql = buildContentSeed(snapshot, settings);
  if (process.argv.includes("--write")) {
    writeFileSync(SEED_PATH, sql);
    console.log("supabase/seed.sql atualizado.");
  } else if (process.argv.includes("--check")) {
    if (readFileSync(SEED_PATH, "utf8") !== sql) {
      console.error("supabase/seed.sql está desatualizado em relação a content/. Rode `npm run seed:write`.");
      process.exitCode = 1;
    }
  } else {
    process.stdout.write(sql);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  run().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
