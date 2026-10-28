/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : seed.sql
 Descrição    : Seed de desenvolvimento gerado de content/ (só banco local; recusado em produção).

 Desenvolvedor: Vinicius Binda

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 28/10/2026
 Modificado em: 28/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 28/10/2026 Vinicius Binda             Criação inicial (DBX-02).
──────────────────────────────────────────────────────────────────────────────
*/

-- GERADO por scripts/content-seed.mjs a partir de content/. Não edite à mão: altere content/ e
-- rode `npm run seed:write`.
--
-- Roda só no `npx supabase db reset` local. O `db push` não executa o seed; se alguém o rodar
-- num banco remoto (`db push --include-seed`, SQL Editor, psql), o bloco abaixo recusa bancos
-- marcados como produção (docs/operacao/provisionamento-producao.md).
do $$
begin
  if coalesce(current_setting('app.ambiente', true), '') = 'producao' then
    raise exception 'Seed de desenvolvimento recusado: este banco é de produção (app.ambiente = producao).';
  end if;
end;
$$;

insert into public.media_assets (id, path, mime_type, width, height, alt_text, decorative) values
  (md5('media:/brand/cases/aventura-de-construir.webp')::uuid, '/brand/cases/aventura-de-construir.webp', 'image/webp', 1200, 750, 'Ilustração provisória com ícone de envio e sticker da Agência Benjamin', false),
  (md5('media:/brand/cases/meridiano.webp')::uuid, '/brand/cases/meridiano.webp', 'image/webp', 1200, 750, 'Ilustração provisória com ícone de coração e sticker da Agência Benjamin', false),
  (md5('media:/brand/cases/fecap.webp')::uuid, '/brand/cases/fecap.webp', 'image/webp', 1200, 750, 'Ilustração provisória com ícone de megafone e sticker da Agência Benjamin', false),
  (md5('media:/brand/logos/simbolo.png')::uuid, '/brand/logos/simbolo.png', 'image/png', null, null, 'Símbolo da Agência Benjamin (mídia fictícia sem uso)', false)
on conflict (id) do nothing;

insert into public.areas (id, slug, name, summary, description, highlights, icon, sort_order, status, provisional, published_at, archived_at) values
  (md5('area-eventos-e-parcerias')::uuid, 'eventos-e-parcerias', 'Eventos e Parcerias', 'Planejamento e produção de eventos e prospecção de conexões estratégicas.', 'Concebe, organiza e produz eventos que aproximam marcas e públicos, além de buscar parcerias que ampliam o alcance dos projetos da agência.', array['Planejamento de eventos', 'Produção e operação', 'Prospecção de parcerias'], 'calendario', 1, 'published', true, '2026-10-13T00:00:00.000Z'::timestamptz, null),
  (md5('area-social-media')::uuid, 'social-media', 'Social Media', 'Estratégia e gestão multicanal, com foco em Instagram, TikTok e LinkedIn.', 'Planeja, produz e acompanha a presença das marcas nas redes sociais, adaptando linguagem e formato a cada canal.', array['Instagram', 'TikTok', 'LinkedIn'], 'coracao', 2, 'published', true, '2026-10-13T00:00:00.000Z'::timestamptz, null),
  (md5('area-comunicacao-interna')::uuid, 'comunicacao-interna', 'Comunicação Interna', 'Comunicação interna, clima, engajamento e alinhamento do time.', 'Cuida de como as pessoas de uma organização se informam e se conectam, fortalecendo clima, engajamento e alinhamento.', array['Campanhas internas', 'Clima e engajamento', 'Alinhamento de times'], 'comentario', 3, 'published', true, '2026-10-13T00:00:00.000Z'::timestamptz, null),
  (md5('area-copywriting')::uuid, 'copywriting', 'Copywriting', 'Textos estratégicos, narrativas, conteúdos, materiais para blogs e copys.', 'Transforma estratégia em palavras: do texto curto de uma campanha ao artigo de blog, com voz adequada a cada marca.', array['Textos estratégicos', 'Narrativas e conteúdos', 'Blogs e copys'], 'enviado', 4, 'published', true, '2026-10-13T00:00:00.000Z'::timestamptz, null),
  (md5('area-criacao')::uuid, 'criacao', 'Criação', 'Identidade visual, design, direção criativa e produção audiovisual.', 'Dá forma às ideias com identidade visual, peças gráficas, direção criativa e produção audiovisual.', array['Identidade visual', 'Design e direção criativa', 'Produção audiovisual'], 'raio', 5, 'published', true, '2026-10-13T00:00:00.000Z'::timestamptz, null),
  (md5('area-assessoria-de-imprensa')::uuid, 'assessoria-de-imprensa', 'Assessoria de Imprensa', 'Relacionamento com a mídia, pautas, porta-vozes e releases.', 'Constrói pontes entre organizações e veículos de comunicação: pautas, releases, preparação de porta-vozes e relacionamento institucional.', array['Relacionamento com a mídia', 'Pautas e releases', 'Gestão de porta-vozes'], 'megafone', 6, 'published', true, '2026-10-13T00:00:00.000Z'::timestamptz, null)
