/**
 * Slide JSX for the "Grant of the Day" Instagram/LinkedIn carousels.
 *
 * Important constraints (next/og + Satori):
 *  - Every flexbox child of a flex parent needs `display: flex` (we set it
 *    explicitly even when not strictly required, to avoid surprises).
 *  - Custom fonts must be loaded as ArrayBuffers and passed to ImageResponse.
 *  - No CSS classes — only inline `style` props.
 *
 * Anti-cannibalism: these slides are deliberately incomplete. We show
 * "what + how much + by when" but never the application URL, the full
 * eligibility, or the funder contact. Those live behind login on Émile.
 */

import type { CarouselGrant } from "./selector";
import {
  formatAmountTeaser,
  formatDeadline,
  truncate,
  eligibilityTease,
  topThemes,
  shortFunder,
  daysUntil,
} from "./format";

export const SLIDE_SIZE = 1080;
export const FOREGROUND = "#1a1a1a";
export const CARD = "#ffffff";
export const MUTED = "#666666";
export const SHADOW = "8px 8px 0px 0px #1a1a1a";

interface SlideContext {
  grant: CarouselGrant;
  accent: string;
  totalGrants: number;
  siteUrl: string;
}

const baseSlide = (accent: string): React.CSSProperties => ({
  display: "flex",
  flexDirection: "column",
  width: SLIDE_SIZE,
  height: SLIDE_SIZE,
  backgroundColor: accent,
  padding: 64,
  fontFamily: "Inter, system-ui, sans-serif",
  color: FOREGROUND,
  position: "relative",
});

const card: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  backgroundColor: CARD,
  border: `4px solid ${FOREGROUND}`,
  borderRadius: 24,
  boxShadow: SHADOW,
  padding: 56,
};

const logoBadge = (accent: string, size: "sm" | "lg" = "sm") => ({
  display: "flex",
  alignItems: "baseline",
  fontWeight: 900,
  fontSize: size === "lg" ? 72 : 36,
  letterSpacing: "-0.04em",
  color: FOREGROUND,
  gap: 4,
});

function EmileLogo({
  accent,
  size = "sm",
}: {
  accent: string;
  size?: "sm" | "lg";
}) {
  const dotSize = size === "lg" ? 24 : 12;
  const offset = size === "lg" ? 6 : 3;
  return (
    <div style={logoBadge(accent, size)}>
      <span>emile</span>
      <span
        style={{
          display: "flex",
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: accent,
          marginLeft: offset,
          marginBottom: offset,
        }}
      />
    </div>
  );
}

function FooterLogo({ accent }: { accent: string }) {
  return (
    <div
      style={{
        display: "flex",
        position: "absolute",
        bottom: 32,
        right: 48,
      }}
    >
      <EmileLogo accent={accent} />
    </div>
  );
}

function SlideNumber({ n, accent }: { n: number; accent: string }) {
  return (
    <div
      style={{
        display: "flex",
        position: "absolute",
        top: 32,
        right: 48,
        backgroundColor: FOREGROUND,
        color: accent,
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 900,
        fontSize: 28,
      }}
    >
      {n}
    </div>
  );
}

