"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Building2,
  Target,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  Check,
} from "lucide-react";

const STEPS = [
  { icon: Building2, title: "Votre organisation", color: "bg-[#c8f76f]" },
  { icon: Target, title: "Thématiques", color: "bg-[#ffe066]" },
  { icon: MapPin, title: "Géographie & lancement", color: "bg-[#d4b5ff]" },
];

const THEMATIC_OPTIONS = [
  "Humanitaire",
  "Éducation",
  "Jeunesse",
  "Inclusion",
  "Culture",
  "Santé",
  "Environnement",
  "Droits humains",
  "Migration",
  "Développement",
  "Égalité",
  "Numérique",
  "Agriculture",
  "Sport",
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

const LEGAL_STATUSES = [
  { value: "association", label: "Association loi 1901" },
  { value: "fondation", label: "Fondation" },
  { value: "ong", label: "ONG" },
  { value: "collectivite", label: "Collectivité" },
  { value: "entreprise_sociale", label: "Entreprise sociale / ESS" },
  { value: "other", label: "Autre" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1: Organisation
  const [name, setName] = useState("");
  const [legalStatus, setLegalStatus] = useState("");
  const [mission, setMission] = useState("");
  const [teamSize, setTeamSize] = useState("");

  // Step 2: Thématiques
  const [thematicAreas, setThematicAreas] = useState<string[]>([]);

  // Step 3: Géographie
  const [geographicFocus, setGeographicFocus] = useState<string[]>([]);

  const toggleThematic = (theme: string) => {
    setThematicAreas((prev) =>
      prev.includes(theme) ? prev.filter((t) => t !== theme) : [...prev, theme]
    );
  };

  const toggleGeo = (geo: string) => {
    setGeographicFocus((prev) =>
      prev.includes(geo) ? prev.filter((g) => g !== geo) : [...prev, geo]
    );
  };

  const canProceed = () => {
    if (step === 0) return name.trim().length > 0 && mission.trim().length > 0;
    if (step === 1) return thematicAreas.length > 0;
    if (step === 2) return geographicFocus.length > 0;
    return false;
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          legal_status: legalStatus || null,
          country: "FR",
          team_size: teamSize ? parseInt(teamSize) : null,
          mission,
          thematic_areas: thematicAreas,
          geographic_focus: geographicFocus,
        }),
      });

      if (!res.ok) throw new Error("Erreur");
      // first=1 lets the dashboard show a welcome banner for new users.
      router.push("/dashboard?first=1");
      router.refresh();
    } catch {
      setSaving(false);
    }
  };

  // "Passer pour le moment" used to redirect to /dashboard which would trigger
  // the (app)/layout check (no org → /onboarding) and trap the user. Create a
  // minimal org stub so they can at least reach the dashboard, and mark the
  // session as skipped so we can show the configuration reminder there.
  const handleSkip = async () => {
    setSaving(true);
    try {
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || "Mon organisation",
          country: "FR",
          mission: mission || null,
          thematic_areas: thematicAreas.length ? thematicAreas : null,
          geographic_focus: geographicFocus.length ? geographicFocus : null,
        }),
      });
    } catch {
      // Non-fatal — even if profile POST fails, we still try the dashboard.
    }
    router.push("/dashboard?first=1&skipped=1");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black">
            Emile
            <span className="text-[#c8f76f] bg-foreground px-2 py-0.5 rounded-lg ml-1 text-2xl">
              .
            </span>
          </h1>
          <p className="mt-2 text-muted-foreground font-medium">
            Configurons votre espace en 2 minutes
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 border-border transition-all ${
                  i <= step
                    ? `${s.color} shadow-[3px_3px_0px_0px_#1a1a1a]`
                    : "bg-secondary"
                }`}
              >
                {i < step ? (
                  <Check className="h-5 w-5" strokeWidth={3} />
                ) : (
                  <s.icon className="h-5 w-5" />
                )}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-0.5 w-8 rounded ${
                    i < step ? "bg-foreground" : "bg-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="rounded-2xl border-2 border-border bg-card p-8 shadow-[6px_6px_0px_0px_#1a1a1a]">
          <h2 className="text-2xl font-black">{STEPS[step].title}</h2>

          {/* Step 1: Organisation */}
          {step === 0 && (
            <div className="mt-6 space-y-5">
              <p className="text-muted-foreground font-medium">
                Parlez-nous de votre structure pour personnaliser vos
                recommandations.
              </p>
              <div>
                <label className="text-sm font-bold">
                  Nom de l&apos;organisation *
                </label>
                <Input
                  placeholder="Ex: Association Solidarité France"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-bold">Statut juridique</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {LEGAL_STATUSES.map((ls) => (
                    <button
                      key={ls.value}
                      type="button"
                      onClick={() => setLegalStatus(ls.value)}
                      className={`rounded-xl border-2 px-4 py-2.5 text-sm font-bold text-left transition-all ${
                        legalStatus === ls.value
                          ? "border-foreground bg-[#c8f76f] shadow-[3px_3px_0px_0px_#1a1a1a]"
                          : "border-border hover:border-foreground"
                      }`}
                    >
                      {ls.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-bold">
                  Mission de votre organisation *
                </label>
                <textarea
                  className="mt-1 flex min-h-[100px] w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
                  placeholder="Décrivez en 2-3 phrases ce que fait votre organisation..."
                  value={mission}
                  onChange={(e) => setMission(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-bold">
                  Taille de l&apos;équipe
                </label>
                <Input
                  type="number"
                  placeholder="Ex: 12"
                  value={teamSize}
                  onChange={(e) => setTeamSize(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {/* Step 2: Thématiques */}
          {step === 1 && (
            <div className="mt-6 space-y-5">
              <p className="text-muted-foreground font-medium">
                Sélectionnez vos domaines d&apos;intervention pour que notre IA
                trouve les subventions les plus pertinentes.
              </p>
              <div className="flex flex-wrap gap-2">
                {THEMATIC_OPTIONS.map((theme) => (
                  <button
                    key={theme}
                    type="button"
                    onClick={() => toggleThematic(theme)}
                    className={`rounded-xl border-2 px-4 py-2.5 text-sm font-bold transition-all ${
                      thematicAreas.includes(theme)
                        ? "border-foreground bg-[#ffe066] shadow-[3px_3px_0px_0px_#1a1a1a]"
                        : "border-border hover:border-foreground"
                    }`}
                  >
                    {theme}
                  </button>
                ))}
              </div>
              {thematicAreas.length > 0 && (
                <p className="text-sm font-bold text-muted-foreground">
                  {thematicAreas.length} thématique
                  {thematicAreas.length > 1 ? "s" : ""} sélectionnée
                  {thematicAreas.length > 1 ? "s" : ""}
                </p>
              )}
            </div>
          )}

          {/* Step 3: Géographie & finish */}
          {step === 2 && (
            <div className="mt-6 space-y-5">
              <p className="text-muted-foreground font-medium">
                Où votre organisation intervient-elle ? Cela nous permet de filtrer les
                subventions territoriales pertinentes.
              </p>
              <div className="flex flex-wrap gap-2">
                {GEO_OPTIONS.map((geo) => (
                  <button
                    key={geo}
                    type="button"
                    onClick={() => toggleGeo(geo)}
                    className={`rounded-xl border-2 px-4 py-2.5 text-sm font-bold transition-all ${
                      geographicFocus.includes(geo)
                        ? "border-foreground bg-[#d4b5ff] shadow-[3px_3px_0px_0px_#1a1a1a]"
                        : "border-border hover:border-foreground"
                    }`}
                  >
                    {geo}
                  </button>
                ))}
              </div>

              {/* Ready banner */}
              {geographicFocus.length > 0 && (
                <div className="rounded-xl border-2 border-border bg-[#c8f76f] p-4 shadow-[3px_3px_0px_0px_#1a1a1a]">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5" />
                    <div>
                      <p className="font-black">Tout est prêt !</p>
                      <p className="text-sm font-medium">
                        Notre IA va analyser {">"}2 000 subventions pour trouver
                        celles qui matchent avec {name || "votre organisation"}.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            {step > 0 ? (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Button>
            ) : (
              <div />
            )}

            {step < 2 ? (
              <Button
                variant="accent"
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
              >
                Continuer
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="accent"
                onClick={handleFinish}
                disabled={!canProceed() || saving}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {saving ? "Configuration..." : "Lancer Emile"}
              </Button>
            )}
          </div>
        </div>

        {/* Skip link */}
        <div className="text-center mt-4">
          <button
            onClick={handleSkip}
            disabled={saving}
            className="text-sm text-muted-foreground font-medium hover:text-foreground transition-colors disabled:opacity-50"
          >
            Passer pour le moment →
          </button>
        </div>
      </div>
    </div>
  );
}
