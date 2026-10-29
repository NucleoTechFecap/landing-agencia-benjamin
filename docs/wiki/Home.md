# Agência Benjamin — Wiki técnica

Documentação de desenvolvimento, operação e manutenção da plataforma institucional da **Agência
Benjamin**, agência experimental de comunicação da FECAP. O produto reúne o site público, o
portfólio de cases, os formulários de contato e um painel (CMS) para a equipe da agência atualizar o
conteúdo sem depender de deploy. O **NúcleoTech** desenvolve e mantém a plataforma.

## Comece por aqui

| Se você quer… | Leia |
| --- | --- |
| Rodar o projeto na sua máquina | [[Começando]] |
| Entender como o código está organizado | [[Arquitetura]] |
| Contribuir com código ou documentação | [[Contribuição]] |
| Saber como o conteúdo é editado e publicado | [[CMS e conteúdo]] |
| Mexer no banco, nas migrations ou na RLS | [[Banco de dados e migrations]] |
| Consumir os dados do site por API | [[API pública]] |
| Rodar e escrever testes | [[Testes e qualidade]] |
| Configurar um ambiente | [[Ambientes e variáveis]] |
| Publicar uma versão | [[CI-CD e releases]] |
| Tratar segurança e dados pessoais | [[Segurança e privacidade]] |
| Agir quando algo der errado em produção | [[Operação e incidentes]] |
| Resolver um erro comum | [[Solução de problemas]] |
| Ver o que vem depois do MVP | [[Roadmap pós-MVP]] |
| Saber quem cuida de cada frente | [[Equipe e responsáveis]] |

## Stack em uma linha

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Supabase (Postgres, Auth,
Storage e RLS) · Vitest e Playwright · Vercel.

## Fontes oficiais

A Wiki é um mapa: o detalhe técnico vive no repositório, revisado por pull request.

- [README](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/README.md)
- [Índice da documentação técnica (`docs/`)](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/README.md)
- [Guia de contribuição](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/CONTRIBUTING.md)
- [Política de segurança](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/SECURITY.md)

> Segredos, tokens, chaves e dados pessoais reais nunca entram na Wiki, em issues ou em pull
> requests. Para relatar uma vulnerabilidade, use o canal privado descrito em
> [[Segurança e privacidade]].
