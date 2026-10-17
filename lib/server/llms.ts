/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : llms.ts
 Descrição    : Gera llms.txt e llms-full.txt a partir do conteúdo publicado.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 13/10/2026
 Modificado em: 13/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (SEO da landing).
──────────────────────────────────────────────────────────────────────────────
*/

import "server-only";
import { siteUrl } from "@/lib/config/public-env";
import { getSiteSettings, listAreas, listCases, listServices } from "./content/repository";

const PAGES = [
  { path: "/", title: "Início", text: "manifesto, apresentação da agência, áreas, serviços e cases em destaque." },
  {
    path: "/sobre",
    title: "Sobre a Benjamin",
    text: "o que é a agência experimental, proposta de valor, modelo de atuação e relação com a FECAP.",
  },
  { path: "/areas", title: "Áreas de atuação", text: "as seis áreas da agência e os serviços de cada uma." },
  { path: "/servicos", title: "Serviços", text: "os serviços oferecidos e como a agência trabalha." },
  { path: "/cases", title: "Cases", text: "portfólio filtrável por categoria, serviço, área e cliente." },
  { path: "/contato", title: "Contato", text: "formulário para pedir um projeto ou falar com a agência." },
  { path: "/feedback", title: "Feedback", text: "canal para clientes, parceiros, alunos e comunidade." },
];

/** Remove linhas em branco repetidas e garante quebra final. */
const tidy = (lines: string[]) =>
  `${lines
    .filter((line, index, all) => !(line === "" && all[index - 1] === ""))
    .join("\n")
    .trim()}\n`;

/** Resumo em Markdown para assistentes de IA (padrão https://llmstxt.org). */
export async function buildLlmsTxt(): Promise<string> {
  const [settings, areas, services, cases] = await Promise.all([
    getSiteSettings(),
    listAreas(),
    listServices(),
    listCases(),
  ]);
  return tidy([
    `# ${settings.name}`,
    "",
    `> ${settings.description}`,
    "",
    `A ${settings.name} ("${settings.shortName}") é a agência experimental de comunicação da FECAP (Fundação Escola de Comércio Álvares Penteado), em São Paulo/SP. Slogan: "${settings.tagline}". Contato comercial e institucional pelo formulário em ${siteUrl}/contato.`,
    "",
    "## Páginas",
    "",
    ...PAGES.map((page) => `- [${page.title}](${siteUrl}${page.path}): ${page.text}`),
    "",
    "## Áreas de atuação",
    "",
    ...areas.map((area) => `- [${area.name}](${siteUrl}/areas#${area.slug}): ${area.summary}`),
    "",
    "## Serviços",
    "",
    ...services.map((service) => `- [${service.name}](${siteUrl}/servicos/${service.slug}): ${service.summary}`),
    "",
    "## Cases",
    "",
    ...cases.map(
      (item) => `- [${item.title}](${siteUrl}/cases/${item.slug}): ${item.summary} (cliente: ${item.client})`,
    ),
    "",
    "## Optional",
    "",
    `- [Conteúdo completo](${siteUrl}/llms-full.txt): descrições detalhadas de áreas, serviços e cases.`,
    `- [API pública de serviços (JSON)](${siteUrl}/api/v1/services): dados estruturados somente leitura.`,
    `- [API pública de cases (JSON)](${siteUrl}/api/v1/cases): dados estruturados somente leitura.`,
    `- [Sitemap](${siteUrl}/sitemap.xml)`,
    "",
    "Observações: o painel em /admin é restrito à equipe e não deve ser acessado nem indexado. Itens marcados como provisórios no site ainda aguardam texto final da agência.",
  ]);
}

/** Versão completa com as descrições de cada item, para leitura integral por IA. */
export async function buildLlmsFullTxt(): Promise<string> {
  const [settings, areas, services, cases] = await Promise.all([
    getSiteSettings(),
    listAreas(),
    listServices(),
    listCases(),
  ]);
  const areaName = new Map(areas.map((area) => [area.id, area.name]));
  return tidy([
    `# ${settings.name} — conteúdo completo`,
    "",
    `> ${settings.description}`,
    "",
    "## Manifesto",
    "",
    `### ${settings.manifesto.title}`,
    "",
    ...settings.manifesto.paragraphs,
    "",
    "## Sobre",
    "",
    settings.about.intro,
    "",
    `- Proposta de valor: ${settings.about.valueProposition}`,
    `- Modelo de atuação: ${settings.about.howWeWork}`,
    `- Relação com a FECAP: ${settings.about.fecapRelation}`,
    "",
    "## Áreas de atuação",
    "",
    ...areas.flatMap((area) => [
      `### ${area.name}`,
      "",
      area.description,
      "",
      `Destaques: ${area.highlights.join(", ")}. Página: ${siteUrl}/areas#${area.slug}`,
      "",
    ]),
    "## Serviços",
    "",
    ...services.flatMap((service) => [
      `### ${service.name}`,
      "",
      service.description,
      "",
      `- Áreas: ${service.areaIds
        .map((id) => areaName.get(id))
        .filter(Boolean)
        .join(", ")}`,
      `- Exemplos de entrega: ${service.examples.join("; ")}`,
      `- Página: ${siteUrl}/servicos/${service.slug}`,
      `- Solicitar: ${siteUrl}/contato?servico=${service.slug}`,
      "",
    ]),
    "## Cases",
    "",
    ...cases.flatMap((item) => [
      `### ${item.title}`,
      "",
      `- Cliente: ${item.client}`,
      `- Categoria: ${item.categoryName}`,
      ...(item.deliveryType ? [`- Tipo de entrega: ${item.deliveryType}`] : []),
      `- Resumo: ${item.summary}`,
      ...(item.challenge ? [`- Desafio: ${item.challenge}`] : []),
      ...(item.solution ? [`- Solução: ${item.solution}`] : []),
      ...(item.results ? [`- Resultados: ${item.results}`] : []),
      `- Página: ${siteUrl}/cases/${item.slug}`,
      "",
    ]),
    "## Redes sociais",
    "",
    ...Object.entries(settings.socials).map(([network, url]) => `- ${network}: ${url}`),
  ]);
}
