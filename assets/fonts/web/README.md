# Fontes web

Arquivos que o site serve pelo `next/font/local` (`app/fonts.ts`): a Poppins da marca e as demais opções da
tela **Aparência do site** (`THEME_FONTS` em `lib/domain/content/theme.ts`). Ficam no repositório para que o
`next build` não dependa da rede. Com `next/font/google`, o build baixava as fontes do Google Fonts e falhava
quando o download estourava o tempo.

Todas as famílias usam a SIL Open Font License 1.1: o `OFL.txt` de cada pasta acompanha o arquivo e não
pode ser removido. Os `.ttf` de `assets/fonts/` (sem `web/`) são outra coisa: servem às imagens Open Graph.

## Origem e recorte

Fonte: repositório [google/fonts](https://github.com/google/fonts), pasta `ofl/<família>`, em 13/11/2026.
É a mesma origem que o Google Fonts publica.

| Pasta             | Arquivo de origem                        | Peso       | Versão | Tamanho |
| ----------------- | ---------------------------------------- | ---------- | ------ | ------- |
| `poppins`         | `Poppins-{Light…Black}.ttf` (7 estáticos) | 300 a 900  | 4.004  | ~11 KB cada |
| `inter`           | `Inter[opsz,wght].ttf`                   | 100 a 900  | 4.001  | 136 KB  |
| `montserrat`      | `Montserrat[wght].ttf`                   | 100 a 900  | 9.000  | 144 KB  |
| `nunito`          | `Nunito[wght].ttf`                       | 200 a 1000 | 3.602  | 60 KB   |
| `raleway`         | `Raleway[wght].ttf`                      | 100 a 900  | 4.026  | 75 KB   |
| `dmsans`          | `DMSans[opsz,wght].ttf`                  | 100 a 1000 | 4.004  | 48 KB   |
| `worksans`        | `WorkSans[wght].ttf`                     | 100 a 900  | 2.012  | 107 KB  |
| `playfairdisplay` | `PlayfairDisplay[wght].ttf`              | 400 a 900  | 1.203  | 67 KB   |
| `merriweather`    | `Merriweather[opsz,wdth,wght].ttf`       | 300 a 900  | 2.100  | 430 KB  |

Cada `.woff2` junta os recortes `latin` e `latin-ext` do Google Fonts, os mesmos que o site pedia antes
(`subsets: ["latin", "latin-ext"]`). Fica só o eixo de peso, como o `next/font/google` entregava: `opsz` e
`wdth` foram fixados no valor padrão. Sem hinting, como o Google serve. A data do arquivo de origem é mantida, então gerar de novo a partir
dos mesmos `.ttf` dá arquivos idênticos.

A Poppins, única fonte pré-carregada, ficou menor que a do Google (cerca de 11 KB contra 13,5 KB por peso,
somando os dois recortes). As outras crescem um pouco, e a Merriweather bastante (430 KB contra 172 KB):
num arquivo só, o kerning inclui os pares entre letras dos dois recortes. Elas só são baixadas quando
escolhidas na aparência do site.

## Gerar de novo

Precisa de Python com `fonttools` e `brotli`. Baixe os `.ttf` e o `OFL.txt` de cada família de
`https://raw.githubusercontent.com/google/fonts/main/ofl/<pasta>/` para `origem/<pasta>/`, e rode o script
abaixo com `python3 gerar.py origem saida`. Copie `saida/<pasta>/*.woff2` e o `OFL.txt` para esta pasta e
ajuste o `weight` em `app/fonts.ts` se a faixa de peso mudar.

```python
import io, sys
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset

# latin + latin-ext, como na CSS do Google Fonts
RANGES = (
    "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,"
    "U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD,"
    "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1D00-1DBF,U+1E00-1E9F,"
    "U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C4,U+2113,U+2C60-2C7F,U+A720-A7FF"
)
codes = set()
for part in RANGES.split(","):
    a, _, b = part[2:].partition("-")
    codes.update(range(int(a, 16), int(b or a, 16) + 1))

src, dst = Path(sys.argv[1]), Path(sys.argv[2])
for ttf in sorted(src.rglob("*.ttf")):
    font = TTFont(ttf, lazy=False, recalcTimestamp=False)
    if "fvar" in font:
        pin = {a.axisTag: None for a in font["fvar"].axes if a.axisTag != "wght"}
        if pin:
            buf = io.BytesIO()
            instancer.instantiateVariableFont(font, pin).save(buf)
            buf.seek(0)
            font = TTFont(buf, recalcTimestamp=False)
    opts = subset.Options()
    opts.flavor = "woff2"
    opts.layout_features = ["*"]
    opts.name_IDs = ["*"]
    opts.name_languages = ["*"]
    opts.notdef_outline = True
    opts.hinting = False
    opts.desubroutinize = True
    sub = subset.Subsetter(opts)
    sub.populate(unicodes=codes)
    sub.subset(font)
    out = dst / ttf.parent.name / f"{ttf.stem.split('[')[0]}.woff2"
    out.parent.mkdir(parents=True, exist_ok=True)
    font.flavor = "woff2"
    font.save(out)
```
