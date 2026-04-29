"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";
import {
  type QuickStartFormData,
  PENDING_PROJECT_STORAGE_KEY,
} from "@/components/quick-start-form";

/**
 * Typeform-style step-by-step quick-start.
 *
 * One question per screen, animated transitions, Enter advances. The
 * resulting payload is the same QuickStartFormData shape consumed by the
 * existing signup hand-off — so the funnel after this component (signup,
 * project creation, AI cleanup, matching) is unchanged.
 */

const BENEFICIARY_OPTIONS = [
  "Jeunes",
  "Seniors",
  "Femmes",
  "Migrants",
  "Personnes handicapées",
  "Familles",
  "Tout public",
  "Autre",
];

const TERRITORY_OPTIONS = [
  "Local",
  "Régional",
  "National",
  "Européen",
  "International",
];

const FRENCH_REGIONS = [
  "Auvergne-Rhône-Alpes",
  "Bourgogne-Franche-Comté",
  "Bretagne",
  "Centre-Val de Loire",
  "Corse",
  "Grand Est",
  "Hauts-de-France",
  "Île-de-France",
  "Normandie",
  "Nouvelle-Aquitaine",
  "Occitanie",
  "Pays de la Loire",
  "Provence-Alpes-Côte d'Azur",
  "Guadeloupe",
  "Guyane",
  "Martinique",
  "Mayotte",
  "La Réunion",
];

// "Local" or "Régional" → show the regions list. National-only and above
// don't need a region pin since the grants apply across the whole country.
function needsRegions(scales: string[]) {
  return scales.includes("Local") || scales.includes("Régional");
}

const BUDGET_OPTIONS = [
  { label: "< 10 k€", value: "5000" },
  { label: "10–50 k€", value: "30000" },
  { label: "50–200 k€", value: "100000" },
  { label: "200 k€ – 1 M€", value: "500000" },
  { label: "> 1 M€", value: "1500000" },
];

const STRUCTURE_OPTIONS = [
  "Association",
  "Collectivité",
  "Entreprise ESS",
  "Porteur de projet",
  "Autre",
];

type Answers = {
  name: string;
  description: string;
  beneficiaries: string[];
  territories: string[];
  regions: string[];
  territoryDetail: string;
  budget: string;
  structure: string;
};

const TOTAL_STEPS = 6;

export type TypeformQuickStartProps = {
  onSubmit: (data: QuickStartFormData) => Promise<void> | void;
};

