"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import {
  RefreshCw,
  Clock,
  CheckCircle,
  Sparkles,
  Zap,
} from "lucide-react";

interface IngestionHealth {
  timestamp: string;
  totals: { totalGrants: number; activeGrants: number; sources: number };
  sources: Array<{
    name: string;
    cadence: "daily" | "weekly";
    grantCount: number;
    activeGrantCount: number;
    lastRun: {
      startedAt: string;
      completedAt: string | null;
      status: "running" | "success" | "partial" | "failed";
      fetched: number;
      inserted: number;
      skipped: number;
      errors: number;
      durationMs: number;
      errorMessage: string | null;
      trigger: string;
    } | null;
    consecutiveFailures: number;
    reliability: "healthy" | "degraded" | "broken" | "stale" | "unknown";
  }>;
  recentRuns: Array<{
    id: string;
    run_id: string;
    source_name: string;
    started_at: string;
    completed_at: string | null;
    status: string;
    fetched: number;
    inserted: number;
    errors: number;
    duration_ms: number;
    trigger: string;
  }>;
}

type FoundationPortalHealth = "healthy" | "no_calls" | "unreachable" | "unknown";
type FoundationEventType =
  | "opened"
  | "still_open"
  | "deadline_changed"
  | "closing_soon"
  | "disappeared"
  | "closed"
  | "reopened";

interface FoundationHealthResponse {
  timestamp: string;
  totals: {
    totalPortals: number;
    healthyPortals: number;
    noCallsPortals: number;
    unreachablePortals: number;
    totalCalls: number;
    activeCalls: number;
    closingSoonCalls: number;
  };
  counts30d: {
    opened: number;
    closed: number;
    disappeared: number;
    reopened: number;
    closingSoon: number;
    deadlineChanged: number;
  };
  portals: Array<{
    funder: string;
    portalUrl: string;
    lastCrawledAt: string | null;
    lastSuccessAt: string | null;
    lastReachable: boolean;
    activeCalls: number;
    health: FoundationPortalHealth;
    lastError: string | null;
    emptyCrawlsInARow: number;
    events30d: {
      opened: number;
      closed: number;
      disappeared: number;
      reopened: number;
      closingSoon: number;
      deadlineChanged: number;
      lastEventAt: string | null;
    } | null;
  }>;
  recentEvents: Array<{
    id: string;
    grantId: string;
    eventType: FoundationEventType;
    detectedAt: string;
    previousStatus: string | null;
    newStatus: string | null;
    notes: string | null;
    grantTitle: string | null;
    funder: string | null;
  }>;
}

interface GrantQualityStats {
  total: number;
  active: number;
  withDeadline: number;
  withSummary: number;
}