on conflict (id) do nothing;

insert into public.services (id, slug, name, summary, description, examples, icon, image_media_id, featured, sort_order, status, provisional, published_at, archived_at) values
  (md5('service-estrategia-digital')::uuid, 'estrategia-digital', 'Estratégia Digital', 'Diagnóstico, objetivos e plano de presença digital para a sua marca.', 'Analisamos o cenário da marca, definimos públicos, objetivos e canais e organizamos um plano de comunicação digital que orienta conteúdo, campanhas e métricas.', array['Diagnóstico de presença digital', 'Plano de comunicação', 'Definição de indicadores'], 'estrela', null, true, 1, 'published', true, '2026-10-13T00:00:00.000Z'::timestamptz, null),
  (md5('service-social-media')::uuid, 'social-media', 'Social Media', 'Planejamento, produção e gestão de redes sociais.', 'Calendário editorial, criação de posts e vídeos curtos, publicação e acompanhamento de resultados em Instagram, TikTok e LinkedIn.', array['Calendário editorial', 'Posts e vídeos curtos', 'Relatórios de desempenho'], 'coracao', null, true, 2, 'published', true, '2026-10-13T00:00:00.000Z'::timestamptz, null),
  (md5('service-eventos')::uuid, 'eventos', 'Eventos', 'Concepção, produção e cobertura de eventos.', 'Do conceito à operação no dia: planejamento, cronograma, produção, parceiros e cobertura de comunicação do evento.', array['Planejamento e cronograma', 'Produção e operação', 'Cobertura do evento'], 'calendario', null, false, 3, 'published', true, '2026-10-13T00:00:00.000Z'::timestamptz, null),
  (md5('service-producao-de-conteudo')::uuid, 'producao-de-conteudo', 'Produção de Conteúdo', 'Conteúdos em texto, imagem e vídeo alinhados à estratégia.', 'Pautas, roteiros, textos, imagens e vídeos produzidos para informar, engajar e gerar relacionamento com o público da marca.', array['Pautas e roteiros', 'Conteúdo para blog e redes', 'Séries editoriais'], 'salvo', null, true, 4, 'published', true, '2026-10-13T00:00:00.000Z'::timestamptz, null),
  (md5('service-copywriting')::uuid, 'copywriting', 'Copywriting', 'Textos que vendem a ideia certa, do jeito certo.', 'Criação de textos estratégicos, narrativas de marca, copys para campanhas e artigos, com tom de voz definido para cada cliente.', array['Copys de campanha', 'Artigos para blog', 'Narrativa e tom de voz'], 'enviado', null, false, 5, 'published', true, '2026-10-13T00:00:00.000Z'::timestamptz, null),
  (md5('service-design-e-identidade-visual')::uuid, 'design-e-identidade-visual', 'Design e Identidade Visual', 'Identidade, peças gráficas e direção de arte.', 'Criação e evolução de identidades visuais, peças para meios digitais e impressos e direção de arte de campanhas.', array['Identidade visual', 'Peças digitais e impressas', 'Direção de arte'], 'raio', null, true, 6, 'published', true, '2026-10-13T00:00:00.000Z'::timestamptz, null),
  (md5('service-audiovisual')::uuid, 'audiovisual', 'Audiovisual', 'Vídeos, fotos e coberturas para contar histórias.', 'Roteiro, captação e edição de vídeos institucionais, conteúdos para redes e cobertura fotográfica e audiovisual de eventos.', array['Vídeos institucionais', 'Vídeos para redes', 'Cobertura de eventos'], 'like', null, true, 7, 'published', true, '2026-10-13T00:00:00.000Z'::timestamptz, null),
  (md5('service-assessoria-de-imprensa')::uuid, 'assessoria-de-imprensa', 'Assessoria de Imprensa / PR', 'Relacionamento com a imprensa e reputação.', 'Elaboração de pautas e releases, relacionamento com veículos, preparação de porta-vozes e acompanhamento de publicações (clipping).', array['Pautas e releases', 'Media training', 'Clipping'], 'megafone', null, true, 8, 'published', true, '2026-10-13T00:00:00.000Z'::timestamptz, null),
  (md5('service-comunicacao-interna')::uuid, 'comunicacao-interna', 'Comunicação Interna', 'Engajamento e alinhamento de times.', 'Diagnóstico de comunicação interna, campanhas para colaboradores, canais internos e ações de clima e engajamento.', array['Campanhas internas', 'Canais e rituais', 'Ações de engajamento'], 'comentario', null, false, 9, 'published', true, '2026-10-13T00:00:00.000Z'::timestamptz, null),
  (md5('service-ficticio-arquivado')::uuid, 'servico-ficticio-arquivado', 'Serviço fictício arquivado', 'Item fictício do seed de desenvolvimento, arquivado: nunca aparece no site.', 'Existe só no banco local, para testar listagens do painel e a RLS de itens arquivados.', '{}'::text[], null, null, false, 99, 'archived', true, '2026-10-13T00:00:00.000Z'::timestamptz, '2026-10-20T00:00:00.000Z'::timestamptz)
