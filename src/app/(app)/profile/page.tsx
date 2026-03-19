"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Building2, Save, Loader2, CheckCircle2, XCircle } from "lucide-react";

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

type FeedbackState = {
  type: "success" | "error";
  message: string;
} | null;

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  // Form fields
  const [name, setName] = useState("");
  const [legalStatus, setLegalStatus] = useState("");
  const [country, setCountry] = useState("FR");
  const [teamSize, setTeamSize] = useState("");
  const [annualBudget, setAnnualBudget] = useState("");
  const [languages, setLanguages] = useState("");
  const [mission, setMission] = useState("");
  const [thematicAreas, setThematicAreas] = useState<string[]>([]);
  const [geographicFocus, setGeographicFocus] = useState<string[]>([]);
  const [priorGrants, setPriorGrants] = useState("");

  // Load organization data on mount
  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error("Erreur lors du chargement");
      const { organization } = await res.json();
      if (organization) {
        setName(organization.name || "");
        setLegalStatus(organization.legal_status || "");
        setCountry(organization.country || "FR");
        setTeamSize(organization.team_size?.toString() || "");
        setAnnualBudget(organization.annual_budget_eur?.toString() || "");
        setLanguages(
          Array.isArray(organization.languages)
            ? organization.languages.join(", ")
            : organization.languages || ""
        );
        setMission(organization.mission || "");
        setThematicAreas(organization.thematic_areas || []);
        setGeographicFocus(organization.geographic_focus || []);
        setPriorGrants(organization.prior_grants || "");
      }
    } catch {
      setFeedback({
        type: "error",
        message: "Impossible de charger votre profil",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Auto-dismiss feedback after 4 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

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

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);

    try {
      // Parse languages string into array
      const languagesArray = languages
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean);

      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          legal_status: legalStatus,
          country,
          team_size: teamSize || null,
          annual_budget_eur: annualBudget || null,
          languages: languagesArray.length > 0 ? languagesArray : null,
          mission,
          thematic_areas: thematicAreas,
          geographic_focus: geographicFocus,
          prior_grants: priorGrants || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la sauvegarde");
      }

      setFeedback({
        type: "success",
        message: "Profil enregistré avec succès",
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message:
          err instanceof Error ? err.message : "Erreur lors de la sauvegarde",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Mon organisation
          </h1>
          <p className="text-muted-foreground">
            Ces informations sont utilisées pour calculer votre GrantScore
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`mt-4 flex items-center gap-2 rounded-md border-2 px-4 py-3 text-sm font-medium ${
            feedback.type === "success"
              ? "border-green-600 bg-green-50 text-green-800"
              : "border-red-600 bg-red-50 text-red-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          {feedback.message}
        </div>
      )}

      <div className="mt-8 space-y-6">
        {/* Basic info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Informations générales
            </CardTitle>
            <CardDescription>
              Les informations de base de votre organisation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">
                  Nom de l&apos;organisation *
                </label>
                <Input
                  placeholder="Ex: Association Solidarité France"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Statut juridique</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={legalStatus}
                  onChange={(e) => setLegalStatus(e.target.value)}
                >
                  <option value="">Sélectionner...</option>
                  <option value="association">Association loi 1901</option>
                  <option value="fondation">Fondation</option>
                  <option value="ong">ONG</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Pays</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                >
                  <option value="FR">France</option>
                  <option value="DE">Allemagne</option>
                  <option value="BE">Belgique</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">
                  Taille de l&apos;équipe
                </label>
                <Input
                  type="number"
                  placeholder="Ex: 12"
                  value={teamSize}
                  onChange={(e) => setTeamSize(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Budget annuel (&euro;)
                </label>
                <Input
                  type="number"
                  placeholder="Ex: 500000"
                  value={annualBudget}
                  onChange={(e) => setAnnualBudget(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Langues parlées</label>
                <Input
                  placeholder="Ex: Français, Anglais"
                  value={languages}
                  onChange={(e) => setLanguages(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Mission *</label>
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground"
                placeholder="Décrivez la mission principale de votre organisation en 2-3 phrases..."
                value={mission}
                onChange={(e) => setMission(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Thematic areas */}
        <Card>
          <CardHeader>
            <CardTitle>Thématiques</CardTitle>
            <CardDescription>
              Sélectionnez les domaines d&apos;intervention de votre
              organisation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {THEMATIC_OPTIONS.map((theme) => (
                <button
                  key={theme}
                  type="button"
                  onClick={() => toggleThematic(theme)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    thematicAreas.includes(theme)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-primary hover:text-primary-foreground"
                  }`}
                >
                  {theme}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Geographic focus */}
        <Card>
          <CardHeader>
            <CardTitle>Zones géographiques</CardTitle>
            <CardDescription>
              Où votre organisation intervient-elle ?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {GEO_OPTIONS.map((geo) => (
                <button
                  key={geo}
                  type="button"
                  onClick={() => toggleGeo(geo)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    geographicFocus.includes(geo)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-primary hover:text-primary-foreground"
                  }`}
                >
                  {geo}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Prior grants */}
        <Card>
          <CardHeader>
            <CardTitle>Expérience de financement</CardTitle>
            <CardDescription>
              Décrivez vos expériences passées avec les subventions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground"
              placeholder="Ex: Bénéficiaire FDVA 2024, partenaire projet Erasmus+ 2023, subvention AFD 2022..."
              value={priorGrants}
              onChange={(e) => setPriorGrants(e.target.value)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