// ── Slide 1 — HOOK ──────────────────────────────────────────────────────────
// Landing-page-style hero: grant TITLE is the headline. Amount + deadline
// are the supporting metadata. Mirrors how the Émile homepage opens with a
// big bold promise and the meta lives underneath.
export function Slide1Hook({ grant, accent }: SlideContext) {
  const days = daysUntil(grant.deadline);
  const amountTease = formatAmountTeaser(grant.max_amount_eur);
  return (
    <div style={baseSlide(accent)}>
      <SlideNumber n={1} accent={accent} />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          justifyContent: "center",
          gap: 36,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 26,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          <span
            style={{
              display: "flex",
              backgroundColor: FOREGROUND,
              color: accent,
              padding: "10px 20px",
              borderRadius: 999,
            }}
          >
            ⚡ Subvention du jour
          </span>
        </div>

        {/* Hero title — big, bold, dominant. Auto-shrinks on long titles. */}
        <div
          style={{
            display: "flex",
            fontSize: grant.title.length > 80 ? 76 : grant.title.length > 50 ? 96 : 116,
            fontWeight: 900,
            lineHeight: 1.02,
            letterSpacing: "-0.04em",
            color: FOREGROUND,
          }}
        >
          {truncate(grant.title, 140)}
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 28,
            color: FOREGROUND,
            fontWeight: 700,
            opacity: 0.85,
          }}
        >
          {shortFunder(grant.funder)}
        </div>

        {/* Meta band: amount + deadline — same row, equal weight. */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            marginTop: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: CARD,
              border: `4px solid ${FOREGROUND}`,
              borderRadius: 20,
              boxShadow: SHADOW,
              padding: "20px 28px",
              fontSize: 40,
              fontWeight: 900,
              letterSpacing: "-0.02em",
            }}
          >
            💰 {amountTease}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              backgroundColor: CARD,
              border: `4px solid ${FOREGROUND}`,
              borderRadius: 20,
              boxShadow: SHADOW,
              padding: "20px 28px",
              fontSize: 28,
              fontWeight: 800,
            }}
          >
            <span>📅 {formatDeadline(grant.deadline)}</span>
            {typeof days === "number" && days > 0 && (
              <span
                style={{
                  display: "flex",
                  backgroundColor: FOREGROUND,
                  color: accent,
                  padding: "6px 14px",
                  borderRadius: 999,
                  fontSize: 22,
                }}
              >
                J-{days}
              </span>
            )}
          </div>
        </div>
      </div>

      <FooterLogo accent={accent} />
    </div>
  );
}

// ── Slide 2 — QUOI ──────────────────────────────────────────────────────────
export function Slide2What({ grant, accent }: SlideContext) {
  return (
    <div style={baseSlide(accent)}>
      <SlideNumber n={2} accent={accent} />

      <div
        style={{
          display: "flex",
          fontSize: 64,
          fontWeight: 900,
          letterSpacing: "-0.03em",
          marginBottom: 40,
        }}
      >
        Qu&apos;est-ce que c&apos;est&nbsp;?
      </div>

      <div style={{ ...card, gap: 24, flex: 1 }}>
        <div
          style={{
            display: "flex",
            fontSize: 32,
            fontWeight: 800,
            lineHeight: 1.2,
          }}
        >
          {truncate(grant.title, 130)}
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 26,
            color: FOREGROUND,
            lineHeight: 1.4,
            fontWeight: 500,
          }}
        >
          {truncate(grant.summary || "Un appel à projets sélectionné par Émile pour son potentiel de financement.", 280)}
        </div>

        <div
          style={{
            display: "flex",
            marginTop: "auto",
            backgroundColor: accent,
            border: `3px solid ${FOREGROUND}`,
            borderRadius: 999,
            padding: "12px 24px",
            fontSize: 22,
            fontWeight: 800,
            alignSelf: "flex-start",
          }}
        >
          🏛️ {shortFunder(grant.funder)}
        </div>
      </div>

      <FooterLogo accent={accent} />
    </div>
  );
}