on conflict (id) do nothing;

insert into public.service_areas (service_id, area_id) values
  (md5('service-estrategia-digital')::uuid, md5('area-social-media')::uuid),
  (md5('service-estrategia-digital')::uuid, md5('area-copywriting')::uuid),
  (md5('service-social-media')::uuid, md5('area-social-media')::uuid),
  (md5('service-eventos')::uuid, md5('area-eventos-e-parcerias')::uuid),
  (md5('service-producao-de-conteudo')::uuid, md5('area-copywriting')::uuid),
  (md5('service-producao-de-conteudo')::uuid, md5('area-social-media')::uuid),
  (md5('service-producao-de-conteudo')::uuid, md5('area-criacao')::uuid),
  (md5('service-copywriting')::uuid, md5('area-copywriting')::uuid),
  (md5('service-design-e-identidade-visual')::uuid, md5('area-criacao')::uuid),
  (md5('service-audiovisual')::uuid, md5('area-criacao')::uuid),
  (md5('service-assessoria-de-imprensa')::uuid, md5('area-assessoria-de-imprensa')::uuid),
  (md5('service-comunicacao-interna')::uuid, md5('area-comunicacao-interna')::uuid),
  (md5('service-ficticio-arquivado')::uuid, md5('area-copywriting')::uuid)
on conflict (service_id, area_id) do nothing;

