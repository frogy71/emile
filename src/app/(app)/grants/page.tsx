"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search,
  Calendar,
  Euro,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Loader2,
} from "lucide-react";

type Grant = {
  id: string;
  title: string;
  funder: string;
  source_name: string;
  country: string;
  deadline: string | null;
  max_amount_eur: number | null;
  thematic_areas: string[] | null;
  summary: string | null;
  source_url: string | null;
  status: string;
};

const TYPES = [
  { value: "", label: "Tous" },
  { value: "public", label: "Public" },
  { value: "private", label: "Privé / Fondations" },
  { value: "eu", label: "Union Européenne" },
];

const THEMES = [
  "Humanitaire",
  "Éducation",
  "Jeunesse",
  "Environnement",
  "Culture",
  "Santé",
  "Inclusion",
  "Migration",
  "Droits",
  "Numérique",
  "Agriculture",
  "Sport",
];

const TERRITORIES = [
  "Île-de-France",
  "Auvergne-Rhône-Alpes",
  "Nouvelle-Aquitaine",
  "Occitanie",
  "Provence-Alpes-Côte d'Azur",
  "Bretagne",
  "Hauts-de-France",
  "Grand Est",
  "Pays de la Loire",
  "Normandie",
  "Bourgogne-Franche-Comté",
  "Centre-Val de Loire",
  "Corse",
  "Outre-mer",
];

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getTypeBadge(source: string) {
  if (
    source?.includes("FRUP") ||
    source?.includes("Fondation") ||
    source?.includes("fondation")
  ) {
    return { label: "Privé", variant: "purple" as const };
  }
  if (source?.includes("EU") || source?.includes("Commission")) {
    return { label: "EU", variant: "blue" as const };
  }
  return { label: "Public", variant: "green" as const };
}

