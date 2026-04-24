"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Target, Users, BarChart3, Lightbulb, CheckCircle, Loader2, Sparkles, Wand2 } from "lucide-react";
import Link from "next/link";

const STEPS = [
  { id: 1, label: "Contexte", icon: Lightbulb },
  { id: 2, label: "Objectifs", icon: Target },
  { id: 3, label: "Bénéficiaires", icon: Users },
  { id: 4, label: "Activités", icon: BarChart3 },
  { id: 5, label: "Résultats", icon: CheckCircle },
];

const THEMATIC_OPTIONS = [
  { label: "Humanitaire", color: "pink" as const },
  { label: "Éducation", color: "blue" as const },
  { label: "Jeunesse", color: "yellow" as const },
  { label: "Inclusion", color: "purple" as const },
  { label: "Culture", color: "green" as const },
  { label: "Santé", color: "pink" as const },
  { label: "Environnement", color: "green" as const },
  { label: "Droits humains", color: "blue" as const },
  { label: "Migration", color: "yellow" as const },
  { label: "Développement", color: "purple" as const },
  { label: "Égalité", color: "pink" as const },
  { label: "Numérique", color: "blue" as const },
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

interface ExpectedResult {
  result: string;
  indicator: string;
}

interface FormData {
  name: string;
  summary: string;
  problem: string;
  themes: string[];
  customTheme: string;
  geography: string[];
  customGeo: string;
  budget: string;
  duration_months: string;
  general_objective: string;
  specific_objectives: string[];
  beneficiaries_direct: string;
  beneficiaries_indirect: string;
  beneficiaries_count: string;
  activities: string[];
  methodology: string;
  partners: string;
  expected_results: ExpectedResult[];
  sustainability: string;
}

type Suggestion = Partial<{
  name: string;
  summary: string;
  problem: string;
  themes: string[];
  geography: string[];
  budget: number | null;
  duration_months: number | null;
  general_objective: string;
  specific_objectives: string[];
  beneficiaries_direct: string;
  beneficiaries_indirect: string;
  beneficiaries_count: number | null;
  activities: string[];
  methodology: string;
  partners: string;
  expected_results: { result?: string; indicator?: string }[];
  sustainability: string;
}>;

export default function NewProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Smart-fill state — the "describe your project in a paragraph" flow.
  const [smartDescription, setSmartDescription] = useState("");
  const [smartLoading, setSmartLoading] = useState(false);
  const [smartError, setSmartError] = useState<string | null>(null);
  const [smartFilled, setSmartFilled] = useState(false);

  const [form, setForm] = useState<FormData>({
    name: "",
    summary: "",
    problem: "",
    themes: [],
    customTheme: "",
    geography: [],
    customGeo: "",
    budget: "",
    duration_months: "",
    general_objective: "",
    specific_objectives: ["", "", ""],
    beneficiaries_direct: "",
    beneficiaries_indirect: "",
    beneficiaries_count: "",
    activities: ["", "", "", ""],
    methodology: "",
    partners: "",
    expected_results: [
      { result: "", indicator: "" },
      { result: "", indicator: "" },
      { result: "", indicator: "" },
    ],
    sustainability: "",
  });

  // --- Field update helpers ---

  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleTheme = (theme: string) => {
    setForm((prev) => ({
      ...prev,
      themes: prev.themes.includes(theme)
        ? prev.themes.filter((t) => t !== theme)
        : [...prev.themes, theme],
    }));
  };

  const toggleGeo = (geo: string) => {
    setForm((prev) => ({
      ...prev,
      geography: prev.geography.includes(geo)
        ? prev.geography.filter((g) => g !== geo)
        : [...prev.geography, geo],
    }));
  };

  const updateSpecificObjective = (index: number, value: string) => {
    setForm((prev) => {
      const updated = [...prev.specific_objectives];
      updated[index] = value;
      return { ...prev, specific_objectives: updated };
    });
  };

  const updateActivity = (index: number, value: string) => {
    setForm((prev) => {
      const updated = [...prev.activities];
      updated[index] = value;
      return { ...prev, activities: updated };
    });
  };

  const updateExpectedResult = (
    index: number,
    field: "result" | "indicator",
    value: string
  ) => {
    setForm((prev) => {
      const updated = [...prev.expected_results];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, expected_results: updated };
    });
  };

  // --- Smart-fill ---

  const applySuggestion = (s: Suggestion) => {
    setForm((prev) => {
      const pad = (arr: string[] | undefined, len: number) => {
        const out = Array.isArray(arr) ? [...arr] : [];
        while (out.length < len) out.push("");
        return out.slice(0, Math.max(len, out.length));
      };
      const padResults = (
        arr: { result?: string; indicator?: string }[] | undefined,
        len: number
      ) => {
        const out = Array.isArray(arr)
          ? arr.map((r) => ({
              result: r.result || "",
              indicator: r.indicator || "",
            }))
          : [];
        while (out.length < len) out.push({ result: "", indicator: "" });
        return out.slice(0, Math.max(len, out.length));
      };
      // Split proposed themes/geography into known-options vs custom so the
      // toggle buttons light up correctly for values in the preset list.
      const presetThemes = THEMATIC_OPTIONS.map((t) => t.label);
      const proposedThemes = Array.isArray(s.themes) ? s.themes : [];
      const matchedThemes = proposedThemes.filter((t) => presetThemes.includes(t));
      const customTheme = proposedThemes.find((t) => !presetThemes.includes(t)) || "";

      const proposedGeo = Array.isArray(s.geography) ? s.geography : [];
      const matchedGeo = proposedGeo.filter((g) => GEO_OPTIONS.includes(g));
      const customGeo = proposedGeo.find((g) => !GEO_OPTIONS.includes(g)) || "";

      return {
        ...prev,
        name: s.name || prev.name,
        summary: s.summary || prev.summary,
        problem: s.problem || prev.problem,
        themes: matchedThemes.length ? matchedThemes : prev.themes,
        customTheme: customTheme || prev.customTheme,
        geography: matchedGeo.length ? matchedGeo : prev.geography,
        customGeo: customGeo || prev.customGeo,
        budget: s.budget != null ? String(s.budget) : prev.budget,
        duration_months:
          s.duration_months != null ? String(s.duration_months) : prev.duration_months,
        general_objective: s.general_objective || prev.general_objective,
        specific_objectives: pad(s.specific_objectives, 3),
        beneficiaries_direct: s.beneficiaries_direct || prev.beneficiaries_direct,
        beneficiaries_indirect:
          s.beneficiaries_indirect || prev.beneficiaries_indirect,
        beneficiaries_count:
          s.beneficiaries_count != null
            ? String(s.beneficiaries_count)
            : prev.beneficiaries_count,
        activities: pad(s.activities, 4),
        methodology: s.methodology || prev.methodology,
        partners: s.partners || prev.partners,
        expected_results: padResults(s.expected_results, 3),
        sustainability: s.sustainability || prev.sustainability,
      };
    });
  };

  const handleSmartFill = async () => {
    setSmartLoading(true);
    setSmartError(null);
    setSmartFilled(false);
    try {
      const res = await fetch("/api/projects/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: smartDescription }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      applySuggestion(data.suggestion as Suggestion);
      setSmartFilled(true);
    } catch (e) {
      setSmartError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setSmartLoading(false);
    }
  };

  // --- Submit ---

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const allThemes = [...form.themes, ...(form.customTheme ? [form.customTheme] : [])];
      const allGeo = [...form.geography, ...(form.customGeo ? [form.customGeo] : [])];

      const payload = {
        name: form.name,
        summary: form.summary,
        problem: form.problem,
        themes: allThemes,
        geography: allGeo,
        budget: form.budget || null,
        duration_months: form.duration_months || null,
        general_objective: form.general_objective,
        specific_objectives: form.specific_objectives.filter(Boolean),
        beneficiaries_direct: form.beneficiaries_direct,
        beneficiaries_indirect: form.beneficiaries_indirect,
        beneficiaries_count: form.beneficiaries_count || null,
        activities: form.activities.filter(Boolean),
        methodology: form.methodology,
        partners: form.partners,
        expected_results: form.expected_results.filter((r) => r.result),
        sustainability: form.sustainability,
      };

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la création du projet");
      }

      const { project } = await res.json();
      router.push(`/projects/${project.id}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erreur inconnue";
      setError(message);
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-black text-foreground">
            Nouveau projet
          </h1>
          <p className="text-muted-foreground font-medium">
            Basé sur le cadre logique (logframe) pour matcher vos subventions
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex gap-2 mb-8">
        {STEPS.map((s) => (
          <button
            key={s.id}
            onClick={() => setStep(s.id)}
            className={`flex items-center gap-2 rounded-xl border-2 border-border px-4 py-2 text-sm font-bold transition-all ${
              step === s.id
                ? "bg-[#c8f76f] shadow-[3px_3px_0px_0px_#1a1a1a]"
                : step > s.id
                ? "bg-secondary"
                : "bg-background"
            }`}
          >
            <s.icon className="h-4 w-4" />
            {s.label}
          </button>
        ))}
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 rounded-xl border-2 border-red-400 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      {/* Smart-fill — paste a paragraph, let Claude pre-fill the whole form.
          Most porteurs already have 2-3 paragraphs about their project in an
          email or grant application draft; this saves 10 minutes of typing. */}
      {step === 1 && (
        <Card className="mb-6 border-[#d4b5ff] bg-[#f5edff]">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-border bg-[#d4b5ff] shadow-[3px_3px_0px_0px_#1a1a1a]">
                <Wand2 className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-black">
                  Décris ton projet en quelques phrases, on remplit le reste
                </h3>
                <p className="text-xs font-medium text-muted-foreground mt-0.5">
                  Colle un paragraphe ou un pitch — notre IA le transforme en
                  cadre logique. Tu pourras tout ajuster ensuite.
                </p>
                <textarea
                  className="mt-3 flex min-h-[100px] w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Ex: Nous voulons lancer un programme d'accompagnement pour 200 jeunes de quartiers prioritaires en Île-de-France. L'idée est de combiner du mentorat, des ateliers numériques et des stages en entreprise, sur 18 mois, avec un budget autour de 120K€..."
                  value={smartDescription}
                  onChange={(e) => setSmartDescription(e.target.value)}
                  spellCheck
                  lang="fr"
                  disabled={smartLoading}
                />
                <div className="mt-3 flex items-center gap-3 flex-wrap">
                  <Button
                    variant="accent"
                    onClick={handleSmartFill}
                    disabled={smartLoading || smartDescription.trim().length < 30}
                  >
                    {smartLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analyse en cours...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        {smartFilled ? "Régénérer" : "Remplir avec l'IA"}
                      </>
                    )}
                  </Button>
                  {smartFilled && !smartError && (
                    <span className="text-xs font-bold text-green-700 flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Formulaire pré-rempli — vérifie et ajuste ci-dessous
                    </span>
                  )}
                  {smartError && (
                    <span className="text-xs font-bold text-red-700">
                      {smartError}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Context */}
      {step === 1 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Contexte du projet
              </CardTitle>
              <CardDescription>
                Décrivez le contexte et le problème que votre projet adresse
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <label className="text-sm font-bold mb-1.5 block">
                  Quel est le nom de votre projet ? *
                </label>
                <Input
                  placeholder="Ex: Programme d'aide aux réfugiés ukrainiens"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-bold mb-1.5 block">
                  En quoi consiste votre projet ? *
                </label>
                <p className="text-xs text-muted-foreground mb-2">Décrivez en quelques phrases ce que vous souhaitez faire concrètement.</p>
                <textarea
                  className="flex min-h-[100px] w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Ex: Nous souhaitons mettre en place un programme d'accueil et d'accompagnement pour les familles réfugiées..."
                  value={form.summary}
                  onChange={(e) => updateField("summary", e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-bold mb-1.5 block">
                  Quel problème cherchez-vous à résoudre ? *
                </label>
                <p className="text-xs text-muted-foreground mb-2">Décrivez la situation actuelle et pourquoi il est important d&apos;agir.</p>
                <textarea
                  className="flex min-h-[100px] w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Ex: De nombreuses familles déplacées n'ont pas accès aux services de base..."
                  value={form.problem}
                  onChange={(e) => updateField("problem", e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-bold mb-1.5 block">
                  Dans quelles thématiques s&apos;inscrit votre projet ? *
                </label>
                <p className="text-xs text-muted-foreground mb-3">Sélectionnez une ou plusieurs thématiques. Cela nous aidera à trouver les subventions les plus pertinentes.</p>
                <div className="flex flex-wrap gap-2">
                  {THEMATIC_OPTIONS.map((theme) => (
                    <button
                      key={theme.label}
                      onClick={() => toggleTheme(theme.label)}
                      className={`rounded-xl border-2 border-border px-3.5 py-1.5 text-sm font-bold transition-all ${
                        form.themes.includes(theme.label)
                          ? "shadow-[3px_3px_0px_0px_#1a1a1a] translate-x-[-1px] translate-y-[-1px]"
                          : ""
                      }`}
                      style={{
                        backgroundColor: form.themes.includes(theme.label)
                          ? theme.color === "pink"
                            ? "#ffa3d1"
                            : theme.color === "blue"
                            ? "#a3d5ff"
                            : theme.color === "yellow"
                            ? "#ffe066"
                            : theme.color === "purple"
                            ? "#d4b5ff"
                            : "#c8f76f"
                          : undefined,
                      }}
                    >
                      {theme.label}
                    </button>
                  ))}
                </div>
                <div className="mt-3">
                  <Input
                    placeholder="Autre thématique ? Précisez ici..."
                    value={form.customTheme}
                    onChange={(e) => updateField("customTheme", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-bold mb-1.5 block">
                  Où se déroule votre projet ? *
                </label>
                <p className="text-xs text-muted-foreground mb-3">Sélectionnez les zones géographiques concernées.</p>
                <div className="flex flex-wrap gap-2">
                  {GEO_OPTIONS.map((geo) => (
                    <button
                      key={geo}
                      onClick={() => toggleGeo(geo)}
                      className={`rounded-xl border-2 border-border px-3.5 py-1.5 text-sm font-bold transition-all ${
                        form.geography.includes(geo)
                          ? "bg-[#ffe066] shadow-[3px_3px_0px_0px_#1a1a1a] translate-x-[-1px] translate-y-[-1px]"
                          : "bg-background"
                      }`}
                    >
                      {geo}
                    </button>
                  ))}
                </div>
                <div className="mt-3">
                  <Input
                    placeholder="Autre zone ? Précisez (ex: Liban, Haïti...)"
                    value={form.customGeo}
                    onChange={(e) => updateField("customGeo", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-bold mb-1.5 block">
                    Budget demandé (€)
                  </label>
                  <Input
                    type="number"
                    placeholder="Ex: 150000"
                    value={form.budget}
                    onChange={(e) => updateField("budget", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-bold mb-1.5 block">
                    Durée (mois)
                  </label>
                  <Input
                    type="number"
                    placeholder="Ex: 24"
                    value={form.duration_months}
                    onChange={(e) =>
                      updateField("duration_months", e.target.value)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button variant="accent" onClick={() => setStep(2)}>
              Suivant : Objectifs
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Objectives */}
      {step === 2 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Objectifs (SMART)
              </CardTitle>
              <CardDescription>
                Quel changement votre projet veut-il produire ?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <label className="text-sm font-bold mb-1.5 block">
                  Quel est l&apos;objectif principal de votre projet ? *
                </label>
                <p className="text-xs text-muted-foreground mb-2">Le changement global que vous souhaitez produire à long terme.</p>
                <textarea
                  className="flex min-h-[80px] w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Ex: Réduire l'isolement des familles réfugiées et faciliter leur intégration"
                  value={form.general_objective}
                  onChange={(e) =>
                    updateField("general_objective", e.target.value)
                  }
                />
              </div>

              <div>
                <label className="text-sm font-bold mb-1.5 block">
                  Objectif concret 1 *
                </label>
                <Input
                  placeholder="Ex: Améliorer l'accès aux soins pour 500 familles déplacées"
                  value={form.specific_objectives[0]}
                  onChange={(e) => updateSpecificObjective(0, e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-bold mb-1.5 block">
                  Objectif concret 2 (optionnel)
                </label>
                <Input
                  placeholder="Ex: Former 50 travailleurs sociaux locaux"
                  value={form.specific_objectives[1]}
                  onChange={(e) => updateSpecificObjective(1, e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-bold mb-1.5 block">
                  Objectif concret 3 (optionnel)
                </label>
                <Input
                  placeholder="Optionnel"
                  value={form.specific_objectives[2]}
                  onChange={(e) => updateSpecificObjective(2, e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="h-4 w-4" />
              Contexte
            </Button>
            <Button variant="accent" onClick={() => setStep(3)}>
              Suivant : Bénéficiaires
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Beneficiaries */}
      {step === 3 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Bénéficiaires
              </CardTitle>
              <CardDescription>
                À qui votre projet s&apos;adresse-t-il ?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <label className="text-sm font-bold mb-1.5 block">
                  Qui bénéficiera directement de votre projet ? *
                </label>
                <p className="text-xs text-muted-foreground mb-2">Les personnes ou groupes qui recevront directement l&apos;aide ou les services.</p>
                <textarea
                  className="flex min-h-[80px] w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Ex: 500 familles déplacées d'Ukraine vivant en Île-de-France"
                  value={form.beneficiaries_direct}
                  onChange={(e) =>
                    updateField("beneficiaries_direct", e.target.value)
                  }
                />
              </div>

              <div>
                <label className="text-sm font-bold mb-1.5 block">
                  Nombre estimé de bénéficiaires directs
                </label>
                <Input
                  type="number"
                  placeholder="Ex: 2000"
                  value={form.beneficiaries_count}
                  onChange={(e) =>
                    updateField("beneficiaries_count", e.target.value)
                  }
                />
              </div>

              <div>
                <label className="text-sm font-bold mb-1.5 block">
                  Bénéficiaires indirects
                </label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Ex: Communautés d'accueil, services sociaux locaux..."
                  value={form.beneficiaries_indirect}
                  onChange={(e) =>
                    updateField("beneficiaries_indirect", e.target.value)
                  }
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ArrowLeft className="h-4 w-4" />
              Objectifs
            </Button>
            <Button variant="accent" onClick={() => setStep(4)}>
              Suivant : Activités
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Activities */}
      {step === 4 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Activités principales
              </CardTitle>
              <CardDescription>
                Que allez-vous faire concrètement pour atteindre vos objectifs ?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <label className="text-sm font-bold mb-1.5 block">
                    Activité {i} {i === 1 ? "*" : "(optionnel)"}
                  </label>
                  <Input
                    placeholder={
                      i === 1
                        ? "Ex: Mise en place de permanences d'accueil"
                        : i === 2
                        ? "Ex: Sessions de formation professionnelle"
                        : "Ajoutez une activité supplémentaire..."
                    }
                    value={form.activities[i - 1]}
                    onChange={(e) => updateActivity(i - 1, e.target.value)}
                  />
                </div>
              ))}

              <div>
                <label className="text-sm font-bold mb-1.5 block">
                  Méthodologie
                </label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Comment allez-vous mettre en œuvre ces activités ?"
                  value={form.methodology}
                  onChange={(e) => updateField("methodology", e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-bold mb-1.5 block">
                  Partenaires
                </label>
                <textarea
                  className="flex min-h-[60px] w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Quels partenaires seront impliqués ? (ONG, institutions, collectivités...)"
                  value={form.partners}
                  onChange={(e) => updateField("partners", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(3)}>
              <ArrowLeft className="h-4 w-4" />
              Bénéficiaires
            </Button>
            <Button variant="accent" onClick={() => setStep(5)}>
              Suivant : Résultats
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 5: Expected Results */}
      {step === 5 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Résultats attendus & Indicateurs
              </CardTitle>
              <CardDescription>
                Comment saurez-vous que votre projet a réussi ?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-xl border-2 border-border p-4 space-y-3"
                >
                  <label className="text-sm font-black block">
                    Résultat {i} {i === 1 ? "*" : "(optionnel)"}
                  </label>
                  <Input
                    placeholder={
                      i === 1
                        ? "Ex: 500 familles ont accès à un accompagnement social"
                        : ""
                    }
                    value={form.expected_results[i - 1].result}
                    onChange={(e) =>
                      updateExpectedResult(i - 1, "result", e.target.value)
                    }
                  />
                  <label className="text-xs font-bold block text-muted-foreground">
                    Indicateur de mesure
                  </label>
                  <Input
                    placeholder={
                      i === 1
                        ? "Ex: Nombre de familles accompagnées par trimestre"
                        : ""
                    }
                    value={form.expected_results[i - 1].indicator}
                    onChange={(e) =>
                      updateExpectedResult(i - 1, "indicator", e.target.value)
                    }
                  />
                </div>
              ))}

              <div>
                <label className="text-sm font-bold mb-1.5 block">
                  Durabilité / Pérennisation
                </label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Comment les résultats seront-ils maintenus après la fin du financement ?"
                  value={form.sustainability}
                  onChange={(e) => updateField("sustainability", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(4)}>
              <ArrowLeft className="h-4 w-4" />
              Activités
            </Button>
            <Button
              variant="accent"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              {submitting
                ? "Création en cours..."
                : "Créer le projet & trouver des subventions"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