insert into public.case_categories (id, slug, name, description, sort_order, status, provisional, published_at, archived_at) values
  (md5('category-copywriting')::uuid, 'copywriting', 'Copywriting', 'Artigos, textos e narrativas desenvolvidos pela Agência Benjamin.', 1, 'published', false, '2026-10-13T00:00:00.000Z'::timestamptz, null),
  (md5('category-social-media-e-criacao')::uuid, 'social-media-e-criacao', 'Social Media & Criação', 'Desdobramentos visuais, criativos e estratégicos para as redes sociais dos clientes.', 2, 'published', false, '2026-10-13T00:00:00.000Z'::timestamptz, null),
  (md5('category-assessoria-de-imprensa')::uuid, 'assessoria-de-imprensa', 'Assessoria de Imprensa', 'Releases, pautas, publicações, clippings e matérias conquistadas.', 3, 'published', false, '2026-10-13T00:00:00.000Z'::timestamptz, null)
on conflict (id) do nothing;

insert into public.cases (id, slug, title, client_name, category_id, delivery_type, summary, challenge, solution, results, cover_media_id, external_links, reference_month, team, featured, sort_order, status, provisional, published_at, archived_at) values
  (md5('case-aventura-de-construir')::uuid, 'aventura-de-construir', 'Conteúdo para o blog Aventura de Construir', 'Aventura de Construir', md5('category-copywriting')::uuid, 'Artigos para blog', 'Artigos e textos desenvolvidos pela Agência Benjamin para o blog Aventura de Construir.', null, null, null, md5('media:/brand/cases/aventura-de-construir.webp')::uuid, '[]'::jsonb, null, '{}'::text[], true, 1, 'published', true, '2026-10-13T00:00:00.000Z'::timestamptz, null),
  (md5('case-meridiano')::uuid, 'meridiano', 'Social media e criação para a Meridiano', 'Meridiano', md5('category-social-media-e-criacao')::uuid, 'Redes sociais', 'Desdobramentos visuais, criativos e estratégicos desenvolvidos para as redes sociais da Meridiano.', null, null, null, md5('media:/brand/cases/meridiano.webp')::uuid, '[]'::jsonb, null, '{}'::text[], true, 2, 'published', true, '2026-10-13T00:00:00.000Z'::timestamptz, null),
  (md5('case-fecap')::uuid, 'fecap', 'Assessoria de imprensa para a FECAP', 'FECAP', md5('category-assessoria-de-imprensa')::uuid, 'Releases e publicações', 'Releases, pautas e conteúdos publicados no site da FECAP e conquistados em veículos externos pela Agência Benjamin.', null, null, null, md5('media:/brand/cases/fecap.webp')::uuid, '[]'::jsonb, null, '{}'::text[], true, 3, 'published', true, '2026-10-13T00:00:00.000Z'::timestamptz, null),
  (md5('case-ficticio-em-rascunho')::uuid, 'case-ficticio-em-rascunho', 'Case fictício em rascunho', 'Cliente Fictício', md5('category-copywriting')::uuid, null, 'Item fictício do seed de desenvolvimento, em rascunho: nunca aparece no site.', null, null, null, null, '[]'::jsonb, null, '{}'::text[], false, 99, 'draft', true, null, null)
on conflict (id) do nothing;

insert into public.case_services (case_id, service_id) values
  (md5('case-aventura-de-construir')::uuid, md5('service-copywriting')::uuid),
  (md5('case-aventura-de-construir')::uuid, md5('service-producao-de-conteudo')::uuid),
  (md5('case-meridiano')::uuid, md5('service-social-media')::uuid),
  (md5('case-meridiano')::uuid, md5('service-design-e-identidade-visual')::uuid),
  (md5('case-fecap')::uuid, md5('service-assessoria-de-imprensa')::uuid),
  (md5('case-ficticio-em-rascunho')::uuid, md5('service-copywriting')::uuid)
on conflict (case_id, service_id) do nothing;

