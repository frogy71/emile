"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";

/**
 * GenerateProposalButton — client CTA for the grant detail page.
 *
 * Two modes:
 *  - preselectedProjectId set → single "Générer" button, POSTs immediately.
 *  - no preselected project    → inline <select> picker + button. Users without
 *    any project are sent to /projects/new.
 *
 * 402 responses redirect to /pricing (the paywall landing). Everything else
 * surfaces as an inline error rather than a toast since there's no toast
 * provider wired up yet.
 */
export function GenerateProposalButton({
  organizationId,
  grantId,
  projects,
  preselectedProjectId,
}: {
  organizationId: string;
  grantId: string;
  projects: { id: string; name: string }[];
  preselectedProjectId: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickedProjectId, setPickedProjectId] = useState<string>(
    preselectedProjectId || projects[0]?.id || ""
  );

  const projectId = preselectedProjectId || pickedProjectId || null;
  const hasProjects = projects.length > 0;

  async function handleClick() {
    setError(null);

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
        // Paywall — bounce to pricing
        router.push("/pricing?reason=proposal_limit");
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
        {!preselectedProjectId && hasProjects && (
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

      {error && (
        <p className="text-xs font-bold text-red-700 max-w-xs text-right">
          {error}
        </p>
      )}
    </div>
  );
}
