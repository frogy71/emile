"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";

interface SourceStat {
  name: string;
  method: string;
  frequency: string;
  grantCount: number;
  lastUpdate: string | null;
  reliability: string;
}

interface SourcesData {
  total: number;
  active: number;
  withDeadline: number;
  withSummary: number;
  sources: SourceStat[];
}

export default function AdminDashboard() {
  const [sources, setSources] = useState<SourcesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSources();
  }, []);

  async function fetchSources() {
    try {
      const res = await fetch("/api/sources");
      const data = await res.json();
      setSources(data);
    } catch (e) {
      console.error("Failed to load sources:", e);
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
      fetchSources();
    } catch (e) {
      alert("Erreur lors de la mise à jour");
    }
    setRefreshing(false);
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

      {/* Business stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <div className="rounded-2xl border-2 border-border bg-[#c8f76f] p-5 shadow-[4px_4px_0px_0px_#1a1a1a]">
          <div className="flex items-center gap-3">
            <Database className="h-6 w-6" />
            <div>
              <p className="text-3xl font-black">
                {sources?.total || "—"}
              </p>
              <p className="text-xs font-bold">Grants en base</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-border bg-[#ffe066] p-5 shadow-[4px_4px_0px_0px_#1a1a1a]">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6" />
            <div>
              <p className="text-3xl font-black">0</p>
              <p className="text-xs font-bold">Utilisateurs</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-border bg-[#ffa3d1] p-5 shadow-[4px_4px_0px_0px_#1a1a1a]">
          <div className="flex items-center gap-3">
            <Euro className="h-6 w-6" />
            <div>
              <p className="text-3xl font-black">0€</p>
              <p className="text-xs font-bold">MRR</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-border bg-[#d4b5ff] p-5 shadow-[4px_4px_0px_0px_#1a1a1a]">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-6 w-6" />
            <div>
              <p className="text-3xl font-black">0%</p>
              <p className="text-xs font-bold">Conversion</p>
            </div>
          </div>
        </div>
      </div>

      {/* Data quality */}
      <h2 className="text-xl font-black mb-4">Qualité des données</h2>
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-black">{sources?.active || "—"}</p>
            <p className="text-xs text-muted-foreground font-bold">
              Grants actifs
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-black">
              {sources?.withSummary || "—"}
            </p>
            <p className="text-xs text-muted-foreground font-bold">
              Avec description
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-black">
              {sources?.withDeadline || "—"}
            </p>
            <p className="text-xs text-muted-foreground font-bold">
              Avec deadline
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-black">
              {sources
                ? Math.round(
                    ((sources.withSummary || 0) / sources.total) * 100
                  )
                : "—"}
              %
            </p>
            <p className="text-xs text-muted-foreground font-bold">
              Taux enrichissement
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sources */}
      <h2 className="text-xl font-black mb-4">Sources de données</h2>
      <div className="space-y-3">
        {loading ? (
          <p className="text-muted-foreground">Chargement...</p>
        ) : (
          sources?.sources?.map((src) => (
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
        )}
      </div>

      {/* Metrics placeholders */}
      <h2 className="text-xl font-black mt-8 mb-4">
        Métriques business (à venir)
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        {[
          { label: "Signups cette semaine", value: "—", icon: Users },
          { label: "Proposals générées", value: "—", icon: FileText },
          { label: "Scores calculés", value: "—", icon: Target },
          { label: "Emails alertes envoyés", value: "—", icon: BarChart3 },
        ].map((m) => (
          <Card key={m.label}>
            <CardContent className="pt-6 flex items-center gap-3">
              <m.icon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xl font-black">{m.value}</p>
                <p className="text-xs text-muted-foreground font-bold">
                  {m.label}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
