"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Target, Users, MapPin, BarChart3, Lightbulb, CheckCircle, Loader2 } from "lucide-react";
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
  geography: string[];
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

export default function NewProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormData>({
    name: "",
    summary: "",
    problem: "",
    themes: [],
    geography: [],
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

  // --- Submit ---

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        name: form.name,
        summary: form.summary,
        problem: form.problem,
        themes: form.themes,
        geography: form.geography,
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
                  Nom du projet *
                </label>
                <Input
                  placeholder="Ex: Programme d'aide aux réfugiés ukrainiens"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-bold mb-1.5 block">
                  Résumé du projet *
                </label>
                <textarea
                  className="flex min-h-[100px] w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Décrivez votre projet en 2-3 phrases..."
                  value={form.summary}
                  onChange={(e) => updateField("summary", e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-bold mb-1.5 block">
                  Problème identifié *
                </label>
                <textarea
                  className="flex min-h-[100px] w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Quel problème votre projet cherche-t-il à résoudre ? Quelles sont les causes ?"
                  value={form.problem}
                  onChange={(e) => updateField("problem", e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-bold mb-3 block">
                  Thématiques *
                </label>
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
              </div>

              <div>
                <label className="text-sm font-bold mb-3 block">
                  Zones géographiques *
                </label>
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
                Définissez l&apos;objectif général et les objectifs spécifiques
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <label className="text-sm font-bold mb-1.5 block">
                  Objectif général *
                </label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="L'objectif de haut niveau auquel votre projet contribue..."
                  value={form.general_objective}
                  onChange={(e) =>
                    updateField("general_objective", e.target.value)
                  }
                />
              </div>

              <div>
                <label className="text-sm font-bold mb-1.5 block">
                  Objectif spécifique 1 *
                </label>
                <Input
                  placeholder="Ex: Améliorer l'accès aux soins pour 500 familles déplacées"
                  value={form.specific_objectives[0]}
                  onChange={(e) => updateSpecificObjective(0, e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-bold mb-1.5 block">
                  Objectif spécifique 2
                </label>
                <Input
                  placeholder="Ex: Former 50 travailleurs sociaux locaux"
                  value={form.specific_objectives[1]}
                  onChange={(e) => updateSpecificObjective(1, e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-bold mb-1.5 block">
                  Objectif spécifique 3
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
                Qui sont les bénéficiaires directs et indirects ?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <label className="text-sm font-bold mb-1.5 block">
                  Bénéficiaires directs *
                </label>
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
                Les activités clés que vous allez mettre en œuvre
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <label className="text-sm font-bold mb-1.5 block">
                    Activité {i} {i <= 2 ? "*" : "(optionnel)"}
                  </label>
                  <Input
                    placeholder={
                      i === 1
                        ? "Ex: Mise en place de permanences d'accueil"
                        : i === 2
                        ? "Ex: Sessions de formation professionnelle"
                        : ""
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
                Quels résultats attendez-vous et comment les mesurer ?
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
