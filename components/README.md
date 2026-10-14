# components/

Componentes React reutilizáveis. Organização:

- `ui/` — primitivas do design system (botões, seções, cartões, badges).
- `layout/` — header, footer, navegação e elementos estruturais.
- `sections/` — blocos de página (hero, manifesto, destaques).
- `forms/` — formulários públicos (Client Components com `useActionState`).
- `seo/` — dados estruturados (JSON-LD).

Regras: Server Component por padrão; marque `'use client'` só quando houver estado, efeito ou
evento. Nenhum componente acessa banco diretamente — dados chegam por props.