export default function GrantsPage() {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [theme, setTheme] = useState("");
  const [territory, setTerritory] = useState("");
  const [page, setPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const limit = 20;

  const fetchGrants = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (type) params.set("type", type);
    if (theme) params.set("theme", theme);
    if (territory) params.set("territory", territory);
    params.set("limit", String(limit));
    params.set("offset", String(page * limit));

    try {
      const res = await fetch(`/api/grants?${params.toString()}`);
      const data = await res.json();
      setGrants(data.grants || []);
      setTotal(data.total || 0);
    } catch {
      setGrants([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [search, type, theme, territory, page]);

  useEffect(() => {
    fetchGrants();
  }, [fetchGrants]);

  const totalPages = Math.ceil(total / limit);

  const clearFilters = () => {
    setSearch("");
    setType("");
    setTheme("");
    setTerritory("");
    setPage(0);
  };

  const hasFilters = search || type || theme || territory;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black text-foreground">Subventions</h1>
          <p className="text-muted-foreground font-medium">
            {total} subventions disponibles
          </p>
        </div>
      </div>

      {/* Search + Filter toggle */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par titre, bailleur, résumé..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="pl-10"
          />
        </div>
        <Button
          variant={showFilters ? "accent" : "outline"}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4" />
          Filtres
          {hasFilters && (
            <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background text-xs font-black">
              {[type, theme, territory].filter(Boolean).length}
            </span>
          )}
        </Button>
        {hasFilters && (
          <Button variant="ghost" onClick={clearFilters}>
            <X className="h-4 w-4" />
            Reset
          </Button>
        )}
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="rounded-2xl border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_#1a1a1a] mb-6">
          <div className="grid gap-5 md:grid-cols-3">
            {/* Type */}
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-2 block">
                Type
              </label>
              <div className="flex flex-wrap gap-1.5">
                {TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => {
                      setType(t.value);
                      setPage(0);
                    }}
                    className={`rounded-lg border-2 border-border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      type === t.value
                        ? "bg-[#c8f76f] shadow-[2px_2px_0px_0px_#1a1a1a]"
                        : "bg-card hover:bg-secondary"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme */}
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-2 block">
                Thématique
              </label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => {
                    setTheme("");
                    setPage(0);
                  }}
                  className={`rounded-lg border-2 border-border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    theme === ""
                      ? "bg-[#ffe066] shadow-[2px_2px_0px_0px_#1a1a1a]"
                      : "bg-card hover:bg-secondary"
                  }`}
                >
                  Toutes
                </button>
                {THEMES.map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTheme(t);
                      setPage(0);
                    }}
                    className={`rounded-lg border-2 border-border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      theme === t
                        ? "bg-[#ffe066] shadow-[2px_2px_0px_0px_#1a1a1a]"
                        : "bg-card hover:bg-secondary"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Territory */}
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-2 block">
                Territoire
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                <button
                  onClick={() => {
                    setTerritory("");
                    setPage(0);
                  }}
                  className={`rounded-lg border-2 border-border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    territory === ""
                      ? "bg-[#a3d5ff] shadow-[2px_2px_0px_0px_#1a1a1a]"
                      : "bg-card hover:bg-secondary"
                  }`}
                >
                  Tous
                </button>
                {TERRITORIES.map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTerritory(t);
                      setPage(0);
                    }}
                    className={`rounded-lg border-2 border-border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      territory === t
                        ? "bg-[#a3d5ff] shadow-[2px_2px_0px_0px_#1a1a1a]"
                        : "bg-card hover:bg-secondary"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grant list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : grants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="rounded-2xl border-2 border-dashed border-border p-10 text-center">
            <Search className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-lg font-black">Aucune subvention trouvée</p>
            <p className="text-sm text-muted-foreground font-medium mt-1">
              Essayez de modifier vos filtres ou votre recherche.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {grants.map((grant) => {
            const typeBadge = getTypeBadge(grant.source_name);
            const days = grant.deadline ? daysUntil(grant.deadline) : null;
            return (
              <div
                key={grant.id}
                className="rounded-2xl border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_#1a1a1a] transition-all hover:shadow-[6px_6px_0px_0px_#1a1a1a] hover:translate-x-[-1px] hover:translate-y-[-1px]"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Badges row */}
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                      <Badge variant={typeBadge.variant}>
                        {typeBadge.label}
                      </Badge>
                      <Badge
                        variant={
                          grant.country === "EU" ? "blue" : "yellow"
                        }
                      >
                        {grant.country}
                      </Badge>
                      {grant.thematic_areas?.slice(0, 3).map((t) => (
                        <Badge key={t} variant="secondary">
                          {t}
                        </Badge>
                      ))}
                    </div>

                    {/* Title + funder */}
                    <h3 className="text-lg font-black text-foreground leading-tight">
                      {grant.title}
                    </h3>
                    <p className="text-sm font-semibold text-muted-foreground mt-0.5">
                      {grant.funder}
                    </p>

                    {/* Summary */}
                    {grant.summary && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {grant.summary}
                      </p>
                    )}

                    {/* Meta row */}
                    <div className="flex items-center gap-5 mt-3 text-sm font-semibold text-muted-foreground flex-wrap">
                      {grant.deadline && (
                        <>
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            {days !== null && days > 0
                              ? `${days} jours restants`
                              : "Expiré"}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(grant.deadline).toLocaleDateString(
                              "fr-FR"
                            )}
                          </span>
                        </>
                      )}
                      {grant.max_amount_eur && (
                        <span className="flex items-center gap-1.5">
                          <Euro className="h-3.5 w-3.5" />
                          Jusqu&apos;à{" "}
                          {grant.max_amount_eur.toLocaleString("fr-FR")} €
                        </span>
                      )}
                      <span className="text-xs px-2 py-0.5 rounded-lg bg-secondary">
                        {grant.source_name}
                      </span>
                    </div>
                  </div>

                  {/* Action */}
                  {grant.source_url && (
                    <a
                      href={grant.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0"
                    >
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4" />
                        Voir
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm font-bold text-muted-foreground">
            Page {page + 1} sur {totalPages} — {total} résultats
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPage((p) => Math.min(totalPages - 1, p + 1))
              }
              disabled={page >= totalPages - 1}
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
