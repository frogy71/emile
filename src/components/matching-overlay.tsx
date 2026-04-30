"use client";

import { useEffect, useState } from "react";
import { AlertCircle, RefreshCw, SearchX, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SkeletonMatchCard } from "@/components/ui/skeleton";

const STATUS_MESSAGES = [
  "Émile analyse votre projet...",
  "Recherche parmi les subventions françaises...",
  "Analyse des programmes européens...",
  "Matching IA en cours...",
  "Classement par pertinence...",
  "Presque terminé...",
];

export type MatchingOverlayState =
  | "loading"
  | "fading"
  | "error"
  | "empty"
  | "hidden";

interface MatchingOverlayProps {
  state: MatchingOverlayState;
  errorMessage?: string | null;
  onRetry?: () => void;
  /** Used to render the "edit project" CTA in the empty-results state. */
  projectId?: string;
}

/**
 * Full-page overlay shown while the matcher is running. Auto-fired matchings
 * (the post-signup quick-start flow) leave the user staring at an empty page
 * for 10-30s — without a clear progress signal, conversion craters because
 * users assume the app is broken. This overlay narrates what Émile is doing
 * and keeps the user engaged.
 *
 * Progress bar is intentionally fake: it ramps quickly to 60% (perceived
 * speed), crawls to 85% (sets expectations for the actual wait), then jumps
 * to 100% when the results arrive.
 */
export function MatchingOverlay({
  state,
  errorMessage,
  onRetry,
  projectId,
}: MatchingOverlayProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Rotate status messages every 3s while loading. Index intentionally
  // persists across loading sessions (e.g. retry) — the messages cycle and
  // resetting to 0 would just feel less "real".
  useEffect(() => {
    if (state !== "loading") return;
    const id = setInterval(() => {
      setMessageIndex((i) => (i + 1) % STATUS_MESSAGES.length);
    }, 3000);
    return () => clearInterval(id);
  }, [state]);

  // Fake progress curve: 0→60% in 3s, 60→85% in 10s, hold at 85%. We snapshot
  // the start time inside the effect (vs. a ref) so retries correctly reset
  // the curve. The fading→100 jump is rendered as a derived value, not stored
  // in state, so we don't have to setState from the effect when the overlay
  // closes.
  useEffect(() => {
    if (state !== "loading") return;
    const start = Date.now();
    let raf = 0;
    const tick = () => {
      const elapsed = Date.now() - start;
      let next: number;
      if (elapsed < 3000) {
        next = (elapsed / 3000) * 60;
      } else if (elapsed < 13000) {
        next = 60 + ((elapsed - 3000) / 10000) * 25;
      } else {
        next = 85;
      }
      setProgress(next);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [state]);

  if (state === "hidden") return null;

  const fading = state === "fading";
  const displayedProgress = fading ? 100 : progress;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center px-4 transition-opacity duration-500 ${
        fading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      role="dialog"
      aria-modal="true"
      aria-live="polite"
    >
      {/* Backdrop with blurred skeleton cards behind to suggest results loading */}
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm overflow-hidden">
        <div className="grid gap-4 p-8 max-w-4xl mx-auto opacity-30 blur-sm">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonMatchCard key={i} />
          ))}
        </div>
      </div>

      {/* Foreground panel */}
      <div className="relative w-full max-w-md">
        {state === "error" ? (
          <ErrorPanel message={errorMessage} onRetry={onRetry} />
        ) : state === "empty" ? (
          <EmptyPanel projectId={projectId} />
        ) : (
          <LoadingPanel
            progress={displayedProgress}
            messageIndex={messageIndex}
          />
        )}
      </div>
    </div>
  );
}

function LoadingPanel({
  progress,
  messageIndex,
}: {
  progress: number;
  messageIndex: number;
}) {
  return (
    <div className="rounded-2xl border-2 border-border bg-card p-8 shadow-[6px_6px_0px_0px_#1a1a1a]">
      <div className="flex flex-col items-center text-center">
        {/* Pulsing logo */}
        <div className="relative">
          <span
            className="absolute inset-0 rounded-2xl border-2 border-border animate-ping-brutal"
            aria-hidden
          />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-border bg-[#c8f76f] shadow-[4px_4px_0px_0px_#1a1a1a] animate-pulse-emile">
            <Sparkles className="h-10 w-10" />
          </div>
        </div>

        <h2 className="mt-6 text-2xl font-black tracking-tight">
          Matching en cours
        </h2>

        {/* Rotating status — keyed so it re-runs the fade-in animation */}
        <p
          key={messageIndex}
          className="mt-2 min-h-[1.5rem] text-sm font-semibold text-muted-foreground animate-fade-in-soft"
        >
          {STATUS_MESSAGES[messageIndex]}
        </p>

        {/* Fake progress bar */}
        <div
          className="mt-6 h-3 w-full rounded-full border-2 border-border bg-secondary overflow-hidden shadow-[2px_2px_0px_0px_#1a1a1a]"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
        >
          <div
            className="h-full bg-[#c8f76f] transition-[width] duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-xs font-black text-muted-foreground tabular-nums">
          {Math.round(progress)} %
        </p>

        <p className="mt-4 text-xs font-medium text-muted-foreground">
          Cela prend en général 10 à 30 secondes.
        </p>
      </div>
    </div>
  );
}

function ErrorPanel({
  message,
  onRetry,
}: {
  message?: string | null;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-2xl border-2 border-border bg-card p-8 shadow-[6px_6px_0px_0px_#1a1a1a]">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-border bg-[#ffa3d1] shadow-[3px_3px_0px_0px_#1a1a1a]">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="mt-4 text-xl font-black">
          Oups, un problème technique
        </h2>
        <p className="mt-2 text-sm font-medium text-muted-foreground">
          {message || "Réessayons."}
        </p>
        {onRetry && (
          <Button onClick={onRetry} className="mt-6">
            <RefreshCw className="h-4 w-4" />
            Réessayer
          </Button>
        )}
      </div>
    </div>
  );
}

function EmptyPanel({ projectId }: { projectId?: string }) {
  return (
    <div className="rounded-2xl border-2 border-border bg-card p-8 shadow-[6px_6px_0px_0px_#1a1a1a]">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-border bg-[#ffe066] shadow-[3px_3px_0px_0px_#1a1a1a]">
          <SearchX className="h-8 w-8" />
        </div>
        <h2 className="mt-4 text-xl font-black">
          Aucune subvention trouvée
        </h2>
        <p className="mt-2 text-sm font-medium text-muted-foreground">
          Essayez d&apos;élargir votre projet — plus de description, d&apos;objectifs ou
          de bénéficiaires aide Émile à trouver plus de matches.
        </p>
        {projectId && (
          <Link href={`/projects/${projectId}/edit`} className="mt-6">
            <Button variant="accent">Modifier le projet</Button>
          </Link>
        )}
      </div>
    </div>
  );
}
