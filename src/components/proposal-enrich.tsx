"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
  Wand2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

/**
 * ProposalEnrich — second-pass Q&A flow that runs AFTER the first draft.
 *
 * Why: the generated draft is good at structure but only knows what's in the
 * DB. Users always have context the logframe doesn't capture — a concrete
 * story, a chiffre choc, why NOW, a differentiator from competitors. This
 * component surfaces a handful of targeted questions, collects free-text
 * answers, and sends them to /api/proposals/[id]/enrich where Claude rewrites
 * the sections with the new info folded in at the right spots.
 *
 * UX: collapsed by default to avoid overwhelming the page. Once expanded, the
 * user sees 5 storytelling questions — all optional. Empty answers are
 * stripped server-side. On success we router.refresh() so the proposal editor
 * re-reads the updated sections.
 */
const QUESTIONS: { key: string; label: string; hint: string; placeholder: string }[] = [
  {
    key: "histoire",
    label: "Raconte une histoire concrète",
    hint: "Un·e bénéficiaire, un terrain, un moment qui illustre l'impact. Le bailleur lit 200 dossiers — l'histoire est ce qu'il retient.",
    placeholder: "Ex: À Saint-Denis, Aïcha, 14 ans, a rejoint le programme en septembre. Six mois plus tard…",
  },
  {
    key: "chiffres",
    label: "Données et chiffres clés",
    hint: "Taille du problème, ampleur de l'impact, coût par bénéficiaire. Les chiffres précis décuplent la crédibilité.",
    placeholder: "Ex: 42 % des jeunes de la zone sortent sans diplôme (Insee 2024). Notre coût par réinsertion : 1 200 €.",
  },
  {
    key: "urgence",
    label: "Pourquoi maintenant ?",
    hint: "Qu'est-ce qui rend ce projet urgent cette année ? Contexte politique, fenêtre d'opportunité, crise à adresser.",
    placeholder: "Ex: La réforme 2026 de l'accompagnement jeunesse supprime les dispositifs existants à partir de janvier…",
  },
  {
    key: "difference",
    label: "Ce qui nous différencie",
    hint: "Pourquoi vous plutôt qu'une autre ONG ? Méthode, track record, ancrage local, partenariats uniques.",
    placeholder: "Ex: 12 ans de présence locale, 3 évaluations externes publiées, convention avec l'Éducation nationale…",
  },
  {
    key: "apres",
    label: "Et après la subvention ?",
    hint: "Comment les résultats perdurent après le financement. Les bailleurs privilégient ce qui ne s'effondre pas à J+1.",
    placeholder: "Ex: Transfert aux équipes pédagogiques à M+18. Autofinancement via prestations publiques à M+24.",
  },
];

type Status = "idle" | "loading" | "success" | "error";

export function ProposalEnrich({ proposalId }: { proposalId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const filledCount = Object.values(answers).filter((v) => v.trim().length > 0).length;
  const canSubmit = filledCount > 0 && status !== "loading";

  const submit = async () => {
    setStatus("loading");
    setError(null);
    try {
      const payload = QUESTIONS.map((q) => ({
        question: q.label,
        answer: (answers[q.key] || "").trim(),
      })).filter((a) => a.answer.length > 0);

      const res = await fetch(`/api/proposals/${proposalId}/enrich`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: payload }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.message || data?.error || "Erreur lors de l'enrichissement"
        );
      }

      setStatus("success");
      setAnswers({});
      // Refresh server component so proposal-editor re-reads the new content
      router.refresh();
      // Auto-collapse after a beat so the success toast is visible
      setTimeout(() => {
        setOpen(false);
        setStatus("idle");
      }, 3000);
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    }
  };

  return (
    <div className="mb-8 rounded-2xl border-2 border-border bg-[#fff5d1] p-5 shadow-[4px_4px_0px_0px_#1a1a1a]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 cursor-pointer text-left"
      >
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-border bg-[#ffe066] shadow-[2px_2px_0px_0px_#1a1a1a]">
            <Wand2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-black flex items-center gap-2">
              Enrichir ce brouillon
              <span className="rounded-full bg-foreground text-background px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                recommandé
              </span>
            </h3>
            <p className="text-xs font-semibold text-muted-foreground mt-0.5">
              5 questions de storytelling pour transformer ce brouillon en dossier qui gagne.
            </p>
          </div>
        </div>
        <div className="shrink-0">
          {open ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>
      </button>

      {open && (
        <div className="mt-5 space-y-4 border-t-2 border-border pt-5">
          <div className="rounded-xl border-2 border-border bg-card p-4 text-xs font-medium leading-relaxed">
            <p className="font-black mb-1 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Comment ça marche
            </p>
            <p className="text-muted-foreground">
              Réponds aux questions qui te parlent (toutes optionnelles).
              L&apos;IA va réécrire les sections concernées pour intégrer tes
              réponses au bon endroit — ton histoire dans le contexte, tes
              chiffres dans les résultats, etc. Le brouillon actuel n&apos;est
              pas écrasé : il est enrichi.
            </p>
          </div>

          {QUESTIONS.map((q) => (
            <div key={q.key}>
              <label className="text-sm font-black block mb-1">
                {q.label}
                <span className="text-xs font-semibold text-muted-foreground ml-2">
                  (optionnel)
                </span>
              </label>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                {q.hint}
              </p>
              <textarea
                className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm font-medium leading-relaxed focus:border-foreground focus:outline-none"
                value={answers[q.key] || ""}
                onChange={(e) =>
                  setAnswers((prev) => ({ ...prev, [q.key]: e.target.value }))
                }
                rows={3}
                placeholder={q.placeholder}
                spellCheck
                lang="fr"
              />
            </div>
          ))}

          {error && (
            <div className="flex items-start gap-2 rounded-xl border-2 border-red-600 bg-red-50 p-3 text-xs font-bold text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {status === "success" && (
            <div className="flex items-start gap-2 rounded-xl border-2 border-green-600 bg-green-50 p-3 text-xs font-bold text-green-700">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Brouillon enrichi ! Les sections ont été réécrites avec tes
                réponses.
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <p className="text-xs font-bold text-muted-foreground">
              {filledCount > 0
                ? `${filledCount} réponse${filledCount > 1 ? "s" : ""} prête${filledCount > 1 ? "s" : ""}`
                : "Réponds à au moins une question pour lancer l'enrichissement"}
            </p>
            <Button
              variant="accent"
              onClick={submit}
              disabled={!canSubmit}
            >
              {status === "loading" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enrichissement en cours…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Enrichir le brouillon
                </>
              )}
            </Button>
          </div>
          <p className="text-[11px] font-medium text-muted-foreground text-center">
            L&apos;IA peut prendre 20-30 secondes pour réécrire proprement.
          </p>
        </div>
      )}
    </div>
  );
}