export function TypeformQuickStart({ onSubmit }: TypeformQuickStartProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [animating, setAnimating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [answers, setAnswers] = useState<Answers>({
    name: "",
    description: "",
    beneficiaries: [],
    territories: [],
    regions: [],
    territoryDetail: "",
    budget: "",
    structure: "",
  });

  const focusRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    // Auto-focus the primary input of the new step. setTimeout lets the
    // slide-in transition mount the element before we focus it.
    const t = setTimeout(() => focusRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [step]);

  const canAdvance = useMemo(() => {
    switch (step) {
      case 0:
        return answers.name.trim().length > 0;
      case 1:
        return answers.description.trim().length >= 20;
      case 2:
        return answers.beneficiaries.length > 0;
      case 3:
        // If they picked Local/Régional, require at least one region so the
        // matcher actually has a territory to filter on.
        if (needsRegions(answers.territories)) {
          return answers.territories.length > 0 && answers.regions.length > 0;
        }
        return answers.territories.length > 0;
      case 4:
        return answers.budget.length > 0;
      case 5:
        return answers.structure.length > 0;
      default:
        return false;
    }
  }, [step, answers]);

  const goNext = () => {
    if (!canAdvance || animating) return;
    setError(null);
    if (step === TOTAL_STEPS - 1) {
      handleSubmit();
      return;
    }
    setDirection(1);
    setAnimating(true);
    setTimeout(() => {
      setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
      setAnimating(false);
    }, 220);
  };

  const goBack = () => {
    if (step === 0 || animating) return;
    setDirection(-1);
    setAnimating(true);
    setTimeout(() => {
      setStep((s) => Math.max(s - 1, 0));
      setAnimating(false);
    }, 220);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    const territoryThemes = answers.territories.map((t) => {
      // Map the typeform's territory options onto the geography taxonomy
      // used throughout the rest of the app.
      switch (t) {
        case "Local":
          return "Local / Territorial";
        case "Régional":
          return "Local / Territorial";
        case "National":
          return "National (France)";
        case "Européen":
          return "Europe";
        case "International":
          return "International";
        default:
          return t;
      }
    });

    const geography = Array.from(new Set(territoryThemes));
    // Include each picked French region as its own geography tag so regional
    // grants can match by name (the matcher does substring lookup against
    // grant titles/funders).
    for (const region of answers.regions) {
      if (!geography.includes(region)) geography.push(region);
    }
    if (answers.territoryDetail.trim()) {
      geography.push(answers.territoryDetail.trim());
    }

    const payload: QuickStartFormData = {
      name: answers.name.trim(),
      description: answers.description.trim(),
      beneficiaries: answers.beneficiaries.join(", "),
      themes: [],
      geography,
      budget: answers.budget,
      durationMonths: "",
    };

    try {
      try {
        localStorage.setItem(
          PENDING_PROJECT_STORAGE_KEY,
          JSON.stringify({
            ...payload,
            structure: answers.structure,
            savedAt: Date.now(),
          })
        );
      } catch {
        // localStorage unavailable — degrade to plain signup.
      }
      await onSubmit(payload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
      setSubmitting(false);
    }
  };

  const onKeyEnter = (e: React.KeyboardEvent) => {
    // Plain Enter advances; Shift+Enter inserts a newline (only matters for
    // the textarea step, but the guard is safe everywhere).
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      goNext();
    }
  };

  const toggleArr = (
    key: "beneficiaries" | "territories" | "regions",
    val: string
  ) =>
    setAnswers((a) => {
      const next = a[key].includes(val)
        ? a[key].filter((x) => x !== val)
        : [...a[key], val];
      // Dropping Local/Régional should clear the region picker — otherwise
      // stale regions would silently end up in the payload.
      if (key === "territories" && !needsRegions(next)) {
        return { ...a, territories: next, regions: [] };
      }
      return { ...a, [key]: next };
    });

  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  const slideClass = animating
    ? direction === 1
      ? "opacity-0 translate-x-6"
      : "opacity-0 -translate-x-6"
    : "opacity-100 translate-x-0";

  return (
    <div className="rounded-2xl border-2 border-border bg-card p-6 shadow-[6px_6px_0px_0px_#1a1a1a] md:p-10">
      {/* Progress bar */}
      <div className="mb-6 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full border-2 border-border bg-background">
          <div
            className="h-full bg-[#c8f76f] transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs font-black tabular-nums text-muted-foreground">
          {step + 1} / {TOTAL_STEPS}
        </span>
      </div>

      <div
        key={step}
        className={`transition-all duration-200 ease-out ${slideClass}`}
      >
        {step === 0 && (
          <Step
            title="Comment s'appelle votre projet ?"
            hint="Un nom court qui le résume — vous pourrez l'affiner plus tard."
          >
            <Input
              ref={focusRef as React.RefObject<HTMLInputElement>}
              placeholder="Ex: Inclusion numérique des seniors en Occitanie"
              value={answers.name}
              onChange={(e) =>
                setAnswers((a) => ({ ...a, name: e.target.value }))
              }
              onKeyDown={onKeyEnter}
              className="h-14 text-lg"
              disabled={submitting}
            />
          </Step>
        )}

        {step === 1 && (
          <Step
            title="Décrivez votre projet en quelques phrases"
            hint="Ce que vous faites concrètement, pour qui, où. C'est ce que l'IA va matcher."
          >
            <textarea
              ref={focusRef as React.RefObject<HTMLTextAreaElement>}
              className="flex min-h-[180px] w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-base font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
              placeholder="Ex: Nous organisons des ateliers hebdomadaires d'initiation au numérique dans 15 communes rurales d'Occitanie, avec un accompagnement individuel pour les plus isolés."
              value={answers.description}
              onChange={(e) =>
                setAnswers((a) => ({ ...a, description: e.target.value }))
              }
              onKeyDown={onKeyEnter}
              spellCheck
              lang="fr"
              disabled={submitting}
            />
            <p className="mt-2 text-xs font-medium text-muted-foreground">
              {answers.description.trim().length < 20
                ? `Au moins 20 caractères (${answers.description.trim().length}/20)`
                : `${answers.description.length} caractères`}
              {" · Maj+Entrée pour aller à la ligne"}
            </p>
          </Step>
        )}

        {step === 2 && (
          <Step
            title="Qui sont les bénéficiaires ?"
            hint="Sélectionnez tous les publics concernés."
          >
            <ChipGroup
              options={BENEFICIARY_OPTIONS}
              selected={answers.beneficiaries}
              onToggle={(v) => toggleArr("beneficiaries", v)}
              disabled={submitting}
              accent="bg-[#ffa3d1]"
            />
          </Step>
        )}

        {step === 3 && (
          <Step
            title="Quel est votre territoire d'action ?"
            hint="Plusieurs choix possibles."
          >
            <ChipGroup
              options={TERRITORY_OPTIONS}
              selected={answers.territories}
              onToggle={(v) => toggleArr("territories", v)}
              disabled={submitting}
              accent="bg-[#ffe066]"
            />

            {needsRegions(answers.territories) && (
              <div className="mt-6 rounded-xl border-2 border-border bg-background p-4">
                <p className="mb-3 text-sm font-bold text-foreground">
                  Quelle(s) région(s) ?
                </p>
                <p className="mb-3 text-xs font-medium text-muted-foreground">
                  Cela aiguise le matching sur les dispositifs régionaux.
                </p>
                <ChipGroup
                  options={FRENCH_REGIONS}
                  selected={answers.regions}
                  onToggle={(v) => toggleArr("regions", v)}
                  disabled={submitting}
                  accent="bg-[#a3d5ff]"
                />
              </div>
            )}

            <Input
              ref={focusRef as React.RefObject<HTMLInputElement>}
              placeholder={
                answers.territories.includes("International") ||
                answers.territories.includes("Européen")
                  ? "Pays spécifique (optionnel)"
                  : "Précision territoriale (optionnel)"
              }
              value={answers.territoryDetail}
              onChange={(e) =>
                setAnswers((a) => ({ ...a, territoryDetail: e.target.value }))
              }
              onKeyDown={onKeyEnter}
              className="mt-4 h-12"
              disabled={submitting}
            />
          </Step>
        )}

        {step === 4 && (
          <Step
            title="Quel budget recherchez-vous ?"
            hint="Une fourchette nous suffit pour ranger les opportunités."
          >
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {BUDGET_OPTIONS.map((b) => (
                <button
                  key={b.value}
                  type="button"
                  onClick={() => {
                    setAnswers((a) => ({ ...a, budget: b.value }));
                  }}
                  disabled={submitting}
                  className={`rounded-xl border-2 border-border px-4 py-4 text-center text-base font-black transition-all ${
                    answers.budget === b.value
                      ? "bg-[#a3d5ff] shadow-[3px_3px_0px_0px_#1a1a1a] -translate-x-px -translate-y-px"
                      : "bg-background hover:bg-card"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </Step>
        )}

        {step === 5 && (
          <Step
            title="Quel type de structure êtes-vous ?"
            hint="Un seul choix."
          >
            <div className="grid gap-3 md:grid-cols-2">
              {STRUCTURE_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setAnswers((a) => ({ ...a, structure: s }))}
                  disabled={submitting}
                  className={`rounded-xl border-2 border-border px-4 py-4 text-left text-base font-black transition-all ${
                    answers.structure === s
                      ? "bg-[#c8f76f] shadow-[3px_3px_0px_0px_#1a1a1a] -translate-x-px -translate-y-px"
                      : "bg-background hover:bg-card"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </Step>
        )}
      </div>

      {error && (
        <div className="mt-6 rounded-xl border-2 border-red-400 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <div className="mt-8 flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          onClick={goBack}
          disabled={step === 0 || submitting}
          className={step === 0 ? "invisible" : ""}
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>

        <Button
          variant="accent"
          onClick={goNext}
          disabled={!canAdvance || submitting}
          size="lg"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Préparation...
            </>
          ) : step === TOTAL_STEPS - 1 ? (
            <>
              <Sparkles className="h-4 w-4" />
              Trouver mes subventions
              <ArrowRight className="h-4 w-4" />
            </>
          ) : (
            <>
              Suivant
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      <p className="mt-4 text-center text-xs font-medium text-muted-foreground">
        Appuyez sur <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono">Entrée</kbd> pour avancer
      </p>
    </div>
  );
}

function Step({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-2xl font-black leading-tight text-foreground md:text-3xl">
        {title}
      </h3>
      {hint && (
        <p className="mt-2 text-sm font-medium text-muted-foreground md:text-base">
          {hint}
        </p>
      )}
      <div className="mt-6">{children}</div>
    </div>
  );
}

function ChipGroup({
  options,
  selected,
  onToggle,
  disabled,
  accent,
}: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  disabled?: boolean;
  accent: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const on = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            disabled={disabled}
            className={`rounded-xl border-2 border-border px-4 py-2 text-sm font-bold transition-all ${
              on
                ? `${accent} shadow-[3px_3px_0px_0px_#1a1a1a] -translate-x-px -translate-y-px`
                : "bg-background hover:bg-card"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
