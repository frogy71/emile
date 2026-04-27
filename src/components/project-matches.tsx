"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Euro,
  Phone,
  Sparkles,
  Star,
  Target,
  Users,
} from "lucide-react";
import { GrantInteractions } from "@/components/grant-interactions";
import { PaywallOverlay } from "@/components/paywall-overlay";
import type { PlanTier } from "@/lib/plan";

/**
 * Match rows are ranked strictly by score (the server sorts them already),
 * then split into three tiers:
 *
 *   Podium  : top 3  → 🥇🥈🥉 — big cards, distinctive colors
 *   Top 7   : #4-#7 → "Autres top matches" — medium cards
 *   Rest    : #8+   → collapsed behind a "Voir les X autres" toggle
 *
 * Why tiers? Users were scrolling a flat list of 50 scores and couldn't
 * tell which few to actually pursue. The medal metaphor is instantly legible
 * and matches how grant-hunters actually work (you pursue 1-3 seriously,
 * keep 4-7 as backups, and the rest is reference).
 */

type Match = {
  id: string;
  score: number;
  recommendation?: string | null;
  explanation?: unknown;
  grants: {
    id: string;
    title: string;
    funder?: string | null;
    summary?: string | null;
    deadline?: string | null;
    max_amount_eur?: number | null;
    source_name?: string | null;
    source_url?: string | null;
    popularity_score?: number | null;
  } | null;
};

type ExplanationShape = {
  difficulty?: "easy" | "medium" | "hard" | "very_hard";
  difficultyLabel?: string;
  strengths?: string[];
  weaknesses?: string[];
  risks?: string[];
  summary?: string;
  gatedBy?: string;
};

function readExplanation(raw: unknown): ExplanationShape {
  if (!raw || typeof raw !== "object") return {};
  return raw as ExplanationShape;
}

function difficultyBadge(
  diff: ExplanationShape["difficulty"] | undefined,
  label: string | undefined
): { color: string; label: string } | null {
  if (!diff) return null;
  const colors: Record<string, string> = {
    easy: "bg-[#c8f76f]",
    medium: "bg-[#ffe066]",
    hard: "bg-[#ffa3d1]",
    very_hard: "bg-[#d4b5ff]",
  };
  return { color: colors[diff] || "bg-secondary", label: label || diff };
}

function daysLeft(deadline: string | null | undefined): number | null {
  if (!deadline) return null;
  const d = new Date(deadline).getTime();
  if (!isFinite(d)) return null;
  return Math.ceil((d - Date.now()) / (1000 * 60 * 60 * 24));
}

function formatEur(n: number | null | undefined): string | null {
  if (!n) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".0", "")} M€`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k€`;
  return `${n} €`;
}

/**
 * Private foundations respond to direct outreach much more than public calls
 * — their programs are discretionary, the decision is human, and a well-told
 * story lands. So when score ≥ 95 AND source is a private foundation, we
 * surface a "contacte-les directement" CTA alongside the usual generate
 * button.
 */
const PRIVATE_FOUNDATION_SOURCES = new Set([
  "Fondations françaises",
  "Fondation de France",
  "data.gouv.fr — FRUP",
  "data.gouv.fr — Fondations entreprises",
]);

function isPrivateFoundation(sourceName: string | null | undefined): boolean {
  if (!sourceName) return false;
  if (PRIVATE_FOUNDATION_SOURCES.has(sourceName)) return true;
  // Heuristic fallback — anything explicitly labelled a fondation
  return /fondation/i.test(sourceName);
}

/**
 * Wisdom-of-the-crowd badge — only shown when the grant has been positively
 * engaged with by at least one org. Singular/plural handled inline.
 */
function PopularityBadge({ count }: { count: number | null | undefined }) {
  if (!count || count <= 0) return null;
  return (
    <Badge variant="purple" className="text-[10px]">
      <Users className="h-2.5 w-2.5 mr-1" />
      {count} ONG intéressée{count > 1 ? "s" : ""}
    </Badge>
  );
}

// ─── Podium card (gold/silver/bronze) ────────────────────────────

