"use client";

import { useState, useTransition } from "react";
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

interface MatchButtonProps {
  projectId: string;
}

export function MatchButton({ projectId }: MatchButtonProps) {
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

  const handleMatch = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/match`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.status === 402) {
        setPaywallMessage(
          data?.message ||
            "Tu as utilisé tes 3 matchings gratuits ce mois-ci. Passe en Pro pour des matchings illimités."
        );
        return;
      }
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors du matching");
      }
      setResult({
        total: data.total,
        highMatches: data.highMatches,
        goodMatches: data.goodMatches,
      });
      // Celebrate when we found at least one promising match — otherwise the
      // confetti would feel sarcastic on an empty result set.
      if ((data.highMatches ?? 0) + (data.goodMatches ?? 0) > 0) {
        setConfetti(true);
        toast.success(
          "Matching terminé !",
          `${data.highMatches} excellent${data.highMatches > 1 ? "s" : ""} · ${data.goodMatches} bon${data.goodMatches > 1 ? "s" : ""} match${data.goodMatches > 1 ? "s" : ""}`
        );
      } else {
        toast.info(
          "Matching terminé",
          "Aucun match prometteur cette fois — essaie d'enrichir ton projet."
        );
      }
      // Refresh the server component to show new matches
      startTransition(() => router.refresh());
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erreur inconnue";
      setError(message);
      toast.error("Le matching a échoué", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <Confetti active={confetti} onComplete={() => setConfetti(false)} />
      <Button onClick={handleMatch} disabled={loading} variant="default">
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
      {error && <p className="text-sm font-bold text-red-600">{error}</p>}
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
    </div>
  );
}
