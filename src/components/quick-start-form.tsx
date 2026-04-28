"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";

/**
 * Shared quick-start project form.
 *
 * Used in two places:
 * - /try (public, pre-signup): saves the form to localStorage and bounces
 *   to /signup. The whole point of the conversion-optimized funnel is that
 *   the prospect commits to describing their project *before* hitting the
 *   auth wall.
 * - /projects/new (authenticated): posts the form to /api/projects, runs
 *   AI cleanup + embedding, then redirects to the project detail page with
 *   ?match=auto.
 *
 * The two modes share UI to guarantee the public form looks and feels
 * identical to the in-app form — no jarring "this is a marketing form"
 * vibe.
 */

const THEMATIC_OPTIONS = [
  { label: "Humanitaire", color: "#ffa3d1" },
  { label: "Éducation", color: "#a3d5ff" },
  { label: "Jeunesse", color: "#ffe066" },
  { label: "Inclusion", color: "#d4b5ff" },
  { label: "Culture", color: "#c8f76f" },
  { label: "Santé", color: "#ffa3d1" },
  { label: "Environnement", color: "#c8f76f" },
  { label: "Droits humains", color: "#a3d5ff" },
  { label: "Migration", color: "#ffe066" },
  { label: "Développement", color: "#d4b5ff" },
  { label: "Égalité", color: "#ffa3d1" },
  { label: "Numérique", color: "#a3d5ff" },
];

const GEO_OPTIONS = [
  "Local / Territorial",
  "National (France)",
  "Europe",
  "Afrique",
  "Asie",
  "Amérique latine",
  "International",
];

export type QuickStartFormData = {
  name: string;
  description: string;
  beneficiaries: string;
  themes: string[];
  geography: string[];
  budget: string;
  durationMonths: string;
};

export type QuickStartFormProps = {
  ctaLabel: React.ReactNode;
  loadingLabel?: React.ReactNode;
  onSubmit: (data: QuickStartFormData) => Promise<void> | void;
  initial?: Partial<QuickStartFormData>;
};

export function QuickStartForm({
  ctaLabel,
  loadingLabel,
  onSubmit,
  initial,
}: QuickStartFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [beneficiaries, setBeneficiaries] = useState(initial?.beneficiaries ?? "");
  const [themes, setThemes] = useState<string[]>(initial?.themes ?? []);
  const [geography, setGeography] = useState<string[]>(initial?.geography ?? []);
  const [budget, setBudget] = useState(initial?.budget ?? "");
  const [durationMonths, setDurationMonths] = useState(initial?.durationMonths ?? "");

  const toggleTheme = (t: string) =>
    setThemes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  const toggleGeo = (g: string) =>
    setGeography((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );

  const canSubmit =
    name.trim().length > 0 &&
    description.trim().length >= 30 &&
    beneficiaries.trim().length > 0 &&
    !loading;

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        beneficiaries: beneficiaries.trim(),
        themes,
        geography,
        budget,
        durationMonths,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border-2 border-border bg-card p-6 shadow-[6px_6px_0px_0px_#1a1a1a] md:p-8 space-y-6">
      <div>
        <label className="text-sm font-bold mb-1.5 block">Nom du projet *</label>
        <Input
          placeholder="Ex: Inclusion numérique des seniors en Occitanie"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          autoFocus
        />
      </div>

      <div>
        <label className="text-sm font-bold mb-1.5 block">
          Décrivez votre projet *
        </label>
        <p className="text-xs text-muted-foreground mb-2">
          Ce que vous voulez faire concrètement — quelques phrases suffisent.
        </p>
        <textarea
          className="flex min-h-[140px] w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          placeholder="Ex: Nous organisons des ateliers hebdomadaires d'initiation au numérique dans 15 communes rurales d'Occitanie, avec un accompagnement individuel pour les plus isolés."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          spellCheck
          lang="fr"
          disabled={loading}
        />
        <p className="mt-1 text-xs font-medium text-muted-foreground">
          {description.trim().length < 30
            ? `Au moins 30 caractères (${description.trim().length}/30)`
            : `${description.length} caractères`}
        </p>
      </div>

      <div>
        <label className="text-sm font-bold mb-1.5 block">Bénéficiaires *</label>
        <p className="text-xs text-muted-foreground mb-2">
          Qui aidez-vous concrètement ?
        </p>
        <Input
          placeholder="Ex: Seniors isolés en zone rurale, 60+ ans"
          value={beneficiaries}
          onChange={(e) => setBeneficiaries(e.target.value)}
          disabled={loading}
        />
      </div>

      <div>
        <label className="text-sm font-bold mb-1.5 block">Thématiques</label>
        <p className="text-xs text-muted-foreground mb-3">
          Sélectionnez celles qui s&apos;appliquent (optionnel mais recommandé).
        </p>
        <div className="flex flex-wrap gap-2">
          {THEMATIC_OPTIONS.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => toggleTheme(t.label)}
              disabled={loading}
              className={`rounded-xl border-2 border-border px-3.5 py-1.5 text-sm font-bold transition-all ${
                themes.includes(t.label)
                  ? "shadow-[3px_3px_0px_0px_#1a1a1a] translate-x-[-1px] translate-y-[-1px]"
                  : ""
              }`}
              style={{
                backgroundColor: themes.includes(t.label) ? t.color : undefined,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-bold mb-1.5 block">Zone géographique</label>
        <div className="flex flex-wrap gap-2">
          {GEO_OPTIONS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => toggleGeo(g)}
              disabled={loading}
              className={`rounded-xl border-2 border-border px-3.5 py-1.5 text-sm font-bold transition-all ${
                geography.includes(g)
                  ? "bg-[#ffe066] shadow-[3px_3px_0px_0px_#1a1a1a] translate-x-[-1px] translate-y-[-1px]"
                  : "bg-background"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-bold mb-1.5 block">
            Budget demandé (€)
          </label>
          <Input
            type="number"
            placeholder="Ex: 50000"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            disabled={loading}
          />
        </div>
        <div>
          <label className="text-sm font-bold mb-1.5 block">Durée (mois)</label>
          <Input
            type="number"
            placeholder="Ex: 12"
            value={durationMonths}
            onChange={(e) => setDurationMonths(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-xl border-2 border-red-400 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center md:justify-end">
        <Button
          variant="accent"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="md:min-w-[280px]"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {loadingLabel ?? "Chargement..."}
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              {ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

/**
 * Build the API payload from the simple form. Centralized here because
 * both the in-app submit and the post-signup auto-submit need it shaped
 * the same way for the embedding cleanup pass to behave identically.
 */
export function quickStartToApiPayload(data: QuickStartFormData) {
  return {
    name: data.name,
    summary: data.description,
    problem: data.description,
    themes: data.themes,
    geography: data.geography,
    budget: data.budget || null,
    duration_months: data.durationMonths || null,
    beneficiaries_direct: data.beneficiaries,
    beneficiaries_indirect: "",
    general_objective: "",
    specific_objectives: [],
    activities: [],
    methodology: "",
    partners: "",
    expected_results: [],
    sustainability: "",
    cleanup: true,
  };
}

export const PENDING_PROJECT_STORAGE_KEY = "emile.pending_project_v1";
