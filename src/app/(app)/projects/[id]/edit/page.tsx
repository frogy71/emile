"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Target,
  Users,
  BarChart3,
  Lightbulb,
  CheckCircle,
  Loader2,
  Save,
  Sparkles,
} from "lucide-react";

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

interface ExpectedResult {
  result: string;
  indicator: string;
}

interface FormState {
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

const EMPTY_FORM: FormState = {
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
};

type ProjectRow = {
  name?: string | null;
  summary?: string | null;
  target_geography?: string[] | null;
  requested_amount_eur?: number | null;
  duration_months?: number | null;
  indicators?: string[] | null;
  logframe_data?: {
    problem?: string | null;
    themes?: string[] | null;
    general_objective?: string | null;
    specific_objectives?: string[] | null;
    beneficiaries_direct?: string | null;
    beneficiaries_indirect?: string | null;
    beneficiaries_count?: string | number | null;
    activities?: string[] | null;
    methodology?: string | null;
    partners?: string | null;
    expected_results?: ExpectedResult[] | null;
    sustainability?: string | null;
  } | null;
};

// Knit the row + jsonb back into the flat form shape. Logframe stays the source
// of truth for wizard-only fields (themes, activities, results) since those
// aren't top-level columns.
function rowToForm(row: ProjectRow): FormState {
  const lf = row.logframe_data || {};
  return {
    name: row.name ?? "",
    summary: row.summary ?? "",
    problem: lf.problem ?? "",
    themes: lf.themes ?? [],
    customTheme: "",
    geography: row.target_geography ?? [],
    customGeo: "",
    budget: row.requested_amount_eur?.toString() ?? "",
    duration_months: row.duration_months?.toString() ?? "",
    general_objective: lf.general_objective ?? "",
    specific_objectives: padArray(lf.specific_objectives ?? [], 3),
    beneficiaries_direct: lf.beneficiaries_direct ?? "",
    beneficiaries_indirect: lf.beneficiaries_indirect ?? "",
    beneficiaries_count: lf.beneficiaries_count?.toString() ?? "",
    activities: padArray(lf.activities ?? [], 4),
    methodology: lf.methodology ?? "",
    partners: lf.partners ?? "",
    expected_results: padResults(lf.expected_results ?? [], 3),
    sustainability: lf.sustainability ?? "",
  };
}

function padArray(arr: string[], length: number): string[] {
  const result = [...arr];
  while (result.length < length) result.push("");
  return result;
}

function padResults(arr: ExpectedResult[], length: number): ExpectedResult[] {
  const result = [...arr];
  while (result.length < length) result.push({ result: "", indicator: "" });
  return result;
}

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id as string;

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load the current project once.
  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) throw new Error("Projet introuvable");
      const { project } = await res.json();
      setForm(rowToForm(project));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const updateField = (field: keyof FormState, value: string) => {
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

  const handleSave = async (thenRematch: boolean) => {
    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const allThemes = [
        ...form.themes,
        ...(form.customTheme ? [form.customTheme] : []),
      ];
      const allGeo = [
        ...form.geography,
        ...(form.customGeo ? [form.customGeo] : []),
      ];

      const logframeData = {
        general_objective: form.general_objective || null,
        specific_objectives: form.specific_objectives.filter(Boolean),
        beneficiaries_direct: form.beneficiaries_direct || null,
        beneficiaries_indirect: form.beneficiaries_indirect || null,
        beneficiaries_count: form.beneficiaries_count || null,
        activities: form.activities.filter(Boolean),
        methodology: form.methodology || null,
        partners: form.partners || null,
        expected_results: form.expected_results.filter((r) => r.result),
        sustainability: form.sustainability || null,
        problem: form.problem || null,
        themes: allThemes,
      };

      const payload = {
        name: form.name,
        summary: form.summary || null,
        objectives: form.specific_objectives.filter(Boolean),
        target_beneficiaries: [
          form.beneficiaries_direct,
          form.beneficiaries_indirect,
        ].filter(Boolean),
        target_geography: allGeo,
        requested_amount_eur: form.budget ? parseInt(form.budget, 10) : null,
        duration_months: form.duration_months
          ? parseInt(form.duration_months, 10)
          : null,
        indicators: form.expected_results
          .map((r) => r.indicator)
          .filter(Boolean),
        logframe_data: logframeData,
      };

      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la sauvegarde");
      }

      setSaveSuccess(true);

      // Optional: re-run matching with the fresh data so the user sees new
      // scores immediately (that's the whole "affiner la recherche" promise).
      if (thenRematch) {
        try {
          await fetch(`/api/projects/${projectId}/match`, { method: "POST" });
        } catch {
          // Non-fatal — the save already worked.
        }
      }

      router.push(`/projects/${projectId}`);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/projects/${projectId}`}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-black text-foreground">
            Modifier le projet
          </h1>
          <p className="text-muted-foreground font-medium">
            Mets à jour les infos puis relance une recherche affinée
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Enregistrer
          </Button>
          <Button
            variant="accent"
            onClick={() => handleSave(true)}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Enregistrer & relancer la recherche
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border-2 border-red-400 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      )}
      {saveSuccess && !error && (
        <div className="mb-6 rounded-xl border-2 border-green-500 bg-green-50 px-4 py-3 text-sm font-bold text-green-800">
          Modifications enregistrées. Redirection…
        </div>
      )}

      <div className="space-y-6">
        {/* Context */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Contexte
            </CardTitle>
            <CardDescription>
              Nom, résumé, thématiques, géographie et budget
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <label className="text-sm font-bold mb-1.5 block">
                Nom du projet *
              </label>
              <Input
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-bold mb-1.5 block">Résumé</label>
              <textarea
                className="flex min-h-[100px] w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.summary}
                onChange={(e) => updateField("summary", e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-bold mb-1.5 block">
                Problème adressé
              </label>
              <textarea
                className="flex min-h-[80px] w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.problem}
                onChange={(e) => updateField("problem", e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-bold mb-2 block">
                Thématiques
              </label>
              <div className="flex flex-wrap gap-2">
                {THEMATIC_OPTIONS.map((theme) => (
                  <button
                    key={theme.label}
                    onClick={() => toggleTheme(theme.label)}
                    type="button"
                    className={`rounded-xl border-2 border-border px-3.5 py-1.5 text-sm font-bold transition-all ${
                      form.themes.includes(theme.label)
                        ? "shadow-[3px_3px_0px_0px_#1a1a1a] translate-x-[-1px] translate-y-[-1px]"
                        : ""
                    }`}
                    style={{
                      backgroundColor: form.themes.includes(theme.label)
                        ? theme.color
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
              <label className="text-sm font-bold mb-2 block">
                Zones géographiques
              </label>
              <div className="flex flex-wrap gap-2">
                {GEO_OPTIONS.map((geo) => (
                  <button
                    key={geo}
                    onClick={() => toggleGeo(geo)}
                    type="button"
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
                  placeholder="Autre zone ? (ex: Liban, Haïti...)"
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
                  value={form.duration_months}
                  onChange={(e) =>
                    updateField("duration_months", e.target.value)
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Objectives */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Objectifs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <label className="text-sm font-bold mb-1.5 block">
                Objectif général
              </label>
              <textarea
                className="flex min-h-[80px] w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.general_objective}
                onChange={(e) =>
                  updateField("general_objective", e.target.value)
                }
              />
            </div>
            {form.specific_objectives.map((obj, i) => (
              <div key={i}>
                <label className="text-sm font-bold mb-1.5 block">
                  Objectif spécifique {i + 1}
                  {i === 0 ? " *" : " (optionnel)"}
                </label>
                <Input
                  value={obj}
                  onChange={(e) => updateSpecificObjective(i, e.target.value)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Beneficiaries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Bénéficiaires
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <label className="text-sm font-bold mb-1.5 block">
                Bénéficiaires directs
              </label>
              <textarea
                className="flex min-h-[80px] w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.beneficiaries_direct}
                onChange={(e) =>
                  updateField("beneficiaries_direct", e.target.value)
                }
              />
            </div>
            <div>
              <label className="text-sm font-bold mb-1.5 block">
                Nombre estimé
              </label>
              <Input
                type="number"
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
                value={form.beneficiaries_indirect}
                onChange={(e) =>
                  updateField("beneficiaries_indirect", e.target.value)
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Activités
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {form.activities.map((a, i) => (
              <div key={i}>
                <label className="text-sm font-bold mb-1.5 block">
                  Activité {i + 1}
                  {i === 0 ? " *" : " (optionnel)"}
                </label>
                <Input
                  value={a}
                  onChange={(e) => updateActivity(i, e.target.value)}
                />
              </div>
            ))}
            <div>
              <label className="text-sm font-bold mb-1.5 block">
                Méthodologie
              </label>
              <textarea
                className="flex min-h-[80px] w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                value={form.partners}
                onChange={(e) => updateField("partners", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Résultats attendus & indicateurs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {form.expected_results.map((er, i) => (
              <div
                key={i}
                className="rounded-xl border-2 border-border p-4 space-y-3"
              >
                <label className="text-sm font-black block">
                  Résultat {i + 1}
                  {i === 0 ? " *" : " (optionnel)"}
                </label>
                <Input
                  value={er.result}
                  onChange={(e) =>
                    updateExpectedResult(i, "result", e.target.value)
                  }
                />
                <label className="text-xs font-bold block text-muted-foreground">
                  Indicateur
                </label>
                <Input
                  value={er.indicator}
                  onChange={(e) =>
                    updateExpectedResult(i, "indicator", e.target.value)
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
                value={form.sustainability}
                onChange={(e) => updateField("sustainability", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Sticky footer actions — mirrors the header so users don't have to
            scroll back up after editing a long form. */}
        <div className="sticky bottom-4 z-10 flex justify-end gap-2 rounded-2xl border-2 border-border bg-card p-3 shadow-[4px_4px_0px_0px_#1a1a1a]">
          <Link href={`/projects/${projectId}`}>
            <Button variant="outline">Annuler</Button>
          </Link>
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Enregistrer
          </Button>
          <Button
            variant="accent"
            onClick={() => handleSave(true)}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Enregistrer & relancer la recherche
          </Button>
        </div>
      </div>
    </div>
  );
}
