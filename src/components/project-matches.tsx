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
  ExternalLink,
  Sparkles,
  Target,
} from "lucide-react";

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

// ─── Podium card (gold/silver/bronze) ────────────────────────────

function PodiumCard({
  match,
  rank,
  projectId,
}: {
  match: Match;
  rank: 1 | 2 | 3;
  projectId: string;
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

            <div className="flex flex-wrap gap-2 mt-4">
              <Link href={`/grants/${grant.id}?project_id=${projectId}`}>
                <Button variant="default" size="sm">
                  <Sparkles className="h-4 w-4" />
                  Générer une proposition
                </Button>
              </Link>
              {grant.source_url && (
                <a
                  href={grant.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4" />
                    Voir chez le bailleur
                  </Button>
                </a>
              )}
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
}: {
  match: Match;
  rank: number;
  projectId: string;
}) {
  const grant = match.grants;
  if (!grant) return null;
  const expl = readExplanation(match.explanation);
  const difficulty = difficultyBadge(expl.difficulty, expl.difficultyLabel);
  const days = daysLeft(grant.deadline);
  const amount = formatEur(grant.max_amount_eur);

  return (
    <div className="rounded-2xl border-2 border-border bg-card shadow-[4px_4px_0px_0px_#1a1a1a] transition-all hover:shadow-[6px_6px_0px_0px_#1a1a1a] hover:translate-x-[-1px] hover:translate-y-[-1px]">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="shrink-0 text-center">
            <div className="text-[11px] font-black text-muted-foreground">
              #{rank}
            </div>
            <div className="mt-1 flex h-12 w-12 items-center justify-center rounded-xl border-2 border-border bg-[#c8f76f] text-lg font-black shadow-[2px_2px_0px_0px_#1a1a1a]">
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
            {grant.source_url && (
              <a
                href={grant.source_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm" className="w-full">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Appel
                </Button>
              </a>
            )}
          </div>
        </div>
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
}: {
  matches: Match[];
  projectId: string;
}) {
  const [showRest, setShowRest] = useState(false);

  // Hard-gated matches (score = 0) shouldn't pollute the top lists.
  const ranked = matches.filter((m) => m.score > 0);
  const podium = ranked.slice(0, 3);
  const topTier = ranked.slice(3, 7);
  const rest = ranked.slice(7);

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
      {/* PODIUM */}
      {podium.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🏆</span>
            <h3 className="text-lg font-black">Top 3 pour ton projet</h3>
            <Badge variant="green" className="text-[10px]">
              À poursuivre en priorité
            </Badge>
          </div>
          <div className="grid gap-4">
            {podium.map((match, i) => (
              <PodiumCard
                key={match.id}
                match={match}
                rank={(i + 1) as 1 | 2 | 3}
                projectId={projectId}
              />
            ))}
          </div>
        </div>
      )}

      {/* TOP 4-7 */}
      {topTier.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">⭐</span>
            <h3 className="text-lg font-black">Autres matches à considérer</h3>
            <span className="text-xs font-bold text-muted-foreground">
              ({topTier.length})
            </span>
          </div>
          <div className="grid gap-3">
            {topTier.map((match, i) => (
              <TopCard
                key={match.id}
                match={match}
                rank={i + 4}
                projectId={projectId}
              />
            ))}
          </div>
        </div>
      )}

      {/* COLLAPSED REST */}
      {rest.length > 0 && (
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
                  rank={i + 8}
                  projectId={projectId}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
