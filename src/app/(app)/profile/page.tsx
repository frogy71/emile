"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building2, Save } from "lucide-react";

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

export default function ProfilePage() {
  const [saving, setSaving] = useState(false);

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
        <Button disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>

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
                <Input placeholder="Ex: Association Solidarité France" />
              </div>
              <div>
                <label className="text-sm font-medium">Statut juridique</label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Sélectionner...</option>
                  <option value="association">Association loi 1901</option>
                  <option value="fondation">Fondation</option>
                  <option value="ong">ONG</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Pays</label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="FR">France</option>
                  <option value="DE">Allemagne</option>
                  <option value="BE">Belgique</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Taille de l&apos;équipe</label>
                <Input type="number" placeholder="Ex: 12" />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Budget annuel (€)
                </label>
                <Input type="number" placeholder="Ex: 500000" />
              </div>
              <div>
                <label className="text-sm font-medium">Langues parlées</label>
                <Input placeholder="Ex: Français, Anglais" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Mission *</label>
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground"
                placeholder="Décrivez la mission principale de votre organisation en 2-3 phrases..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Thematic areas */}
        <Card>
          <CardHeader>
            <CardTitle>Thématiques</CardTitle>
            <CardDescription>
              Sélectionnez les domaines d&apos;intervention de votre organisation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {THEMATIC_OPTIONS.map((theme) => (
                <button
                  key={theme}
                  className="rounded-full border border-border px-3 py-1.5 text-sm transition-colors hover:bg-primary hover:text-primary-foreground"
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
                  className="rounded-full border border-border px-3 py-1.5 text-sm transition-colors hover:bg-primary hover:text-primary-foreground"
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
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
