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
} from "lucide-react";

interface SourceStat {
  name: string;
  method: string;
  frequency: string;
  grantCount: number;
  lastUpdate: string | null;
  reliability: string;
}

interface AdminStats {
  grants: {
    total: number;
    active: number;
    withDeadline: number;
    withSummary: number;
  };
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  async function triggerUpdate() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/cron/update-grants");
      const data = await res.json();
      alert(
        `Mise à jour terminée!\n${data.aides_territoires?.fetched || 0} grants AT récupérés\n${data.expired_marked || 0} grants expirés marqués`
      );
      fetchStats();
    } catch {
      alert("Erreur lors de la mise à jour");
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
        <Button
          variant="accent"
          onClick={triggerUpdate}
          disabled={refreshing}
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          {refreshing ? "Mise à jour..." : "Forcer mise à jour"}
        </Button>
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

      {/* Sources */}
      <h2 className="text-xl font-black mb-4">Sources de données</h2>
      <div className="space-y-3 mb-8">
        {stats?.sources && stats.sources.length > 0 ? (
          stats.sources.map((src) => (
            <div
              key={src.name}
              className="rounded-2xl border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_#1a1a1a]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      src.reliability === "high"
                        ? "bg-[#c8f76f]"
                        : "bg-[#ffe066]"
                    }`}
                  />
                  <div>
                    <h3 className="font-black">{src.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant={
                          src.method.includes("API") ? "green" : "yellow"
                        }
                      >
                        {src.method}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-bold">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {src.frequency}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black">{src.grantCount}</p>
                  <p className="text-xs text-muted-foreground font-bold">
                    grants
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground font-medium">
            Aucune source trouvée
          </p>
        )}
      </div>
    </div>
  );
}
