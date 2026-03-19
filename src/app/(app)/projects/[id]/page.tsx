import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calendar,
  Euro,
  ExternalLink,
  FileText,
  Sparkles,
  ChevronRight,
  Clock,
  Edit,
} from "lucide-react";
import Link from "next/link";

// Placeholder data — will come from DB + AI matching
const PROJECT = {
  id: "proj-1",
  name: "Aide humanitaire Ukraine",
  summary:
    "Programme d'accompagnement social et d'insertion professionnelle pour les familles ukrainiennes déplacées en Île-de-France.",
  themes: ["Humanitaire", "Migration", "Inclusion"],
  geography: ["National (France)", "Europe"],
  budget: 150000,
  duration: 24,
};

const MATCHING_GRANTS = [
  {
    id: "1",
    title: "Appel à projets — Solidarité internationale et aide humanitaire",
    funder: "Agence Française de Développement",
    sourceName: "Aides-Territoires",
    country: "FR",
    deadline: "2026-05-15",
    maxAmountEur: 200000,
    themes: ["Humanitaire", "Solidarité"],
    score: 87,
    scoreLevel: "high" as const,
    difficulty: "medium" as const,
    summary:
      "Financement de projets d'aide humanitaire portés par des ONG françaises dans les pays en développement.",
    strengths: ["Thématique alignée", "Budget compatible", "Éligibilité confirmée"],
    risks: ["Cofinancement requis (20%)"],
  },
  {
    id: "2",
    title: "CERV — Citizens, Equality, Rights and Values Programme",
    funder: "Commission Européenne",
    sourceName: "EU Funding & Tenders",
    country: "EU",
    deadline: "2026-06-30",
    maxAmountEur: 500000,
    themes: ["Droits", "Citoyenneté", "Égalité"],
    score: 72,
    scoreLevel: "medium" as const,
    difficulty: "hard" as const,
    summary:
      "Programme européen soutenant les organisations de la société civile actives dans la protection des droits et valeurs de l'UE.",
    strengths: ["Éligibilité géographique", "Thématique partielle"],
    risks: ["Compétition forte", "Consortium recommandé"],
  },
  {
    id: "3",
    title: "Fonds pour le développement de la vie associative (FDVA)",
    funder: "Ministère de l'Éducation nationale",
    sourceName: "FDVA",
    country: "FR",
    deadline: "2026-04-20",
    maxAmountEur: 30000,
    themes: ["Vie associative", "Formation"],
    score: 58,
    scoreLevel: "low" as const,
    difficulty: "easy" as const,
    summary:
      "Soutien aux associations pour la formation de bénévoles et le fonctionnement innovant.",
    strengths: ["Procédure simplifiée"],
    risks: ["Montant limité", "Thématique partielle"],
  },
  {
    id: "4",
    title: "Programme d'aide aux réfugiés — Fondation de France",
    funder: "Fondation de France",
    sourceName: "Fondation de France",
    country: "FR",
    deadline: "2026-07-15",
    maxAmountEur: 80000,
    themes: ["Migration", "Insertion"],
    score: 91,
    scoreLevel: "high" as const,
    difficulty: "medium" as const,
    summary:
      "Appui aux projets d'accompagnement et d'intégration des personnes réfugiées sur le territoire français.",
    strengths: ["Alignement parfait", "Pas de cofinancement requis", "Profil éligible"],
    risks: ["Deadline éloignée"],
  },
];

function getScoreColor(level: string) {
  switch (level) {
    case "high":
      return "bg-[#c8f76f]";
    case "medium":
      return "bg-[#ffe066]";
    case "low":
      return "bg-[#ffa3d1]";
    default:
      return "bg-secondary";
  }
}

function getDifficultyBadge(difficulty: string) {
  switch (difficulty) {
    case "easy":
      return { label: "Accessible", color: "green" as const };
    case "medium":
      return { label: "Modéré", color: "yellow" as const };
    case "hard":
      return { label: "Compétitif", color: "pink" as const };
    case "very_hard":
      return { label: "Très compétitif", color: "purple" as const };
    default:
      return { label: "Modéré", color: "yellow" as const };
  }
}

function getGrantTypeBadge(source: string) {
  if (source?.includes("FRUP") || source?.includes("Fondation") || source?.includes("fondation")) {
    return { label: "Privé", color: "purple" as const };
  }
  if (source?.includes("EU") || source?.includes("Commission")) {
    return { label: "EU", color: "blue" as const };
  }
  return { label: "Public", color: "green" as const };
}