export default function AdminSourcesPage() {
  const [health, setHealth] = useState<IngestionHealth | null>(null);
  const [foundationHealth, setFoundationHealth] =
    useState<FoundationHealthResponse | null>(null);
  const [enrichment, setEnrichment] = useState<{
    total: number;
    enriched: number;
    unenriched: number;
    progress_pct: number;
    last_enriched_at: string | null;
    backlog_warning: boolean;
    backlog_critical: boolean;
  } | null>(null);
  const [grantStats, setGrantStats] = useState<GrantQualityStats | null>(null);
  const [enriching, setEnriching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    fetchIngestionHealth();
    fetchFoundationHealth();
    fetchEnrichmentStatus();
    fetchGrantStats();
  }

  async function fetchGrantStats() {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      const res = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setGrantStats(data.grants);
    } catch (e) {
      console.error("Failed to load grant stats:", e);
    }
  }

  async function fetchEnrichmentStatus() {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      const res = await fetch("/api/admin/enrichment-status", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) return;
      setEnrichment(await res.json());
    } catch (e) {
      console.error("Failed to load enrichment status:", e);
    }
  }

  async function triggerEnrichment() {
    setEnriching(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        alert("Session expirée — reconnectez-vous");
        return;
      }
      const res = await fetch("/api/admin/enrichment-status", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        alert(`Erreur : ${data?.error || `HTTP ${res.status}`}`);
      } else {
        alert(
          `Enrichissement OK (${data.duration_seconds}s)\n${data.processed} traités · ${data.ok} succès · ${data.failed} échecs`
        );
      }
      fetchEnrichmentStatus();
      fetchGrantStats();
    } catch (e) {
      alert(`Erreur réseau : ${e instanceof Error ? e.message : "inconnue"}`);
    }
    setEnriching(false);
  }

  async function fetchIngestionHealth() {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      const res = await fetch("/api/admin/ingestion-health", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setHealth(data);
    } catch (e) {
      console.error("Failed to load ingestion health:", e);
    }
  }

  async function fetchFoundationHealth() {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      const res = await fetch("/api/admin/foundation-health", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) return;
      const data = (await res.json()) as FoundationHealthResponse;
      setFoundationHealth(data);
    } catch (e) {
      console.error("Failed to load foundation health:", e);
    }
  }

  async function triggerUpdate(mode: "daily" | "full" | "cleanup" = "daily") {
    setRefreshing(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        alert("Session expirée — reconnectez-vous");
        setRefreshing(false);
        return;
      }
      const res = await fetch("/api/admin/ingest", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mode }),
      });
      const raw = await res.text();
      let data: { success?: boolean; error?: string; expired_marked?: number; duration_seconds?: number; report?: { totalFetched: number; totalInserted: number; totalErrors: number } } | null = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        const hint =
          res.status === 504 || /timeout|timed? out/i.test(raw)
            ? " — la fonction a probablement dépassé 300s. Lance « Sync rapide » ou des sources individuelles."
            : "";
        alert(
          `Erreur ${res.status} ${res.statusText}: ${raw.slice(0, 200) || "réponse vide"}${hint}`
        );
        return;
      }

      if (!res.ok || !data?.success) {
        alert(`Erreur: ${data?.error || `HTTP ${res.status}`}`);
      } else if (mode === "cleanup") {
        alert(`Cleanup OK — ${data.expired_marked} grants expirés marqués`);
      } else {
        const r = data.report!;
        alert(
          `Ingestion ${mode} terminée (${data.duration_seconds}s)\n${r.totalFetched} fetched · ${r.totalInserted} upserted · ${r.totalErrors} errors\n${data.expired_marked} grants expirés marqués`
        );
      }
      fetchAll();
    } catch (e) {
      alert(`Erreur réseau: ${e instanceof Error ? e.message : "inconnue"}`);
    }
    setRefreshing(false);
  }

  const enrichmentRate =
    grantStats && grantStats.total > 0
      ? Math.round((grantStats.withSummary / grantStats.total) * 100)
      : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-black text-foreground">Sources &amp; Grants</h1>
          <p className="text-muted-foreground font-medium">
            Santé de l&apos;ingestion, qualité des données, enrichissement IA
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => triggerUpdate("cleanup")}
            disabled={refreshing}
          >
            Cleanup
          </Button>
          <Button
            variant="outline"
            onClick={() => triggerUpdate("daily")}
            disabled={refreshing}
          >
            Sync rapide
          </Button>
          <Button
            variant="accent"
            onClick={() => triggerUpdate("full")}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Mise à jour..." : "Full ingest"}
          </Button>
        </div>
      </div>

      {/* Data quality */}
      <h2 className="text-xl font-black mb-4">Qualité des données</h2>
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card className="border-2 border-border shadow-[4px_4px_0px_0px_#1a1a1a]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <p className="text-2xl font-black">
                {grantStats?.active.toLocaleString("fr-FR") || "—"}
              </p>
            </div>
            <p className="text-xs text-muted-foreground font-bold">Grants actifs</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-border shadow-[4px_4px_0px_0px_#1a1a1a]">
          <CardContent className="pt-6">
            <p className="text-2xl font-black">
              {grantStats?.withDeadline.toLocaleString("fr-FR") || "—"}
            </p>
            <p className="text-xs text-muted-foreground font-bold">Avec deadline</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-border shadow-[4px_4px_0px_0px_#1a1a1a]">
          <CardContent className="pt-6">
            <p className="text-2xl font-black">
              {grantStats?.withSummary.toLocaleString("fr-FR") || "—"}
            </p>
            <p className="text-xs text-muted-foreground font-bold">Avec description</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-border shadow-[4px_4px_0px_0px_#1a1a1a]">
          <CardContent className="pt-6">
            <p className="text-2xl font-black">{enrichmentRate}%</p>
            <p className="text-xs text-muted-foreground font-bold">
              Taux enrichissement
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Enrichment progress */}
      <h2 className="text-xl font-black mb-4">Enrichissement IA</h2>
      <div className="mb-8">
        {enrichment ? (
          <div
            className={`rounded-2xl border-2 border-border p-5 shadow-[4px_4px_0px_0px_#1a1a1a] ${
              enrichment.backlog_critical
                ? "bg-red-100"
                : enrichment.backlog_warning
                  ? "bg-[#ffe066]"
                  : "bg-card"
            }`}
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-[260px]">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-5 w-5" />
                  <span className="text-sm font-bold text-muted-foreground">
                    Enrichissement IA
                  </span>
                  {enrichment.backlog_critical && (
                    <Badge variant="pink">backlog critique</Badge>
                  )}
                  {!enrichment.backlog_critical && enrichment.backlog_warning && (
                    <Badge variant="yellow">backlog</Badge>
                  )}
                </div>
                <p className="text-3xl font-black">
                  {enrichment.enriched.toLocaleString("fr-FR")} /{" "}
                  {enrichment.total.toLocaleString("fr-FR")}
                  <span className="ml-2 text-base font-bold text-muted-foreground">
                    ({enrichment.progress_pct}%)
                  </span>
                </p>
                <p className="text-sm font-bold text-muted-foreground mt-1">
                  {enrichment.unenriched.toLocaleString("fr-FR")} grants non
                  enrichis · le cron en traite 50 toutes les 6h
                </p>
                {enrichment.last_enriched_at && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Dernier enrichissement :{" "}
                    {new Date(enrichment.last_enriched_at).toLocaleString("fr-FR")}
                  </p>
                )}
                <div className="mt-3 h-3 w-full rounded-full border-2 border-border bg-white overflow-hidden">
                  <div
                    className="h-full bg-[#c8f76f]"
                    style={{ width: `${enrichment.progress_pct}%` }}
                  />
                </div>
              </div>
              <Button
                variant="accent"
                onClick={triggerEnrichment}
                disabled={enriching || enrichment.unenriched === 0}
              >
                <Zap className={`h-4 w-4 ${enriching ? "animate-spin" : ""}`} />
                {enriching
                  ? "Enrichissement..."
                  : "Lancer l'enrichissement (50)"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_#1a1a1a]">
            <p className="text-sm text-muted-foreground font-bold">Chargement...</p>
          </div>
        )}
      </div>

      {/* Ingestion health */}
      <h2 className="text-xl font-black mb-4">Santé de l&apos;ingestion</h2>
      <div className="space-y-3 mb-8">
        {health?.sources && health.sources.length > 0 ? (
          health.sources.map((src) => {
            const reliabilityColor = {
              healthy: "bg-[#c8f76f]",
              degraded: "bg-[#ffe066]",
              broken: "bg-red-400",
              stale: "bg-orange-300",
              unknown: "bg-gray-300",
            }[src.reliability];
            const reliabilityLabel = {
              healthy: "OK",
              degraded: "dégradé",
              broken: "cassé",
              stale: "obsolète",
              unknown: "jamais exécuté",
            }[src.reliability];
            return (
              <div
                key={src.name}
                className="rounded-2xl border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_#1a1a1a]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      className={`h-3 w-3 rounded-full mt-1.5 ${reliabilityColor}`}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black">{src.name}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge variant={src.cadence === "daily" ? "green" : "yellow"}>
                          {src.cadence === "daily" ? "quotidien" : "hebdo"}
                        </Badge>
                        <Badge variant={src.reliability === "healthy" ? "green" : "yellow"}>
                          {reliabilityLabel}
                        </Badge>
                        {src.consecutiveFailures > 0 && (
                          <Badge variant="pink">
                            {src.consecutiveFailures} échec
                            {src.consecutiveFailures > 1 ? "s" : ""} d&apos;affilée
                          </Badge>
                        )}
                        {src.lastRun && (
                          <span className="text-xs text-muted-foreground font-bold">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {new Date(src.lastRun.startedAt).toLocaleString("fr-FR", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {" · "}
                            {(src.lastRun.durationMs / 1000).toFixed(1)}s
                          </span>
                        )}
                      </div>
                      {src.lastRun && (
                        <p className="text-xs text-muted-foreground font-medium mt-1">
                          Dernier run : {src.lastRun.fetched} fetched ·{" "}
                          {src.lastRun.inserted} upserted ·{" "}
                          {src.lastRun.errors} erreurs · trigger=
                          {src.lastRun.trigger}
                        </p>
                      )}
                      {src.lastRun?.errorMessage && (
                        <p className="text-xs text-red-600 font-bold mt-1 truncate">
                          ⚠ {src.lastRun.errorMessage}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-black">{src.activeGrantCount}</p>
                    <p className="text-xs text-muted-foreground font-bold">
                      actifs / {src.grantCount}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-muted-foreground font-medium">
            Pas encore de runs d&apos;ingestion enregistrés.
          </p>
        )}
      </div>

      {/* Foundation portals */}
      {foundationHealth && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black">Fondations privées — portails</h2>
            <span className="text-xs text-muted-foreground font-bold">
              Cycle de vie des AAP (30 derniers jours)
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-4 mb-4">
            <div className="rounded-2xl border-2 border-border bg-[#c8f76f] p-4 shadow-[4px_4px_0px_0px_#1a1a1a]">
              <p className="text-3xl font-black">
                {foundationHealth.totals.activeCalls}
              </p>
              <p className="text-xs font-bold uppercase tracking-wider mt-1">
                AAP actifs
              </p>
            </div>
            <div className="rounded-2xl border-2 border-border bg-[#ffe066] p-4 shadow-[4px_4px_0px_0px_#1a1a1a]">
              <p className="text-3xl font-black">
                {foundationHealth.totals.closingSoonCalls}
              </p>
              <p className="text-xs font-bold uppercase tracking-wider mt-1">
                Clôture ≤ 14 j
              </p>
            </div>
            <div className="rounded-2xl border-2 border-border bg-[#ffa3d1] p-4 shadow-[4px_4px_0px_0px_#1a1a1a]">
              <p className="text-3xl font-black">
                {foundationHealth.counts30d.opened}
              </p>
              <p className="text-xs font-bold uppercase tracking-wider mt-1">
                Ouverts (30 j)
              </p>
            </div>
            <div className="rounded-2xl border-2 border-border bg-card p-4 shadow-[4px_4px_0px_0px_#1a1a1a]">
              <p className="text-3xl font-black">
                {foundationHealth.totals.healthyPortals} /{" "}
                {foundationHealth.totals.totalPortals}
              </p>
              <p className="text-xs font-bold uppercase tracking-wider mt-1">
                Portails sains
              </p>
              {(foundationHealth.totals.noCallsPortals > 0 ||
                foundationHealth.totals.unreachablePortals > 0) && (
                <p className="text-xs text-red-600 font-bold mt-1">
                  ⚠ {foundationHealth.totals.noCallsPortals} sans AAP ·{" "}
                  {foundationHealth.totals.unreachablePortals} injoignables
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border-2 border-border bg-card shadow-[4px_4px_0px_0px_#1a1a1a] overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left font-black text-xs">Fondation</th>
                  <th className="px-3 py-2 text-left font-black text-xs">Santé</th>
                  <th className="px-3 py-2 text-right font-black text-xs">AAP actifs</th>
                  <th className="px-3 py-2 text-right font-black text-xs">Ouverts 30j</th>
                  <th className="px-3 py-2 text-right font-black text-xs">Fermés 30j</th>
                  <th className="px-3 py-2 text-left font-black text-xs">Dernier crawl</th>
                </tr>
              </thead>
              <tbody>
                {foundationHealth.portals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-center text-muted-foreground font-medium">
                      Aucun portail fondation crawlé pour l&apos;instant.
                    </td>
                  </tr>
                ) : (
                  foundationHealth.portals
                    .slice()
                    .sort((a, b) => {
                      const rank = (h: FoundationPortalHealth) =>
                        h === "unreachable" ? 0 : h === "no_calls" ? 1 : h === "unknown" ? 2 : 3;
                      const d = rank(a.health) - rank(b.health);
                      return d !== 0 ? d : b.activeCalls - a.activeCalls;
                    })
                    .slice(0, 40)
                    .map((p) => (
                      <tr key={p.funder} className="border-t border-border">
                        <td className="px-3 py-2">
                          <a href={p.portalUrl} target="_blank" rel="noopener noreferrer" className="font-bold underline">
                            {p.funder}
                          </a>
                          {p.lastError && (
                            <p className="text-xs text-red-600 mt-0.5 truncate max-w-sm">
                              ⚠ {p.lastError}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <Badge
                            variant={
                              p.health === "healthy"
                                ? "green"
                                : p.health === "no_calls"
                                  ? "yellow"
                                  : p.health === "unreachable"
                                    ? "pink"
                                    : "secondary"
                            }
                          >
                            {p.health === "healthy"
                              ? "OK"
                              : p.health === "no_calls"
                                ? "0 AAP"
                                : p.health === "unreachable"
                                  ? "KO"
                                  : "?"}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-right font-mono">{p.activeCalls}</td>
                        <td className="px-3 py-2 text-right font-mono">{p.events30d?.opened ?? 0}</td>
                        <td className="px-3 py-2 text-right font-mono">
                          {(p.events30d?.closed ?? 0) + (p.events30d?.disappeared ?? 0)}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {p.lastCrawledAt
                            ? new Date(p.lastCrawledAt).toLocaleString("fr-FR", {
                                day: "2-digit",
                                month: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "jamais"}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>

          {foundationHealth.recentEvents.length > 0 && (
            <div className="rounded-2xl border-2 border-border bg-card shadow-[4px_4px_0px_0px_#1a1a1a] p-4 mb-8">
              <h3 className="text-sm font-black uppercase tracking-wider mb-3">
                Flux récent des événements
              </h3>
              <div className="space-y-2">
                {foundationHealth.recentEvents.slice(0, 15).map((e) => {
                  const color = {
                    opened: "bg-[#c8f76f]",
                    reopened: "bg-[#c8f76f]",
                    closed: "bg-[#ffa3d1]",
                    disappeared: "bg-orange-300",
                    closing_soon: "bg-[#ffe066]",
                    deadline_changed: "bg-blue-200",
                    still_open: "bg-gray-200",
                  }[e.eventType];
                  const label = {
                    opened: "🆕 Ouvert",
                    reopened: "↩️ Réouvert",
                    closed: "✅ Clôturé",
                    disappeared: "👻 Disparu",
                    closing_soon: "⏰ Clôture proche",
                    deadline_changed: "📆 Deadline modifiée",
                    still_open: "✓ Toujours ouvert",
                  }[e.eventType];
                  return (
                    <div key={e.id} className="flex items-start gap-3 text-sm border-b border-border/50 pb-2 last:border-0">
                      <Badge className={color}>{label}</Badge>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold truncate">
                          {e.grantTitle ?? "(grant supprimé)"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {e.funder}
                          {e.notes ? ` · ${e.notes}` : ""}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono shrink-0">
                        {new Date(e.detectedAt).toLocaleString("fr-FR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Recent runs */}
      {health?.recentRuns && health.recentRuns.length > 0 && (
        <>
          <h2 className="text-xl font-black mb-4">
            Historique récent (20 derniers runs)
          </h2>
          <div className="rounded-2xl border-2 border-border bg-card shadow-[4px_4px_0px_0px_#1a1a1a] overflow-hidden mb-8">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left font-black text-xs">Source</th>
                  <th className="px-3 py-2 text-left font-black text-xs">Démarré</th>
                  <th className="px-3 py-2 text-left font-black text-xs">Statut</th>
                  <th className="px-3 py-2 text-right font-black text-xs">Fetched</th>
                  <th className="px-3 py-2 text-right font-black text-xs">Inserted</th>
                  <th className="px-3 py-2 text-right font-black text-xs">Errors</th>
                  <th className="px-3 py-2 text-right font-black text-xs">Durée</th>
                  <th className="px-3 py-2 text-left font-black text-xs">Trigger</th>
                </tr>
              </thead>
              <tbody>
                {health.recentRuns.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-3 py-2 font-bold">{r.source_name}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {new Date(r.started_at).toLocaleString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-3 py-2">
                      <Badge
                        variant={
                          r.status === "success"
                            ? "green"
                            : r.status === "failed"
                              ? "pink"
                              : "yellow"
                        }
                      >
                        {r.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-right font-mono">{r.fetched}</td>
                    <td className="px-3 py-2 text-right font-mono">{r.inserted}</td>
                    <td className="px-3 py-2 text-right font-mono">{r.errors}</td>
                    <td className="px-3 py-2 text-right font-mono">
                      {(r.duration_ms / 1000).toFixed(1)}s
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{r.trigger}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

    </div>
  );
}