// ── Slide 3 — POURQUOI ──────────────────────────────────────────────────────
export function Slide3Why({ grant, accent }: SlideContext) {
  const themes = topThemes(grant, 4);
  const tease = eligibilityTease(grant);
  return (
    <div style={baseSlide(accent)}>
      <SlideNumber n={3} accent={accent} />

      <div
        style={{
          display: "flex",
          fontSize: 64,
          fontWeight: 900,
          letterSpacing: "-0.03em",
          marginBottom: 40,
        }}
      >
        Pourquoi postuler&nbsp;?
      </div>

      <div style={{ ...card, gap: 32, flex: 1 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              fontWeight: 700,
              color: MUTED,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Thématiques
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            {themes.length > 0 ? (
              themes.map((t) => (
                <div
                  key={t}
                  style={{
                    display: "flex",
                    backgroundColor: accent,
                    border: `3px solid ${FOREGROUND}`,
                    borderRadius: 999,
                    padding: "10px 20px",
                    fontSize: 24,
                    fontWeight: 800,
                  }}
                >
                  {truncate(t, 30)}
                </div>
              ))
            ) : (
              <div
                style={{
                  display: "flex",
                  fontSize: 24,
                  color: MUTED,
                  fontWeight: 600,
                }}
              >
                Multi-thématique
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginTop: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 22,
              fontWeight: 700,
              color: MUTED,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Pour qui&nbsp;?
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              fontWeight: 600,
              lineHeight: 1.3,
            }}
          >
            ✓ {tease}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              color: MUTED,
              fontStyle: "italic",
              fontWeight: 500,
              marginTop: 8,
            }}
          >
            (Critères complets disponibles sur Émile.)
          </div>
        </div>
      </div>

      <FooterLogo accent={accent} />
    </div>
  );
}

// ── Slide 4 — COMMENT ───────────────────────────────────────────────────────
export function Slide4How({ accent }: SlideContext) {
  const steps = [
    { n: "1", t: "Décrivez votre projet sur Émile" },
    { n: "2", t: "Notre IA trouve vos matchs" },
    { n: "3", t: "Générez votre dossier en 1 clic" },
  ];
  return (
    <div style={baseSlide(accent)}>
      <SlideNumber n={4} accent={accent} />

      <div
        style={{
          display: "flex",
          fontSize: 64,
          fontWeight: 900,
          letterSpacing: "-0.03em",
          marginBottom: 56,
        }}
      >
        Comment y accéder&nbsp;?
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
          flex: 1,
        }}
      >
        {steps.map((s) => (
          <div
            key={s.n}
            style={{
              ...card,
              flexDirection: "row",
              alignItems: "center",
              gap: 32,
              padding: 36,
            }}
          >
            <div
              style={{
                display: "flex",
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: accent,
                border: `4px solid ${FOREGROUND}`,
                alignItems: "center",
                justifyContent: "center",
                fontSize: 56,
                fontWeight: 900,
                flexShrink: 0,
              }}
            >
              {s.n}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 32,
                fontWeight: 700,
                flex: 1,
                lineHeight: 1.2,
              }}
            >
              {s.t}
            </div>
          </div>
        ))}
      </div>

      <FooterLogo accent={accent} />
    </div>
  );
}

// ── Slide 5 — CTA ───────────────────────────────────────────────────────────
export function Slide5CTA({ accent, totalGrants, siteUrl }: SlideContext) {
  // Strip protocol for visual cleanliness — the URL is decorative here.
  const displayUrl = siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const grantCountFmt = totalGrants.toLocaleString("fr-FR");
  return (
    <div style={baseSlide(accent)}>
      <SlideNumber n={5} accent={accent} />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: 40,
        }}
      >
        <EmileLogo accent={CARD} size="lg" />

        <div
          style={{
            display: "flex",
            fontSize: 56,
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            textAlign: "center",
            maxWidth: 880,
          }}
        >
          Retrouvez {grantCountFmt} subventions comme celle-ci
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 28,
            fontWeight: 600,
            color: FOREGROUND,
            opacity: 0.8,
          }}
        >
          {displayUrl}
        </div>

        <div
          style={{
            display: "flex",
            backgroundColor: FOREGROUND,
            color: accent,
            padding: "24px 48px",
            borderRadius: 999,
            fontSize: 36,
            fontWeight: 900,
            border: `4px solid ${FOREGROUND}`,
            boxShadow: SHADOW,
          }}
        >
          Trouvez vos subventions →
        </div>
      </div>
    </div>
  );
}

export const SLIDES = [Slide1Hook, Slide2What, Slide3Why, Slide4How, Slide5CTA];

export type SlideRenderer = (ctx: SlideContext) => React.ReactElement;
export type { SlideContext };
