/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : og-card.tsx
 Descrição    : Arte das imagens de compartilhamento (Open Graph).

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

/**
 * Arte das imagens Open Graph (1200×630) gerada com ImageResponse. Usa apenas estilos
 * inline suportados pelo Satori. `logoSrc` é o logotipo em data URL.
 */
export function OgCard({
  eyebrow,
  title,
  subtitle,
  logoSrc,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  logoSrc: string;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "#004a1b",
        color: "#f1fcd0",
        padding: "64px 72px",
        position: "relative",
        fontFamily: "Poppins",
        fontWeight: 700,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          flex: 1,
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{
              display: "flex",
              border: "3px solid #24d139",
              color: "#24d139",
              borderRadius: 999,
              padding: "8px 22px",
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 3,
              textTransform: "uppercase",
            }}
          >
            {eyebrow}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse não usa next/image */}
          <img src={logoSrc} alt="" width={210} height={134} />
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: title.length > 48 ? 64 : 80, fontWeight: 900, lineHeight: 1.02, letterSpacing: -2 }}>
            {title}
          </div>
          {subtitle ? (
            <div style={{ fontSize: 32, marginTop: 24, color: "#a0ef91", lineHeight: 1.3 }}>{subtitle}</div>
          ) : null}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: "#a0ef91" }}>
          <span>Agência experimental da FECAP</span>
          <span style={{ fontWeight: 800, letterSpacing: 4, textTransform: "uppercase" }}>Somando diferenças</span>
        </div>
      </div>
    </div>
  );
}