function PodiumCard({
  match,
  rank,
  projectId,
  tier,
}: {
  match: Match;
  rank: 1 | 2 | 3;
  projectId: string;
  tier: PlanTier;
}) {
  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉";
  const rankLabel =
    rank === 1 ? "Or · top match" : rank === 2 ? "Argent" : "Bronze";
  const bgColor =
    rank === 1
      ? "bg-gradient-to-br from-[#ffe066] to-[#c8f76f]"
      : rank === 2
        ? "bg-gradient-to-br from-[#e5e7eb] to-[#a3d5ff]"
        : "bg-gradient-to-br from-[#ffa3d1] to-[#d4b5ff]";

  const grant = match.grants;
  if (!grant) return null;

  const expl = readExplanation(match.explanation);
  const difficulty = difficultyBadge(expl.difficulty, expl.difficultyLabel);
  const days = daysLeft(grant.deadline);
  const amount = formatEur(grant.max_amount_eur);
  const isExceptional = match.score >= 95;
  const isFoundation = isPrivateFoundation(grant.source_name);

  return (
    <div
      className={`rounded-2xl border-2 border-border ${bgColor} shadow-[6px_6px_0px_0px_#1a1a1a] transition-all hover:shadow-[8px_8px_0px_0px_#1a1a1a] hover:translate-x-[-1px] hover:translate-y-[-1px]`}
    >
      <div className="p-6">
        <div className="flex items-start gap-5">
          {/* Medal + score */}
          <div className="shrink-0 text-center">
            <div className="text-5xl leading-none">{medal}</div>
            <div className="mt-2 flex h-12 w-12 items-center justify-center rounded-xl border-2 border-border bg-background text-xl font-black shadow-[3px_3px_0px_0px_#1a1a1a]">
              {match.score}
            </div>
            <p className="mt-1 text-[10px] font-black uppercase tracking-wider">
              {rankLabel}
            </p>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {grant.source_name && (
                <Badge variant="secondary" className="text-[10px]">
                  {grant.source_name}
                </Badge>
              )}
              {difficulty && (
                <Badge
                  variant="secondary"
                  className={`text-[10px] ${difficulty.color}`}
                >
                  <Target className="h-2.5 w-2.5 mr-1" />
                  {difficulty.label}
                </Badge>
              )}
              <PopularityBadge count={grant.popularity_score} />
            </div>

            <h3 className="text-xl font-black text-foreground leading-tight">
              {grant.title}
            </h3>
            {grant.funder && (
              <p className="text-sm font-bold text-foreground/80 mt-0.5">
                {grant.funder}
              </p>
            )}

            {(expl.summary || grant.summary) && (
              <p className="text-sm font-medium text-foreground/80 mt-3 line-clamp-2">
                {expl.summary || grant.summary}
              </p>
            )}

            {expl.strengths && expl.strengths.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {expl.strengths.slice(0, 3).map((s, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-md border-2 border-border bg-background/80 px-2 py-0.5 text-[11px] font-bold"
                  >
                    ✓ {s}
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 mt-4 text-xs font-bold">
              {grant.deadline && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(grant.deadline).toLocaleDateString("fr-FR")}
                  {days !== null && days >= 0 && (
                    <span
                      className={`ml-1 px-1.5 py-0.5 rounded text-[10px] ${
                        days < 14
                          ? "bg-red-100 text-red-700"
                          : days < 30
                            ? "bg-orange-100 text-orange-700"
                            : "bg-background/60"
                      }`}
                    >
                      J-{days}
                    </span>
                  )}
                </span>
              )}
              {amount && (
                <span className="inline-flex items-center gap-1">
                  <Euro className="h-3.5 w-3.5" />
                  Jusqu&apos;à {amount}
                </span>
              )}
            </div>

            {isExceptional && (
              <div className="mt-4 rounded-xl border-2 border-border bg-background/90 p-3 shadow-[2px_2px_0px_0px_#1a1a1a]">
                <div className="flex items-start gap-2">
                  <Star className="h-4 w-4 mt-0.5 shrink-0 fill-[#ffe066] text-foreground" />
                  <div className="text-xs font-bold leading-snug">
                    <span className="font-black">Match exceptionnel.</span>{" "}
                    {isFoundation
                      ? "Contacte la fondation en direct avant même de soumettre — présente le projet, demande un rendez-vous. C'est là que ça se joue."
                      : "Priorise ce dossier cette semaine — un score ≥ 95 est rare."}
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 mt-4">
              <Link href={`/grants/${grant.id}?project_id=${projectId}`}>
                <Button variant="default" size="sm">
                  <Sparkles className="h-4 w-4" />
                  Générer une proposition
                </Button>
              </Link>
              <Link href={`/grants/${grant.id}?project_id=${projectId}`}>
                <Button variant="outline" size="sm">
                  En savoir plus sur la subvention
                </Button>
              </Link>
              {/* Contact button always shown for private foundations — direct
                  outreach is the single biggest unlock, regardless of score. */}
              {isFoundation && grant.source_url && (
                <a
                  href={grant.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="accent" size="sm">
                    <Phone className="h-4 w-4" />
                    Contacter la fondation
                  </Button>
                </a>
              )}
              <GrantInteractions
                grantId={grant.id}
                projectId={projectId}
                layout="card"
                className="ml-auto"
                tier={tier}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Top-7 tier card (medium emphasis) ───────────────────────────

function TopCard({
  match,
  rank,
  projectId,
  tier,
}: {
  match: Match;
  rank: number;
  projectId: string;
  tier: PlanTier;
}) {
  const grant = match.grants;
  if (!grant) return null;
  const expl = readExplanation(match.explanation);
  const difficulty = difficultyBadge(expl.difficulty, expl.difficultyLabel);
  const days = daysLeft(grant.deadline);
  const amount = formatEur(grant.max_amount_eur);
  const isExceptional = match.score >= 95;
  const isFoundation = isPrivateFoundation(grant.source_name);

  return (
    <div
      className={`rounded-2xl border-2 border-border shadow-[4px_4px_0px_0px_#1a1a1a] transition-all hover:shadow-[6px_6px_0px_0px_#1a1a1a] hover:translate-x-[-1px] hover:translate-y-[-1px] ${
        isExceptional ? "bg-[#fff8e1]" : "bg-card"
      }`}
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="shrink-0 text-center">
            <div className="text-[11px] font-black text-muted-foreground">
              #{rank}
            </div>
            <div
              className={`mt-1 flex h-12 w-12 items-center justify-center rounded-xl border-2 border-border text-lg font-black shadow-[2px_2px_0px_0px_#1a1a1a] ${
                isExceptional ? "bg-[#ffe066]" : "bg-[#c8f76f]"
              }`}
            >
              {match.score}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {grant.source_name && (
                <Badge variant="secondary" className="text-[10px]">
                  {grant.source_name}
                </Badge>
              )}
              {difficulty && (
                <Badge
                  variant="secondary"
                  className={`text-[10px] ${difficulty.color}`}
                >
                  {difficulty.label}
                </Badge>
              )}
              <PopularityBadge count={grant.popularity_score} />
            </div>
            <h3 className="text-base font-black leading-tight">{grant.title}</h3>
            {grant.funder && (
              <p className="text-xs font-bold text-muted-foreground">
                {grant.funder}
              </p>
            )}
            {(expl.summary || grant.summary) && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {expl.summary || grant.summary}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs font-bold text-muted-foreground">
              {grant.deadline && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(grant.deadline).toLocaleDateString("fr-FR")}
                  {days !== null && days >= 0 && days < 30 && (
                    <span className="ml-0.5 text-orange-600">(J-{days})</span>
                  )}
                </span>
              )}
              {amount && (
                <span className="inline-flex items-center gap-1">
                  <Euro className="h-3 w-3" />
                  Jusqu&apos;à {amount}
                </span>
              )}
            </div>
          </div>

          <div className="shrink-0 flex flex-col gap-2">
            <Link href={`/grants/${grant.id}?project_id=${projectId}`}>
              <Button variant="accent" size="sm">
                <Sparkles className="h-4 w-4" />
                Proposition
              </Button>
            </Link>
            <Link href={`/grants/${grant.id}?project_id=${projectId}`}>
              <Button variant="outline" size="sm" className="w-full">
                En savoir plus
              </Button>
            </Link>
            {/* Contact button always shown for private foundations. */}
            {isFoundation && grant.source_url && (
              <a
                href={grant.source_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="default" size="sm" className="w-full">
                  <Phone className="h-3.5 w-3.5" />
                  Contacter
                </Button>
              </a>
            )}
            <GrantInteractions
              grantId={grant.id}
              projectId={projectId}
              layout="card"
              className="justify-center"
              tier={tier}
            />
          </div>
        </div>
        {isExceptional && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border-2 border-border bg-background p-2">
            <Star className="h-4 w-4 shrink-0 mt-0.5 fill-[#ffe066] text-foreground" />
            <p className="text-xs font-bold leading-snug">
              Match exceptionnel —{" "}
              {isFoundation
                ? "contacte la fondation en direct."
                : "dossier à prioriser."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Rest tier (compact row) ─────────────────────────────────────

function CompactRow({
  match,
  rank,
  projectId,
}: {
  match: Match;
  rank: number;
  projectId: string;
}) {
  const grant = match.grants;
  if (!grant) return null;
  const amount = formatEur(grant.max_amount_eur);

  return (
    <Link
      href={`/grants/${grant.id}?project_id=${projectId}`}
      className="block rounded-xl border-2 border-border bg-card p-3 hover:shadow-[3px_3px_0px_0px_#1a1a1a] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
    >
      <div className="flex items-center gap-3">
        <div className="text-xs font-black text-muted-foreground w-8 shrink-0">
          #{rank}
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-border bg-secondary text-sm font-black shrink-0">
          {match.score}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black truncate">{grant.title}</p>
          <p className="text-xs font-semibold text-muted-foreground truncate">
            {grant.funder || ""}
          </p>
        </div>
        <div className="text-xs font-bold text-muted-foreground whitespace-nowrap">
          {grant.deadline &&
            new Date(grant.deadline).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
            })}
          {amount && <span className="ml-2">{amount}</span>}
        </div>
      </div>
    </Link>
  );
}

// ─── Main component ──────────────────────────────────────────────

export function ProjectMatches({
  matches,
  projectId,
  tier = "free",
}: {
  matches: Match[];
  projectId: string;
  tier?: PlanTier;
}) {
  const [showRest, setShowRest] = useState(false);
  const isFree = tier === "free";

  // Hard-gated matches (score = 0) shouldn't pollute the top lists.
  const ranked = matches.filter((m) => m.score > 0);
  const podium = ranked.slice(0, 3);
  // Free tier: show #4-#6 in clear, blur the rest. Paying tiers: keep
  // the original 4-7 visible window.
  const topTier = isFree ? ranked.slice(3, 6) : ranked.slice(3, 7);
  const restStart = isFree ? 6 : 7;
  const rest = ranked.slice(restStart);

  // Exceptional private-foundation matches (score ≥ 95). These get a
  // dedicated "à contacter en direct" banner at the top because direct
  // outreach is the single biggest unlock with private foundations.
  const exceptionalFoundations = ranked.filter(
    (m) => m.score >= 95 && isPrivateFoundation(m.grants?.source_name)
  );

  if (ranked.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-border bg-card p-8 text-center shadow-[4px_4px_0px_0px_#1a1a1a]">
        <p className="text-sm font-medium text-muted-foreground">
          Aucune subvention ne correspond aux critères d&apos;éligibilité de ce
          projet pour le moment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Exceptional-foundations banner — hidden for free users since the
          underlying matches are paywalled in the podium. */}
      {!isFree && exceptionalFoundations.length > 0 && (
        <div className="rounded-2xl border-2 border-border bg-[#ffe066] p-5 shadow-[4px_4px_0px_0px_#1a1a1a]">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-border bg-background shadow-[2px_2px_0px_0px_#1a1a1a] shrink-0">
              <Star className="h-5 w-5 fill-[#ffe066] text-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-black">
                {exceptionalFoundations.length} fondation
                {exceptionalFoundations.length > 1 ? "s" : ""} à contacter en
                direct (score ≥ 95)
              </h3>
              <p className="text-xs font-medium text-foreground/80 mt-1">
                Les fondations privées décident au cas par cas. Envoie un email
                ou demande un rendez-vous <strong>avant</strong> de soumettre
                un dossier — ça triple tes chances.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {exceptionalFoundations.slice(0, 6).map((m) => {
                  const funder = m.grants?.funder || m.grants?.title || "—";
                  return m.grants?.source_url ? (
                    <a
                      key={m.id}
                      href={m.grants.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border-2 border-border bg-background px-2.5 py-1 text-xs font-bold shadow-[2px_2px_0px_0px_#1a1a1a] hover:translate-y-[-1px] transition-transform"
                    >
                      <Phone className="h-3 w-3" />
                      {funder}
                      <span className="ml-1 rounded bg-[#c8f76f] px-1 text-[10px]">
                        {m.score}
                      </span>
                    </a>
                  ) : (
                    <Link
                      key={m.id}
                      href={`/grants/${m.grants?.id}?project_id=${projectId}`}
                      className="inline-flex items-center gap-1 rounded-lg border-2 border-border bg-background px-2.5 py-1 text-xs font-bold shadow-[2px_2px_0px_0px_#1a1a1a] hover:translate-y-[-1px] transition-transform"
                    >
                      {funder}
                      <span className="ml-1 rounded bg-[#c8f76f] px-1 text-[10px]">
                        {m.score}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PODIUM */}
      {podium.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🏆</span>
            <h3 className="text-lg font-black">Top 3 pour ton projet</h3>
            {isFree ? (
              <Badge variant="purple" className="text-[10px]">
                Réservé Pro
              </Badge>
            ) : (
              <Badge variant="green" className="text-[10px]">
                À poursuivre en priorité
              </Badge>
            )}
          </div>
          {isFree ? (
            <PaywallOverlay
              title="Débloquez vos meilleurs matchs"
              subtitle="Vos top 3 matchs sont les plus prometteurs. Passez à Pro pour les voir en clair et lancer un dossier IA."
              cta="Passer Pro — 79€/mois"
              blurClass="blur-md"
            >
              <div className="grid gap-4">
                {podium.map((match, i) => (
                  <PodiumCard
                    key={match.id}
                    match={match}
                    rank={(i + 1) as 1 | 2 | 3}
                    projectId={projectId}
                    tier={tier}
                  />
                ))}
              </div>
            </PaywallOverlay>
          ) : (
            <div className="grid gap-4">
              {podium.map((match, i) => (
                <PodiumCard
                  key={match.id}
                  match={match}
                  rank={(i + 1) as 1 | 2 | 3}
                  projectId={projectId}
                  tier={tier}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TOP 4-7 (or 4-6 on free) — fully visible to everyone */}
      {topTier.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">⭐</span>
            <h3 className="text-lg font-black">
              {isFree ? "Aperçu de tes matches" : "Autres matches à considérer"}
            </h3>
            <span className="text-xs font-bold text-muted-foreground">
              ({topTier.length})
            </span>
            {isFree && (
              <Badge variant="green" className="text-[10px]">
                Visible gratuitement
              </Badge>
            )}
          </div>
          <div className="grid gap-3">
            {topTier.map((match, i) => (
              <TopCard
                key={match.id}
                match={match}
                rank={i + 4}
                projectId={projectId}
                tier={tier}
              />
            ))}
          </div>
        </div>
      )}

      {/* COLLAPSED REST */}
      {rest.length > 0 &&
        (isFree ? (
          <div>
            <PaywallOverlay
              title={`+${rest.length} autres matches verrouillés`}
              subtitle="Vos résultats au-delà du top 6 sont réservés au plan Pro."
              cta="Voir plus avec Pro"
              blurClass="blur-md"
            >
              <div className="space-y-2">
                {rest.slice(0, 5).map((match, i) => (
                  <CompactRow
                    key={match.id}
                    match={match}
                    rank={i + restStart + 1}
                    projectId={projectId}
                  />
                ))}
              </div>
            </PaywallOverlay>
          </div>
        ) : (
          <div>
            <button
              type="button"
              onClick={() => setShowRest((v) => !v)}
              className="w-full flex items-center justify-between rounded-xl border-2 border-border bg-secondary px-4 py-3 text-sm font-black hover:bg-background transition-colors"
            >
              <span>
                {showRest ? "Masquer" : "Voir"} les {rest.length} autres matches
              </span>
              {showRest ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            {showRest && (
              <div className="mt-3 space-y-2">
                {rest.map((match, i) => (
                  <CompactRow
                    key={match.id}
                    match={match}
                    rank={i + restStart + 1}
                    projectId={projectId}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
    </div>
  );
}