function getThemeColor(theme: string): "green" | "yellow" | "pink" | "blue" | "purple" {
  const colors: Record<string, "green" | "yellow" | "pink" | "blue" | "purple"> = {
    Humanitaire: "pink",
    Migration: "yellow",
    Inclusion: "purple",
    Solidarité: "pink",
    Droits: "blue",
    Citoyenneté: "blue",
    Égalité: "purple",
    "Vie associative": "green",
    Formation: "yellow",
    Insertion: "green",
  };
  return colors[theme] || "green";
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function ProjectDetailPage() {
  const sortedGrants = [...MATCHING_GRANTS].sort((a, b) => b.score - a.score);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-start gap-4">
          <Link href="/dashboard">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-4 w-4 rounded-md border-2 border-border bg-[#c8f76f]" />
              <h1 className="text-3xl font-black text-foreground">
                {PROJECT.name}
              </h1>
            </div>
            <p className="text-muted-foreground font-medium max-w-2xl">
              {PROJECT.summary}
            </p>
            <div className="flex items-center gap-2 mt-3">
              {PROJECT.themes.map((t) => (
                <Badge key={t} variant={getThemeColor(t)}>
                  {t}
                </Badge>
              ))}
              <Badge variant="outline">
                {PROJECT.budget?.toLocaleString("fr-FR")} €
              </Badge>
              <Badge variant="outline">{PROJECT.duration} mois</Badge>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4" />
          Modifier
        </Button>
      </div>

      {/* Matching grants */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-black">
          Subventions qui matchent{" "}
          <span className="text-muted-foreground font-bold">
            ({sortedGrants.length})
          </span>
        </h2>
        <div className="flex gap-2">
          <Badge variant="green">
            {sortedGrants.filter((g) => g.scoreLevel === "high").length} top
            matches
          </Badge>
        </div>
      </div>

      {/* Grant cards */}
      <div className="space-y-4">
        {sortedGrants.map((grant) => (
          <div
            key={grant.id}
            className="rounded-2xl border-2 border-border bg-card shadow-[4px_4px_0px_0px_#1a1a1a] transition-all hover:shadow-[6px_6px_0px_0px_#1a1a1a] hover:translate-x-[-1px] hover:translate-y-[-1px]"
          >
            <div className="p-6">
              <div className="flex items-start gap-5">
                {/* Score circle */}
                <div
                  className={`score-badge shrink-0 ${getScoreColor(grant.scoreLevel)}`}
                >
                  {grant.score}
                </div>

                {/* Grant info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant={getGrantTypeBadge(grant.sourceName).color}>
                      {getGrantTypeBadge(grant.sourceName).label}
                    </Badge>
                    <Badge variant={getDifficultyBadge(grant.difficulty).color}>
                      {getDifficultyBadge(grant.difficulty).label}
                    </Badge>
                    <Badge
                      variant={grant.country === "EU" ? "blue" : "yellow"}
                    >
                      {grant.country}
                    </Badge>
                    {grant.themes.map((t) => (
                      <Badge key={t} variant={getThemeColor(t)}>
                        {t}
                      </Badge>
                    ))}
                  </div>

                  <h3 className="text-lg font-black text-foreground mt-1">
                    {grant.title}
                  </h3>
                  <p className="text-sm font-semibold text-muted-foreground">
                    {grant.funder}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1.5">
                    {grant.summary}
                  </p>

                  {/* Strengths / Risks */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {grant.strengths.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center rounded-lg bg-[#c8f76f]/40 border border-[#c8f76f] px-2 py-0.5 text-xs font-bold"
                      >
                        {s}
                      </span>
                    ))}
                    {grant.risks.map((r) => (
                      <span
                        key={r}
                        className="inline-flex items-center rounded-lg bg-[#ffe066]/40 border border-[#ffe066] px-2 py-0.5 text-xs font-bold"
                      >
                        {r}
                      </span>
                    ))}
                  </div>

                  {/* Meta row */}
                  <div className="flex items-center gap-5 mt-4 text-sm font-semibold text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {daysUntil(grant.deadline) > 0
                        ? `${daysUntil(grant.deadline)} jours restants`
                        : "Expiré"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(grant.deadline).toLocaleDateString("fr-FR")}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Euro className="h-3.5 w-3.5" />
                      Jusqu&apos;à{" "}
                      {grant.maxAmountEur.toLocaleString("fr-FR")} €
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 shrink-0">
                  <Button variant="accent" size="sm">
                    <Sparkles className="h-4 w-4" />
                    Créer la proposal
                  </Button>
                  <Button variant="outline" size="sm">
                    Voir plus
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <a
                    href="#"
                    className="flex items-center justify-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Portail officiel
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
