"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Sparkles,
  Settings2,
  Target,
} from "lucide-react";

/**
 * Simple project creation flow.
 *
 * One short form, six fields, no AI in the input loop. We collect the bare
 * minimum needed to embed the project well: name, what it does, who it's
 * for, where, budget, duration. Themes/geography are picked from preset
 * chips so the UX stays a few clicks of work.
 *
 * After save, the API runs an invisible cleanup pass on the text fields
 * (typo fixing + vocabulary expansion) before generating the embedding.
 * Once the project exists we redirect to /projects/[id]?match=auto so the
 * detail page can auto-launch the matcher — start to first matched grant
 * in well under a minute.
 *
 * Power users who want the cadre-logique form can opt in via
 * /projects/new?advanced=true.
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

export default function QuickStart() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state — kept flat and short on purpose. We don't need a logframe
  // here; we need enough text for the embedding to be meaningful.
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [beneficiaries, setBeneficiaries] = useState("");
  const [themes, setThemes] = useState<string[]>([]);
  const [geography, setGeography] = useState<string[]>([]);
  const [budget, setBudget] = useState("");
  const [durationMonths, setDurationMonths] = useState("");

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
      const payload = {
        name: name.trim(),
        // We feed the description into both summary and problem — the
        // embedding combines them, and asking the user to write two
        // versions of the same thing in a "simple form" is friction.
        summary: description.trim(),
        problem: description.trim(),
        themes,
        geography,
        budget: budget || null,
        duration_months: durationMonths || null,
        beneficiaries_direct: beneficiaries.trim(),
        beneficiaries_indirect: "",
        general_objective: "",
        specific_objectives: [],
        activities: [],
        methodology: "",
        partners: "",
        expected_results: [],
        sustainability: "",
        // Tell the API to run the invisible cleanup pass before embedding.
        cleanup: true,
      };

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Erreur lors de la création du projet");
      }
      const { project } = await res.json();
      // ?match=auto tells the project detail page to fire the matcher on
      // mount so the user lands on results, not a "click here" page.
      router.push(`/projects/${project.id}?match=auto`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* Top bar */}
      <div className="mb-8 flex items-center justify-between">
        <Link href="/dashboard">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <Link
          href="/projects/new?advanced=true"
          className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
        >
          <Settings2 className="h-3.5 w-3.5" />
          Mode avancé (cadre logique)
        </Link>
      </div>

      {/* Hero */}
      <div className="mb-8">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-border bg-[#c8f76f] shadow-[4px_4px_0px_0px_#1a1a1a]">
          <Target className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-black text-foreground md:text-4xl">
          Nouveau projet
        </h1>
        <p className="mt-2 text-base font-medium text-muted-foreground">
          Six champs, on lance le matching juste après. Vous pourrez tout affiner ensuite.
        </p>
      </div>

      {/* Card */}
      <div className="rounded-2xl border-2 border-border bg-card p-6 shadow-[6px_6px_0px_0px_#1a1a1a] md:p-8 space-y-6">
        {/* Project name */}
        <div>
          <label className="text-sm font-bold mb-1.5 block">
            Nom du projet *
          </label>
          <Input
            placeholder="Ex: Inclusion numérique des seniors en Occitanie"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            autoFocus
          />
        </div>

        {/* Description */}
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

        {/* Beneficiaries */}
        <div>
          <label className="text-sm font-bold mb-1.5 block">
            Bénéficiaires *
          </label>
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

        {/* Themes */}
        <div>
          <label className="text-sm font-bold mb-1.5 block">
            Thématiques
          </label>
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

        {/* Geography */}
        <div>
          <label className="text-sm font-bold mb-1.5 block">
            Zone géographique
          </label>
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

        {/* Budget + duration */}
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
            <label className="text-sm font-bold mb-1.5 block">
              Durée (mois)
            </label>
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
                Création et matching en cours...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Créer et trouver mes subventions
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>

      <p className="mt-5 text-center text-xs font-medium text-muted-foreground">
        Vous pourrez compléter le cadre logique complet après le matching.
      </p>
    </div>
  );
}
