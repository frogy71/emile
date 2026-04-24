"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search,
  Calendar,
  Euro,
  Clock,
  Filter,
  X,
  Loader2,
  Sparkles,
  ArrowDown,
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [theme, setTheme] = useState("");
  const [territory, setTerritory] = useState("");
  const [page, setPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [relaxed, setRelaxed] = useState(false);
  const [relaxedLabel, setRelaxedLabel] = useState<string | null>(null);
  const [relaxedFilters, setRelaxedFilters] = useState<string[]>([]);
  const limit = 20;
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Always starts at page 0 when filters change — managed in the individual
  // filter handlers. Page resets are why we key fetchFirstPage on filters
  // only (not page).
  const fetchFirstPage = useCallback(async () => {
    setLoading(true);
    setPage(0);
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (type) params.set("type", type);
    if (theme) params.set("theme", theme);
    if (territory) params.set("territory", territory);
    params.set("limit", String(limit));
    params.set("offset", "0");

    try {
      const res = await fetch(`/api/grants?${params.toString()}`);
      const data = await res.json();
      setGrants(data.grants || []);
      setTotal(data.total || 0);
      setRelaxed(Boolean(data.relaxed));
      setRelaxedLabel(data.relaxedLabel || null);
      setRelaxedFilters(Array.isArray(data.relaxedFilters) ? data.relaxedFilters : []);
    } catch {
      setGrants([]);
      setTotal(0);
      setRelaxed(false);
      setRelaxedLabel(null);
      setRelaxedFilters([]);
    } finally {
      setLoading(false);
    }
  }, [search, type, theme, territory]);

  // Append-next-page: used by both the "Charger plus" button and the
  // intersection observer on the sentinel. Guarded against double-fire and
  // against firing while the initial load is still in flight.
  const loadMore = useCallback(async () => {
    if (loading || loadingMore) return;
    if (grants.length >= total) return;

    setLoadingMore(true);
    const nextPage = page + 1;
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (type) params.set("type", type);
    if (theme) params.set("theme", theme);
    if (territory) params.set("territory", territory);
    params.set("limit", String(limit));
    params.set("offset", String(nextPage * limit));

    try {
      const res = await fetch(`/api/grants?${params.toString()}`);
      const data = await res.json();
      // De-dupe by id in case the user mutated filters mid-flight
      setGrants((prev) => {
        const seen = new Set(prev.map((g) => g.id));
        const incoming = (data.grants as Grant[] | undefined) || [];
        return [...prev, ...incoming.filter((g) => !seen.has(g.id))];
      });
      setPage(nextPage);
    } catch {
      // Swallow — the user will see the button still there and can retry
    } finally {
      setLoadingMore(false);
    }
  }, [loading, loadingMore, grants.length, total, page, search, type, theme, territory]);

  useEffect(() => {
    fetchFirstPage();
  }, [fetchFirstPage]);

  // Auto-load more when the sentinel scrolls into view. Cheap UX that makes
  // the long-tail feel browsable. Manual button below is the fallback for
  // keyboard users + when the observer is dormant between loads.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    if (loading || loadingMore) return;
    if (grants.length === 0 || grants.length >= total) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          loadMore();
        }
      },
      { rootMargin: "400px" } // start fetching before the user hits the end
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loading, loadingMore, grants.length, total, loadMore]);

  const canLoadMore = !loading && !loadingMore && grants.length < total;
  const loadedAll = total > 0 && grants.length >= total;

  const clearFilters = () => {
    setSearch("");
    setType("");
    setTheme("");
    setTerritory("");
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
            onChange={(e) => setSearch(e.target.value)}
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
                    onClick={() => setType(t.value)}
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
                  onClick={() => setTheme("")}
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
                    onClick={() => setTheme(t)}
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
                  onClick={() => setTerritory("")}
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
                    onClick={() => setTerritory(t)}
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

      {/* Relaxation banner — tells the user we broadened the search rather
          than showing them an empty page. Mirrors the API's `relaxed` flag. */}
      {!loading && relaxed && grants.length > 0 && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border-2 border-border bg-[#fff5d1] p-4 shadow-[3px_3px_0px_0px_#1a1a1a]">
          <Sparkles className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-black">
              Aucun résultat strict — on a élargi la recherche pour toi
            </p>
            <p className="text-xs font-semibold text-muted-foreground mt-0.5">
              Filtre{relaxedFilters.length > 1 ? "s" : ""} relâché
              {relaxedFilters.length > 1 ? "s" : ""} :{" "}
              <span className="font-black text-foreground">{relaxedLabel}</span>{" "}
              · {total} subvention{total > 1 ? "s" : ""} affichée
              {total > 1 ? "s" : ""}
            </p>
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-3.5 w-3.5" />
              Reset
            </Button>
          )}
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
            <p className="text-sm text-muted-foreground font-medium mt-1 max-w-sm">
              Même en élargissant la recherche, on n&apos;a rien trouvé. Essaie
              de retirer des filtres ou de changer ta recherche.
            </p>
            {hasFilters && (
              <Button variant="accent" className="mt-4" onClick={clearFilters}>
                <X className="h-4 w-4" />
                Effacer tous les filtres
              </Button>
            )}
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
                    <Link
                      href={`/grants/${grant.id}`}
                      className="block group"
                    >
                      <h3 className="text-lg font-black text-foreground leading-tight group-hover:underline decoration-2 underline-offset-2">
                        {grant.title}
                      </h3>
                    </Link>
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
                  <Link href={`/grants/${grant.id}`} className="shrink-0">
                    <Button variant="outline" size="sm">
                      En savoir plus
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Load-more / infinite-scroll sentinel */}
      {!loading && grants.length > 0 && (
        <div className="mt-8 flex flex-col items-center gap-3">
          <p className="text-sm font-bold text-muted-foreground">
            {grants.length} / {total} subventions affichées
          </p>

          {canLoadMore && (
            <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Chargement…
                </>
              ) : (
                <>
                  <ArrowDown className="h-4 w-4" />
                  Charger plus
                </>
              )}
            </Button>
          )}

          {loadedAll && (
            <p className="text-xs font-medium text-muted-foreground">
              Tu as tout parcouru — essaie un filtre pour affiner.
            </p>
          )}

          {/* Sentinel — when this scrolls into view the observer fires loadMore */}
          <div ref={sentinelRef} className="h-1 w-full" aria-hidden />
        </div>
      )}
    </div>
  );
}
