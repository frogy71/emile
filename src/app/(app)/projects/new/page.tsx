"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Target, Users, MapPin, BarChart3, Lightbulb, CheckCircle } from "lucide-react";
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

export default function NewProjectPage() {
  const [step, setStep] = useState(1);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [selectedGeo, setSelectedGeo] = useState<string[]>([]);

  const toggleTheme = (theme: string) => {
    setSelectedThemes((prev) =>
      prev.includes(theme) ? prev.filter((t) => t !== theme) : [...prev, theme]
    );
  };

  const toggleGeo = (geo: string) => {
    setSelectedGeo((prev) =>
      prev.includes(geo) ? prev.filter((g) => g !== geo) : [...prev, geo]
    );
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
                <Input placeholder="Ex: Programme d'aide aux réfugiés ukrainiens" />
              </div>

              <div>
                <label className="text-sm font-bold mb-1.5 block">
                  Résumé du projet *
                </label>
                <textarea
                  className="flex min-h-[100px] w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Décrivez votre projet en 2-3 phrases..."
                />
              </div>

              <div>
                <label className="text-sm font-bold mb-1.5 block">
                  Problème identifié *
                </label>
                <textarea
                  className="flex min-h-[100px] w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Quel problème votre projet cherche-t-il à résoudre ? Quelles sont les causes ?"
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
                        selectedThemes.includes(theme.label)
                          ? "shadow-[3px_3px_0px_0px_#1a1a1a] translate-x-[-1px] translate-y-[-1px]"
                          : ""
                      }`}
                      style={{
                        backgroundColor: selectedThemes.includes(theme.label)
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
                        selectedGeo.includes(geo)
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
                  <Input type="number" placeholder="Ex: 150000" />
                </div>
                <div>
                  <label className="text-sm font-bold mb-1.5 block">
                    Durée (mois)
                  </label>
                  <Input type="number" placeholder="Ex: 24" />
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
                />
              </div>

              <div>
                <label className="text-sm font-bold mb-1.5 block">
                  Objectif spécifique 1 *
                </label>
                <Input placeholder="Ex: Améliorer l'accès aux soins pour 500 familles déplacées" />
              </div>

              <div>
                <label className="text-sm font-bold mb-1.5 block">
                  Objectif spécifique 2
                </label>
                <Input placeholder="Ex: Former 50 travailleurs sociaux locaux" />
              </div>

              <div>
                <label className="text-sm font-bold mb-1.5 block">
                  Objectif spécifique 3
                </label>
                <Input placeholder="Optionnel" />
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
                />
              </div>

              <div>
                <label className="text-sm font-bold mb-1.5 block">
                  Nombre estimé de bénéficiaires directs
                </label>
                <Input type="number" placeholder="Ex: 2000" />
              </div>

              <div>
                <label className="text-sm font-bold mb-1.5 block">
                  Bénéficiaires indirects
                </label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Ex: Communautés d'accueil, services sociaux locaux..."
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
                />
              </div>

              <div>
                <label className="text-sm font-bold mb-1.5 block">
                  Partenaires
                </label>
                <textarea
                  className="flex min-h-[60px] w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Quels partenaires seront impliqués ? (ONG, institutions, collectivités...)"
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
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(4)}>
              <ArrowLeft className="h-4 w-4" />
              Activités
            </Button>
            <Button variant="accent">
              <CheckCircle className="h-4 w-4" />
              Créer le projet & trouver des subventions
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
