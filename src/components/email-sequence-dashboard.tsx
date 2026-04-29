"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, TrendingUp, Users, ChevronRight } from "lucide-react";

interface DashboardData {
  conversion: {
    allTime: { totalUsers: number; converted: number; rate: number };
    last30d: { totalUsers: number; converted: number; rate: number };
  };
  sequence: {
    enrolled: number;
    inSequence: number;
    completed: number;
    converted: number;
  };
  perStep: Array<{
    step: number;
    sent: number;
    opened: number;
    clicked: number;
    converted: number;
  }>;
  chart: Array<{ date: string; signups: number; conversions: number }>;
}

export function EmailSequenceDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    const res = await fetch("/api/admin/email-sequences/dashboard", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || `HTTP ${res.status}`);
      return;
    }
    const body = (await res.json()) as DashboardData;
    setData(body);
  }

  useEffect(() => {
    void load();
  }, []);

  if (error) {
    return (
      <div className="rounded-2xl border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_#1a1a1a] mb-8">
        <p className="text-sm text-red-600 font-bold">
          Email sequence dashboard: {error}
        </p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-black">Séquence emails Free → Pro</h2>
          <Badge variant="purple">
            <Mail className="h-3 w-3 mr-1" /> Conversion engine
          </Badge>
        </div>
        <Link href="/admin/email-sequences">
          <Button variant="outline" size="sm">
            Gérer la séquence <ChevronRight className="h-3 w-3" />
          </Button>
        </Link>
      </div>

      {/* Top KPI cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-4">
        <div className="rounded-2xl border-2 border-border bg-[#c8f76f] p-5 shadow-[4px_4px_0px_0px_#1a1a1a]">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-6 w-6" />
            <div>
              <p className="text-3xl font-black">
                {data.conversion.last30d.rate}%
              </p>
              <p className="text-xs font-bold">Conversion 30j</p>
              <p className="text-[11px] mt-1 opacity-75">
                {data.conversion.last30d.converted}/
                {data.conversion.last30d.totalUsers} utilisateurs
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-border bg-[#ffe066] p-5 shadow-[4px_4px_0px_0px_#1a1a1a]">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-6 w-6" />
            <div>
              <p className="text-3xl font-black">
                {data.conversion.allTime.rate}%
              </p>
              <p className="text-xs font-bold">Conversion all-time</p>
              <p className="text-[11px] mt-1 opacity-75">
                {data.conversion.allTime.converted}/
                {data.conversion.allTime.totalUsers} utilisateurs
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-border bg-[#a3d5ff] p-5 shadow-[4px_4px_0px_0px_#1a1a1a]">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6" />
            <div>
              <p className="text-3xl font-black">{data.sequence.inSequence}</p>
              <p className="text-xs font-bold">Actifs dans la séquence</p>
              <p className="text-[11px] mt-1 opacity-75">
                {data.sequence.enrolled} enrôlés au total
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-border bg-[#ffa3d1] p-5 shadow-[4px_4px_0px_0px_#1a1a1a]">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6" />
            <div>
              <p className="text-3xl font-black">{data.sequence.completed}</p>
              <p className="text-xs font-bold">Terminé sans conversion</p>
              <p className="text-[11px] mt-1 opacity-75">
                {data.sequence.converted} ont converti
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Per-step funnel */}
      <Card className="border-2 border-border shadow-[4px_4px_0px_0px_#1a1a1a] mb-4">
        <CardContent className="pt-6">
          <p className="text-xs font-bold uppercase tracking-wider mb-3">
            Funnel par étape
          </p>
          {data.perStep.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Pas encore d&apos;envois. Le premier mail part J+1 après inscription.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left font-black text-xs py-2">Étape</th>
                    <th className="text-right font-black text-xs py-2">Envoyés</th>
                    <th className="text-right font-black text-xs py-2">Ouverts</th>
                    <th className="text-right font-black text-xs py-2">Cliqués</th>
                    <th className="text-right font-black text-xs py-2">
                      Convertis
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.perStep.map((p) => {
                    const openRate =
                      p.sent > 0 ? Math.round((p.opened / p.sent) * 100) : 0;
                    const clickRate =
                      p.sent > 0 ? Math.round((p.clicked / p.sent) * 100) : 0;
                    const convRate =
                      p.sent > 0 ? Math.round((p.converted / p.sent) * 100) : 0;
                    return (
                      <tr key={p.step} className="border-b border-border/50">
                        <td className="py-2 font-bold">Étape {p.step}</td>
                        <td className="py-2 text-right font-mono">{p.sent}</td>
                        <td className="py-2 text-right font-mono">
                          {p.opened}{" "}
                          <span className="text-muted-foreground">
                            ({openRate}%)
                          </span>
                        </td>
                        <td className="py-2 text-right font-mono">
                          {p.clicked}{" "}
                          <span className="text-muted-foreground">
                            ({clickRate}%)
                          </span>
                        </td>
                        <td className="py-2 text-right font-mono">
                          {p.converted}{" "}
                          <span className="text-muted-foreground">
                            ({convRate}%)
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 90-day signups vs conversions chart */}
      <Card className="border-2 border-border shadow-[4px_4px_0px_0px_#1a1a1a]">
        <CardContent className="pt-6">
          <p className="text-xs font-bold uppercase tracking-wider mb-3">
            Signups vs conversions (90 derniers jours)
          </p>
          <SparkChart points={data.chart} />
          <div className="flex gap-4 text-xs mt-3">
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-sm bg-[#1a1a1a]" />
              Signups
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-sm bg-[#c8f76f]" />
              Conversions
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SparkChart({
  points,
}: {
  points: Array<{ date: string; signups: number; conversions: number }>;
}) {
  if (points.length === 0)
    return <p className="text-sm text-muted-foreground">Aucune donnée</p>;

  // Aggregate to weekly buckets so the chart isn't too noisy.
  const weeks: Array<{ label: string; signups: number; conversions: number }> = [];
  let bucket = { label: "", signups: 0, conversions: 0 };
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (i % 7 === 0 && i > 0) {
      weeks.push(bucket);
      bucket = { label: "", signups: 0, conversions: 0 };
    }
    if (i % 7 === 0) bucket.label = p.date;
    bucket.signups += p.signups;
    bucket.conversions += p.conversions;
  }
  weeks.push(bucket);

  const max = Math.max(1, ...weeks.map((w) => Math.max(w.signups, w.conversions)));

  const width = 720;
  const height = 160;
  const barW = Math.max(2, Math.floor((width - 40) / weeks.length / 2 - 2));
  const groupW = barW * 2 + 4;

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        preserveAspectRatio="none"
      >
        <line
          x1="20"
          y1={height - 24}
          x2={width - 10}
          y2={height - 24}
          stroke="#1a1a1a"
          strokeWidth="1.5"
        />
        {weeks.map((w, i) => {
          const x = 24 + i * (groupW + 4);
          const baseY = height - 24;
          const sH = (w.signups / max) * (height - 40);
          const cH = (w.conversions / max) * (height - 40);
          return (
            <g key={w.label || i}>
              <rect
                x={x}
                y={baseY - sH}
                width={barW}
                height={sH}
                fill="#1a1a1a"
                stroke="#1a1a1a"
                strokeWidth="1"
              />
              <rect
                x={x + barW + 2}
                y={baseY - cH}
                width={barW}
                height={cH}
                fill="#c8f76f"
                stroke="#1a1a1a"
                strokeWidth="1"
              />
              {i % 4 === 0 && w.label && (
                <text
                  x={x + groupW / 2}
                  y={height - 8}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#777"
                >
                  {new Date(w.label).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
