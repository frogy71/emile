"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
  Target,
  AlertTriangle,
  Zap,
  Sparkles,
  DollarSign,
} from "lucide-react";
import { EmailSequenceDashboard } from "@/components/email-sequence-dashboard";
import { BlogDashboard } from "@/components/blog-dashboard";

interface SourceStat {
  name: string;
  method: string;
  frequency: string;
  grantCount: number;
  lastUpdate: string | null;
  reliability: string;
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
    proActive: number;
    expertActive: number;
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
  kpis?: {
    conversion14d: { cohortSize: number; converted: number; rate: number } | null;
    churnM2: { cohortSize: number; cancelled: number; rate: number } | null;
    partnerships: { signed: number; discussing: number; prospect: number };
  };
  partnerships?: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    signedAt: string | null;
  }>;
  sources: SourceStat[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

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
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
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
            Vue d&apos;ensemble : business, données, performance
          </p>
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

      {/* Email conversion engine — Free → Pro nurture sequence */}
      <EmailSequenceDashboard />

      {/* Blog engine — Grant du Jour SEO */}
      <BlogDashboard />

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
                {stats?.organizations.proActive || 0}
              </p>
              <p className="text-xs font-bold">Abonnés Pro (79&euro;/mois)</p>
            </div>
            <div className="rounded-2xl border-2 border-border bg-[#d4b5ff] p-5 shadow-[4px_4px_0px_0px_#1a1a1a]">
              <p className="text-2xl font-black">
                {stats?.organizations.expertActive || 0}
              </p>
              <p className="text-xs font-bold">Abonnés Expert (199&euro;/mois)</p>
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

      {/* AI cost — margin health */}
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

      {/* KPIs critiques */}
      {stats?.kpis && (
        <>
          <h2 className="text-xl font-black mb-4">KPIs critiques</h2>
          <div className="grid gap-4 md:grid-cols-3 mb-4">
            <div
              className={`rounded-2xl border-2 border-border p-5 shadow-[4px_4px_0px_0px_#1a1a1a] ${
                (stats.kpis.conversion14d?.rate ?? 0) >= 3
                  ? "bg-[#c8f76f]"
                  : (stats.kpis.conversion14d?.rate ?? 0) >= 1
                  ? "bg-[#ffe066]"
                  : "bg-[#ffa3d1]"
              }`}
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="h-6 w-6" />
                <div>
                  <p className="text-2xl font-black">
                    {stats.kpis.conversion14d?.rate ?? 0}%
                  </p>
                  <p className="text-xs font-bold">
                    Conversion free → payant à 14j
                  </p>
                  <p className="text-xs font-medium mt-1 opacity-75">
                    {stats.kpis.conversion14d?.converted ?? 0} /{" "}
                    {stats.kpis.conversion14d?.cohortSize ?? 0} · cible &gt;3%
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`rounded-2xl border-2 border-border p-5 shadow-[4px_4px_0px_0px_#1a1a1a] ${
                (stats.kpis.churnM2?.rate ?? 0) <= 10
                  ? "bg-[#c8f76f]"
                  : (stats.kpis.churnM2?.rate ?? 0) <= 20
                  ? "bg-[#ffe066]"
                  : "bg-[#ffa3d1]"
              }`}
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6" />
                <div>
                  <p className="text-2xl font-black">
                    {stats.kpis.churnM2?.rate ?? 0}%
                  </p>
                  <p className="text-xs font-bold">Churn mois 2</p>
                  <p className="text-xs font-medium mt-1 opacity-75">
                    {stats.kpis.churnM2?.cancelled ?? 0} /{" "}
                    {stats.kpis.churnM2?.cohortSize ?? 0} · cible &lt;10%
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border-2 border-border bg-[#a3d5ff] p-5 shadow-[4px_4px_0px_0px_#1a1a1a]">
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6" />
                <div>
                  <p className="text-2xl font-black">
                    {stats.kpis.partnerships.signed}
                  </p>
                  <p className="text-xs font-bold">Partenariats signés</p>
                  <p className="text-xs font-medium mt-1 opacity-75">
                    {stats.kpis.partnerships.discussing} en discussion ·{" "}
                    {stats.kpis.partnerships.prospect} prospects
                  </p>
                </div>
              </div>
            </div>
          </div>

          {stats.partnerships && stats.partnerships.length > 0 && (
            <div className="rounded-2xl border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_#1a1a1a] mb-8">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Pipeline partenariats
              </p>
              <div className="space-y-2">
                {stats.partnerships.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold">{p.name}</span>
                      <Badge
                        variant={
                          p.status === "signed"
                            ? "green"
                            : p.status === "discussing"
                            ? "purple"
                            : "default"
                        }
                      >
                        {p.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-medium">
                        {p.type}
                      </span>
                    </div>
                    {p.signedAt && (
                      <span className="text-xs text-muted-foreground font-medium">
                        signé le {new Date(p.signedAt).toLocaleDateString("fr-FR")}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
