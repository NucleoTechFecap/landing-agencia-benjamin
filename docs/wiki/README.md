# Fonte da Wiki da Agência Benjamin

Este diretório guarda as páginas Markdown da [Wiki do GitHub](https://github.com/NucleoTechFecap/landing-agencia-benjamin/wiki)
do projeto. A Wiki é um mapa curto: o detalhe técnico fica em `docs/`, revisado por pull request.
Ao mudar fluxos de operação, banco, segurança ou publicação, atualize a fonte em `docs/` e a página
correspondente daqui no mesmo PR.

## Páginas

Na Wiki, o **nome do arquivo é o título da página**, e os links `[[…]]` usam esse título. Por isso os
nomes têm acento e precisam ser digitados exatamente assim.

| Título na Wiki | Arquivo |
| --- | --- |
| Home | `Home.md` |
| Começando | `Começando.md` |
| Arquitetura | `Arquitetura.md` |
| Contribuição | `Contribuição.md` |
| Testes e qualidade | `Testes-e-qualidade.md` |
| CMS e conteúdo | `CMS-e-conteúdo.md` |
| Banco de dados e migrations | `Banco-de-dados-e-migrations.md` |
| API pública | `API-pública.md` |
| Ambientes e variáveis | `Ambientes-e-variáveis.md` |
| CI-CD e releases | `CI-CD-e-releases.md` |
| Segurança e privacidade | `Segurança-e-privacidade.md` |
| Operação e incidentes | `Operação-e-incidentes.md` |
| Solução de problemas | `Solução-de-problemas.md` |
| Roadmap pós-MVP | `Roadmap-pós-MVP.md` |
| Equipe e responsáveis | `Equipe-e-responsáveis.md` |
| _(barra lateral)_ | `_Sidebar.md` |
| _(rodapé)_ | `_Footer.md` |

## Como publicar

O GitHub só cria o repositório da Wiki (`landing-agencia-benjamin.wiki.git`) depois que a primeira
página é salva pela interface. Crie a **Home** pela interface colando o conteúdo de `Home.md`. Depois,
escolha uma das formas abaixo.

**Pela interface:** em *New page*, use o título exato da tabela e cole o conteúdo do arquivo. A barra
lateral e o rodapé aparecem nos links *Add a custom sidebar* e *Add a custom footer*.

**Pelo Git (todas de uma vez):**

```bash
git clone https://github.com/NucleoTechFecap/landing-agencia-benjamin.wiki.git ../landing-agencia-benjamin.wiki
find docs/wiki -maxdepth 1 -name '*.md' ! -name README.md -exec cp {} ../landing-agencia-benjamin.wiki/ \;
cd ../landing-agencia-benjamin.wiki
git add -A
git commit -m "docs: wiki completa do projeto"
git push origin master
```