insert into public.ctas (id, label, placement, target_kind, target_path, target_url, target_service_id, target_case_id, target_area_id, sort_order, status, provisional, published_at, archived_at) values
  (md5('cta-hero-projeto')::uuid, 'Quero um projeto', 'home-hero', 'contact', null, null, null, null, null, 1, 'published', false, '2026-10-13T00:00:00.000Z'::timestamptz, null),
  (md5('cta-hero-servicos')::uuid, 'Conheça os serviços', 'home-hero', 'internal', '/servicos', null, null, null, null, 2, 'published', false, '2026-10-13T00:00:00.000Z'::timestamptz, null),
  (md5('cta-destaque-cases')::uuid, 'Ver cases', 'home-highlight', 'internal', '/cases', null, null, null, null, 1, 'published', false, '2026-10-13T00:00:00.000Z'::timestamptz, null),
  (md5('cta-destaque-sobre')::uuid, 'Sobre a Benjamin', 'home-highlight', 'internal', '/sobre', null, null, null, null, 2, 'published', false, '2026-10-13T00:00:00.000Z'::timestamptz, null),
  (md5('cta-destaque-contato')::uuid, 'Fale com a gente', 'home-highlight', 'internal', '/contato', null, null, null, null, 3, 'published', false, '2026-10-13T00:00:00.000Z'::timestamptz, null)
on conflict (id) do nothing;

insert into public.site_settings (id, name, short_name, tagline, description, manifesto, about, contact, socials, keywords) values
  (true, 'Agência Benjamin', 'Benja', 'Somando diferenças', 'Agência experimental de comunicação da FECAP. Estratégia, conteúdo, criação, eventos e assessoria de imprensa feitos por estudantes em projetos reais para marcas e organizações.', '{"title":"Comunicação que soma diferenças.","paragraphs":["Toda marca tem algo a dizer. Nem toda marca é ouvida.","A Benjamin nasce dentro da FECAP para provar que comunicação boa é feita de gente diferente pensando junto: estratégia, texto, imagem, evento e relacionamento trabalhando pelo mesmo objetivo.","Aqui, cada projeto é real, cada entrega é aprendizado e cada ideia é testada no mundo — não só na sala de aula."],"provisional":true}'::jsonb, '{"title":"Uma agência experimental dentro da FECAP","intro":"A Agência Benjamin é a agência experimental de comunicação da FECAP. Reúne estudantes que atuam em áreas complementares para desenvolver projetos de comunicação para clientes, parceiros e para a própria comunidade acadêmica.","valueProposition":"Unimos o olhar curioso de quem está se formando à responsabilidade de entregar para marcas reais: estratégia, criatividade e execução com acompanhamento próximo.","howWeWork":"Cada demanda passa por briefing, planejamento e produção com times formados pelas áreas da agência — de social media a assessoria de imprensa — com validação em cada etapa.","fecapRelation":"Vinculada à FECAP, a Benjamin conecta a formação acadêmica à prática profissional, fortalecendo a presença da instituição e de seus parceiros.","provisional":true}'::jsonb, '{"address":"FECAP — Av. da Liberdade, 532, Liberdade, São Paulo/SP","mapsUrl":"https://www.google.com/maps/search/?api=1&query=FECAP+Av.+da+Liberdade+532+S%C3%A3o+Paulo"}'::jsonb, '{"instagram":"https://www.instagram.com/agenciabenja","tiktok":"https://www.tiktok.com/@tik.benja","linkedin":"https://www.linkedin.com/company/benjamin-fecap/"}'::jsonb, array['Agência Benjamin', 'Benja', 'agência experimental', 'agência experimental FECAP', 'agência de comunicação', 'agência de comunicação São Paulo', 'FECAP', 'estratégia digital', 'social media', 'gestão de redes sociais', 'produção de conteúdo', 'copywriting', 'design e identidade visual', 'audiovisual', 'eventos e parcerias', 'assessoria de imprensa', 'comunicação interna', 'portfólio de comunicação', 'cases de comunicação'])
on conflict (id) do nothing;
