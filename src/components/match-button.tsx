"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Loader2,
  CheckCircle,
  PartyPopper,
} from "lucide-react";
import { UpgradeModal } from "@/components/upgrade-modal";
import { Confetti } from "@/components/ui/confetti";
import { useToast } from "@/components/ui/toast";
import {
  MatchingOverlay,
  type MatchingOverlayState,
} from "@/components/matching-overlay";

interface MatchButtonProps {
  projectId: string;
  /**
   * When true, fire the matcher automatically once on mount. Used by the
   * quick-start flow which redirects here with ?match=auto so the user lands
   * on results instead of an empty CTA.
   */
  autoStart?: boolean;
}

export function MatchButton({ projectId, autoStart = false }: MatchButtonProps) {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    total: number;
    highMatches: number;
    goodMatches: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paywallMessage, setPaywallMessage] = useState<string | null>(null);
  const [confetti, setConfetti] = useState(false);
  const autoStartedRef = useRef(false);

  // Overlay state — only used when matching is auto-fired by the quick-start
  // flow. Manual clicks rely on the inline button spinner.
  const [overlayActive, setOverlayActive] = useState(false);
  const [overlayFading, setOverlayFading] = useState(false);
  const [overlayMode, setOverlayMode] = useState<"loading" | "error" | "empty">(
    "loading"
  );

  // Transient celebration banner shown after the overlay fades out. Keyed by
  // the moment matching completed so the slide-down animation re-runs.
  const [banner, setBanner] = useState<{
    key: number;
    total: number;
    highMatches: number;
    goodMatches: number;
  } | null>(null);

  const handleMatch = useCallback(
    async (opts: { fromOverlay?: boolean } = {}) => {
      setLoading(true);
      setError(null);
      setResult(null);
      // If we're retrying from the overlay error state, bring it back to
      // loading mode immediately.
      if (opts.fromOverlay) {
        setOverlayMode("loading");
        setOverlayFading(false);
        setOverlayActive(true);
      }
      try {
        const res = await fetch(`/api/projects/${projectId}/match`, {
          method: "POST",
        });
        const data = await res.json();
        if (res.status === 402) {
          // Paywall — close the overlay and surface the upgrade modal instead.
          setOverlayActive(false);
          setOverlayFading(false);
          setPaywallMessage(
            data?.message ||
              "Tu as utilisé tes 3 matchings gratuits ce mois-ci. Passe en Pro pour des matchings illimités."
          );
          return;
        }
        if (!res.ok) {
          throw new Error(data.error || "Erreur lors du matching");
        }
        const total = data.total ?? 0;
        const highMatches = data.highMatches ?? 0;
        const goodMatches = data.goodMatches ?? 0;
        setResult({ total, highMatches, goodMatches });

        if (highMatches + goodMatches > 0) {
          setConfetti(true);
          toast.success(
            "Matching terminé !",
            `${highMatches} excellent${highMatches > 1 ? "s" : ""} · ${goodMatches} bon${goodMatches > 1 ? "s" : ""} match${goodMatches > 1 ? "s" : ""}`
          );
        } else {
          toast.info(
            "Matching terminé",
            "Aucun match prometteur cette fois — essaie d'enrichir ton projet."
          );
        }

        if (overlayActive) {
          if (total === 0) {
            // No results at all — keep the overlay up with the empty-state
            // panel so the user has a clear next step.
            setOverlayMode("empty");
            setOverlayFading(false);
          } else {
            // Success — fade the overlay out and surface the celebration
            // banner so the freshly rendered cards land in the user's view.
            setOverlayFading(true);
            setBanner({
              key: Date.now(),
              total,
              highMatches,
              goodMatches,
            });
            setTimeout(() => {
              setOverlayActive(false);
              setOverlayFading(false);
            }, 500);
          }
        }

        startTransition(() => router.refresh());
      } catch (e) {
        const message = e instanceof Error ? e.message : "Erreur inconnue";
        setError(message);
        toast.error("Le matching a échoué", message);
        if (overlayActive) {
          setOverlayMode("error");
          setOverlayFading(false);
        }
      } finally {
        setLoading(false);
      }
    },
    [projectId, router, startTransition, toast, overlayActive]
  );

  // Auto-fire once when invoked from the quick-start flow. Page-level guard
  // ensures we only do this when there are no existing match scores, and the
  // ref guard ensures the effect doesn't re-trigger on re-renders or after a
  // router.refresh() repaints the matches.
  useEffect(() => {
    if (!autoStart || autoStartedRef.current) return;
    autoStartedRef.current = true;
    setOverlayActive(true);
    setOverlayMode("loading");
    void handleMatch();
    // Strip ?match=auto from the URL so a hard refresh doesn't re-run.
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.has("match")) {
        url.searchParams.delete("match");
        window.history.replaceState({}, "", url.toString());
      }
    }
  }, [autoStart, handleMatch]);

  // Auto-dismiss the celebration banner after a few seconds.
  useEffect(() => {
    if (!banner) return;
    const id = setTimeout(() => setBanner(null), 6000);
    return () => clearTimeout(id);
  }, [banner]);

  const overlayState: MatchingOverlayState = !overlayActive
    ? "hidden"
    : overlayFading
      ? "fading"
      : overlayMode;

  return (
    <div className="flex flex-col items-end gap-2">
      <Confetti active={confetti} onComplete={() => setConfetti(false)} />
      <Button onClick={() => handleMatch()} disabled={loading} variant="default">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Matching en cours...
          </>
        ) : result ? (
          <>
            <CheckCircle className="h-4 w-4" />
            Relancer le matching
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Lancer le matching IA
          </>
        )}
      </Button>
      {result && (
        <div className="animate-slide-up-fade flex items-center gap-2 rounded-xl border-2 border-border bg-[#c8f76f] px-3 py-1.5 shadow-[2px_2px_0px_0px_#1a1a1a]">
          <PartyPopper className="h-3.5 w-3.5" />
          <p className="text-xs font-black">
            {result.highMatches} excellents · {result.goodMatches} bons matchs
            (sur {result.total})
          </p>
        </div>
      )}
      {error && !overlayActive && (
        <p className="text-sm font-bold text-red-600">{error}</p>
      )}
      <UpgradeModal
        open={paywallMessage !== null}
        onClose={() => setPaywallMessage(null)}
        title="Vous avez utilisé vos 3 matchings gratuits ce mois-ci"
        message={
          paywallMessage ||
          "Passez à Pro pour des matchings illimités, top 50 résultats et 5 dossiers IA / mois."
        }
        highlightedTier="pro"
      />

      <MatchingOverlay
        state={overlayState}
        errorMessage={error}
        onRetry={() => handleMatch({ fromOverlay: true })}
        projectId={projectId}
      />

      {banner && (
        <div
          key={banner.key}
          className="fixed left-1/2 top-6 z-40 -translate-x-1/2 rounded-2xl border-2 border-border bg-[#c8f76f] px-5 py-3 shadow-[6px_6px_0px_0px_#1a1a1a] animate-slide-down-fade"
          role="status"
        >
          <div className="flex items-center gap-3">
            <PartyPopper className="h-5 w-5 shrink-0" />
            <p className="text-sm font-black">
              {banner.total} subvention{banner.total > 1 ? "s" : ""} trouvée
              {banner.total > 1 ? "s" : ""} pour votre projet !
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
