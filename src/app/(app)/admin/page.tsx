"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import {
  BarChart3,
  Users,
  FileText,
  Euro,
  TrendingUp,
  Database,
  RefreshCw,
  Shield,
  Clock,
  Target,
  CheckCircle,
  AlertTriangle,
  Zap,
  Sparkles,
  DollarSign,
} from "lucide-react";

interface SourceStat {
  name: string;
  method: string;
  frequency: string;
  grantCount: number;
  lastUpdate: string | null;
  reliability: string;
}

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

interface AiCostSummary {
  totalCalls: number;
  totalCostUsd: number;
  monthlyTotal: number;
  monthlyScoringCalls: number;
  monthlyProposalCalls: number;
}

interface AdminStats {
  grants: {
    total: number;
    active: number;
    withDeadline: number;
    withSummary: number;
  };
  aiCost: AiCostSummary | null;
  users: {
    total: number;
    signupsThisWeek: number;
  };
  organizations: {
    total: number;
    monthlyActive: number;
    annualActive: number;
  };
  projects: {
    total: number;
  };
  proposals: {
    total: number;
  };
  matchScores: {
    total: number;
  };
  revenue: {
    mrr: number;
    conversionRate: number;
    totalPayingOrgs: number;
  };
  sources: SourceStat[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [health, setHealth] = useState<IngestionHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
    fetchIngestionHealth();
  }, []);

  async function fetchIngestionHealth() {
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
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

  async function fetchStats() {
    try {
      setError(null);
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setError("Non authentifié. Veuillez vous connecter.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/admin/stats", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) {
        const body = await res.json();
        setError(body.error || "Erreur lors du chargement");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error("Failed to load admin stats:", e);
      setError("Erreur réseau");
    }
    setLoading(false);
  }

  async function triggerUpdate(mode: "daily" | "full" | "cleanup" = "daily") {
    setRefreshing(true);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
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
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(`Erreur: ${data.error || "inconnue"}`);
      } else if (mode === "cleanup") {
        alert(`Cleanup OK — ${data.expired_marked} grants expirés marqués`);
      } else {
        const r = data.report;
        alert(
          `Ingestion ${mode} terminée (${data.duration_seconds}s)\n${r.totalFetched} fetched · ${r.totalInserted} upserted · ${r.totalErrors} errors\n${data.expired_marked} grants expirés marqués`
        );
      }
      fetchStats();
      fetchIngestionHealth();
    } catch (e) {
      alert(`Erreur réseau: ${e instanceof Error ? e.message : "inconnue"}`);
    }
    setRefreshing(false);
  }

  const enrichmentRate =
    stats && stats.grants.total > 0
      ? Math.round((stats.grants.withSummary / stats.grants.total) * 100)
      : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground font-bold">
            Chargement du dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-red-500" />
          <p className="text-red-600 font-bold">{error}</p>
          <Button variant="accent" className="mt-4" onClick={fetchStats}>
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-foreground">
              Admin Dashboard
            </h1>
            <Badge variant="pink">
              <Shield className="h-3 w-3 mr-1" />
              Privé
            </Badge>
          </div>
          <p className="text-muted-foreground font-medium">
            Contrôle business, données et performance
          </p>
        </div>
        <div className="flex gap-2">
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
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Mise à jour..." : "Full ingest"}
          </Button>
        </div>
      </div>

      {/* Top 4 colored stat cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <div className="rounded-2xl border-2 border-border bg-[#c8f76f] p-5 shadow-[4px_4px_0px_0px_#1a1a1a]">
          <div className="flex items-center gap-3">
            <Database className="h-6 w-6" />
            <div>
              <p className="text-3xl font-black">
                {stats?.grants.total.toLocaleString("fr-FR") || "—"}
              </p>
              <p className="text-xs font-bold">Grants en base</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-border bg-[#ffe066] p-5 shadow-[4px_4px_0px_0px_#1a1a1a]">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6" />
            <div>
              <p className="text-3xl font-black">
                {stats?.users.total || "—"}
              </p>
              <p className="text-xs font-bold">Utilisateurs</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-border bg-[#ffa3d1] p-5 shadow-[4px_4px_0px_0px_#1a1a1a]">
          <div className="flex items-center gap-3">
            <Euro className="h-6 w-6" />
            <div>
              <p className="text-3xl font-black">
                {stats?.revenue.mrr.toLocaleString("fr-FR") || 0}&euro;
              </p>
              <p className="text-xs font-bold">MRR</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-border bg-[#d4b5ff] p-5 shadow-[4px_4px_0px_0px_#1a1a1a]">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-6 w-6" />
            <div>
              <p className="text-3xl font-black">
                {stats?.revenue.conversionRate || 0}%
              </p>
              <p className="text-xs font-bold">Conversion</p>
            </div>
          </div>
        </div>
      </div>

      {/* Activité récente */}
      <h2 className="text-xl font-black mb-4">Activité récente</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="rounded-2xl border-2 border-border bg-[#a3d5ff] p-5 shadow-[4px_4px_0px_0px_#1a1a1a]">
          <div className="flex items-center gap-3">
            <Zap className="h-5 w-5" />
            <div>
              <p className="text-2xl font-black">
                {stats?.users.signupsThisWeek || 0}
              </p>
              <p className="text-xs font-bold">Signups cette semaine</p>
            </div>
          </div>
        </div>

        <Card className="border-2 border-border shadow-[4px_4px_0px_0px_#1a1a1a]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-black">
                  {stats?.proposals.total || 0}
                </p>
                <p className="text-xs text-muted-foreground font-bold">
                  Proposals générées
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-border shadow-[4px_4px_0px_0px_#1a1a1a]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-black">
                  {stats?.matchScores.total.toLocaleString("fr-FR") || 0}
                </p>
                <p className="text-xs text-muted-foreground font-bold">
                  Scores calculés
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-border shadow-[4px_4px_0px_0px_#1a1a1a]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-black">
                  {stats?.organizations.total || 0} / {stats?.projects.total || 0}
                </p>
                <p className="text-xs text-muted-foreground font-bold">
                  Orgs / Projets
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue breakdown */}
      {(stats?.revenue.totalPayingOrgs || 0) > 0 && (
        <>
          <h2 className="text-xl font-black mb-4">Détail revenus</h2>
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <div className="rounded-2xl border-2 border-border bg-[#ffa3d1] p-5 shadow-[4px_4px_0px_0px_#1a1a1a]">
              <p className="text-2xl font-black">
                {stats?.organizations.monthlyActive || 0}
              </p>
              <p className="text-xs font-bold">Abonnés mensuels (79&euro;/mois)</p>
            </div>
            <div className="rounded-2xl border-2 border-border bg-[#d4b5ff] p-5 shadow-[4px_4px_0px_0px_#1a1a1a]">
              <p className="text-2xl font-black">
                {stats?.organizations.annualActive || 0}
              </p>
              <p className="text-xs font-bold">Abonnés annuels (59&euro;/mois)</p>
            </div>
            <div className="rounded-2xl border-2 border-border bg-[#c8f76f] p-5 shadow-[4px_4px_0px_0px_#1a1a1a]">
              <p className="text-2xl font-black">
                {stats?.revenue.totalPayingOrgs || 0}
              </p>
              <p className="text-xs font-bold">Total abonnés payants</p>
            </div>
          </div>
        </>
      )}

      {/* AI cost — margin health. MRR minus AI spend is the real gross margin. */}
      {stats?.aiCost && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl font-black">Coût IA</h2>
            <Badge variant="purple">
              <Sparkles className="h-3 w-3 mr-1" />
              Claude API
            </Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-4 mb-4">
            <div className="rounded-2xl border-2 border-border bg-[#d4b5ff] p-5 shadow-[4px_4px_0px_0px_#1a1a1a]">
              <div className="flex items-center gap-3">
                <DollarSign className="h-6 w-6" />
                <div>
                  <p className="text-2xl font-black">
                    ${stats.aiCost.monthlyTotal.toFixed(2)}
                  </p>
                  <p className="text-xs font-bold">Coût IA ce mois</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border-2 border-border bg-[#a3d5ff] p-5 shadow-[4px_4px_0px_0px_#1a1a1a]">
              <div className="flex items-center gap-3">
                <Target className="h-6 w-6" />
                <div>
                  <p className="text-2xl font-black">
                    {stats.aiCost.monthlyScoringCalls.toLocaleString("fr-FR")}
                  </p>
                  <p className="text-xs font-bold">Scorings (mois)</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border-2 border-border bg-[#ffa3d1] p-5 shadow-[4px_4px_0px_0px_#1a1a1a]">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6" />
                <div>
                  <p className="text-2xl font-black">
                    {stats.aiCost.monthlyProposalCalls.toLocaleString("fr-FR")}
                  </p>
                  <p className="text-xs font-bold">Proposals (mois)</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border-2 border-border bg-[#ffe066] p-5 shadow-[4px_4px_0px_0px_#1a1a1a]">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-6 w-6" />
                <div>
                  <p className="text-2xl font-black">
                    ${stats.aiCost.totalCostUsd.toFixed(2)}
                  </p>
                  <p className="text-xs font-bold">
                    Total depuis le début ({stats.aiCost.totalCalls.toLocaleString("fr-FR")} appels)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Gross margin estimation — MRR converted to USD at ~1.08 minus IA cost */}
          {stats.revenue.mrr > 0 && (
            <div className="rounded-2xl border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_#1a1a1a] mb-8">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Marge brute estimée ce mois (hors infra)
                  </p>
                  <p className="text-3xl font-black mt-1">
                    ${(stats.revenue.mrr * 1.08 - stats.aiCost.monthlyTotal).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium mt-1">
                    MRR ~${(stats.revenue.mrr * 1.08).toFixed(2)} − IA ${stats.aiCost.monthlyTotal.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-muted-foreground">Ratio IA/MRR</p>
                  <p className="text-2xl font-black">
                    {stats.revenue.mrr > 0
                      ? `${((stats.aiCost.monthlyTotal / (stats.revenue.mrr * 1.08)) * 100).toFixed(1)}%`
                      : "—"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Data quality */}
      <h2 className="text-xl font-black mb-4">Qualité des données</h2>
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card className="border-2 border-border shadow-[4px_4px_0px_0px_#1a1a1a]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <p className="text-2xl font-black">
                {stats?.grants.active.toLocaleString("fr-FR") || "—"}
              </p>
            </div>
            <p className="text-xs text-muted-foreground font-bold">
              Grants actifs
            </p>
          </CardContent>
        </Card>
        <Card className="border-2 border-border shadow-[4px_4px_0px_0px_#1a1a1a]">
          <CardContent className="pt-6">
            <p className="text-2xl font-black">
              {stats?.grants.withDeadline.toLocaleString("fr-FR") || "—"}
            </p>
            <p className="text-xs text-muted-foreground font-bold">
              Avec deadline
            </p>
          </CardContent>
        </Card>
        <Card className="border-2 border-border shadow-[4px_4px_0px_0px_#1a1a1a]">
          <CardContent className="pt-6">
            <p className="text-2xl font-black">
              {stats?.grants.withSummary.toLocaleString("fr-FR") || "—"}
            </p>
            <p className="text-xs text-muted-foreground font-bold">
              Avec description
            </p>
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

      {/* Ingestion health — per-source live status */}
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
                        <Badge
                          variant={
                            src.cadence === "daily" ? "green" : "yellow"
                          }
                        >
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
                            {new Date(src.lastRun.startedAt).toLocaleString(
                              "fr-FR",
                              { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }
                            )}
                            {" · "}
                            {(src.lastRun.durationMs / 1000).toFixed(1)}s
                          </span>
                        )}
                      </div>
                      {src.lastRun && (
                        <p className="text-xs text-muted-foreground font-medium mt-1">
                          Dernier run : {src.lastRun.fetched} fetched ·{" "}
                          {src.lastRun.inserted} upserted ·{" "}
                          {src.lastRun.errors} erreurs ·{" "}
                          trigger={src.lastRun.trigger}
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
