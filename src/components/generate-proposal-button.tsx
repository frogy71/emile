"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, Sparkles } from "lucide-react";
import { UpgradeModal } from "@/components/upgrade-modal";

/**
 * GenerateProposalButton — client CTA for the grant detail page.
 *
 * Two modes:
 *  - preselectedProjectId set → single "Générer" button, POSTs immediately.
 *  - no preselected project    → inline <select> picker + button. Users without
 *    any project are sent to /projects/new.
 *
 * Free users see a lock icon and the upgrade modal on click — proposal
 * generation is gated to Pro+ entirely. Pro/Expert hit the API directly,
 * and a 402 (monthly cap) also opens the modal.
 */
export function GenerateProposalButton({
  organizationId,
  grantId,
  projects,
  preselectedProjectId,
  tier = "free",
}: {
  organizationId: string;
  grantId: string;
  projects: { id: string; name: string }[];
  preselectedProjectId: string | null;
  tier?: "free" | "pro" | "expert";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paywallMessage, setPaywallMessage] = useState<string | null>(null);
  const [pickedProjectId, setPickedProjectId] = useState<string>(
    preselectedProjectId || projects[0]?.id || ""
  );

  const projectId = preselectedProjectId || pickedProjectId || null;
  const hasProjects = projects.length > 0;
  const isFree = tier === "free";

  async function handleClick() {
    setError(null);

    if (isFree) {
      setPaywallMessage(
        "La génération de dossier IA est réservée aux plans Pro et Expert. Passez à Pro pour 5 dossiers / mois."
      );
      return;
    }

    if (!hasProjects) {
      router.push("/projects/new");
      return;
    }

    if (!projectId) {
      setError("Choisis un projet d'abord.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ organizationId, grantId, projectId }),
      });

      if (res.status === 402) {
        const data = await res.json().catch(() => ({}));
        setPaywallMessage(
          data?.message ||
            "Tu as atteint la limite mensuelle de dossiers. Passe en Expert pour des dossiers illimités."
        );
        setLoading(false);
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || data?.error || "Erreur lors de la génération.");
        setLoading(false);
        return;
      }

      if (data.proposalId) {
        router.push(`/proposals/${data.proposalId}`);
        return;
      }

      setError("Proposition générée mais non sauvegardée. Réessaie.");
      setLoading(false);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Erreur réseau.";
      setError(message);
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap items-center gap-2">
        {!preselectedProjectId && hasProjects && !isFree && (
          <select
            value={pickedProjectId}
            onChange={(e) => setPickedProjectId(e.target.value)}
            disabled={loading}
            className="h-10 rounded-xl border-2 border-border bg-card px-3 text-sm font-bold shadow-[2px_2px_0px_0px_#1a1a1a] focus:outline-none focus:ring-2 focus:ring-foreground/20"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}

        <Button
          variant="default"
          onClick={handleClick}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Génération…
            </>
          ) : isFree ? (
            <>
              <Lock className="h-4 w-4" />
              Générer une proposition
            </>
          ) : !hasProjects ? (
            <>
              <Sparkles className="h-4 w-4" />
              Créer un projet d&apos;abord
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Générer une proposition
            </>
          )}
        </Button>
      </div>

      {isFree && (
        <p className="text-[11px] font-bold text-muted-foreground max-w-xs text-right">
          Réservé aux plans Pro et Expert
        </p>
      )}

      {error && (
        <p className="text-xs font-bold text-red-700 max-w-xs text-right">
          {error}
        </p>
      )}

      <UpgradeModal
        open={paywallMessage !== null}
        onClose={() => setPaywallMessage(null)}
        title={
          isFree
            ? "Débloquez la génération de dossier IA"
            : "Limite mensuelle atteinte"
        }
        message={
          paywallMessage ||
          "Passez à Pro pour générer des dossiers IA structurés en quelques minutes."
        }
        highlightedTier={isFree ? "pro" : "expert"}
      />
    </div>
  );
}
