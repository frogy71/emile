"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  RefreshCw,
  Users,
  AlertTriangle,
  Search,
  RotateCw,
  XCircle,
} from "lucide-react";

interface UserRow {
  userId: string;
  email: string | null;
  signupDate: string | null;
  organizationId: string | null;
  organizationName: string | null;
  plan: string;
  planStatus: string;
  currentStep: number;
  nextStep: number | null;
  nextScheduledAt: string | null;
  sentCount: number;
  openedCount: number;
  clickedCount: number;
  pendingCount: number;
  skippedCount: number;
  failedCount: number;
  totalSteps: number;
  openRate: number;
}

export default function EmailSequenceUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [actionUser, setActionUser] = useState<string | null>(null);

  async function getToken() {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }

  async function load() {
    setLoading(true);
    setError(null);
    const token = await getToken();
    if (!token) {
      setError("Non authentifié");
      setLoading(false);
      return;
    }
    const res = await fetch("/api/admin/email-sequences/users", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || `HTTP ${res.status}`);
      setLoading(false);
      return;
    }
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function userAction(userId: string, action: "remove" | "restart") {
    if (
      action === "remove" &&
      !confirm("Retirer cet utilisateur de la séquence ?")
    )
      return;
    if (
      action === "restart" &&
      !confirm("Relancer la séquence depuis le début pour cet utilisateur ?")
    )
      return;
    setActionUser(userId);
    const token = await getToken();
    if (!token) return;
    const res = await fetch(`/api/admin/email-sequences/users/${userId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action }),
    });
    setActionUser(null);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      alert(`Erreur: ${body.error || res.status}`);
      return;
    }
    await load();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-red-500" />
          <p className="text-red-600 font-bold">{error}</p>
          <Button variant="accent" className="mt-4" onClick={load}>
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  const filtered = filter
    ? users.filter((u) => {
        const q = filter.toLowerCase();
        return (
          (u.email || "").toLowerCase().includes(q) ||
          (u.organizationName || "").toLowerCase().includes(q)
        );
      })
    : users;

  const inSequence = users.filter((u) => u.pendingCount > 0).length;
  const completed = users.filter((u) => u.pendingCount === 0).length;
  const converted = users.filter(
    (u) => u.planStatus === "active" && u.plan !== "free"
  ).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Link href="/admin/email-sequences">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-black">Utilisateurs en séquence</h1>
          <Badge variant="purple">
            <Users className="h-3 w-3 mr-1" />
            {users.length}
          </Badge>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="h-4 w-4" /> Recharger
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-3 mb-6">
        <Card className="border-2 border-border shadow-[4px_4px_0px_0px_#1a1a1a]">
          <CardContent className="pt-6">
            <p className="text-3xl font-black">{inSequence}</p>
            <p className="text-xs font-bold text-muted-foreground">En séquence</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-border shadow-[4px_4px_0px_0px_#1a1a1a]">
          <CardContent className="pt-6">
            <p className="text-3xl font-black">{completed}</p>
            <p className="text-xs font-bold text-muted-foreground">
              Terminés (sans conversion)
            </p>
          </CardContent>
        </Card>
        <Card className="border-2 border-border shadow-[4px_4px_0px_0px_#1a1a1a]">
          <CardContent className="pt-6">
            <p className="text-3xl font-black">{converted}</p>
            <p className="text-xs font-bold text-muted-foreground">Convertis Pro/Expert</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Filtrer par email ou nom d'organisation…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <div className="rounded-2xl border-2 border-border bg-card shadow-[4px_4px_0px_0px_#1a1a1a] overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-muted">
            <tr>
              <th className="px-3 py-2 text-left font-black text-xs">Email / Org</th>
              <th className="px-3 py-2 text-left font-black text-xs">Plan</th>
              <th className="px-3 py-2 text-center font-black text-xs">Étape</th>
              <th className="px-3 py-2 text-left font-black text-xs">Prochain envoi</th>
              <th className="px-3 py-2 text-right font-black text-xs">Envoyés</th>
              <th className="px-3 py-2 text-right font-black text-xs">Open rate</th>
              <th className="px-3 py-2 text-right font-black text-xs">Cliqués</th>
              <th className="px-3 py-2 text-right font-black text-xs">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-6 text-center text-muted-foreground"
                >
                  Aucun utilisateur ne matche.
                </td>
              </tr>
            ) : (
              filtered.map((u) => {
                const planLabel =
                  u.planStatus === "active" && u.plan !== "free"
                    ? u.plan
                    : "free";
                return (
                  <tr key={u.userId} className="border-t border-border">
                    <td className="px-3 py-2">
                      <div className="font-bold truncate max-w-xs">
                        {u.email || "(email inconnu)"}
                      </div>
                      <div className="text-xs text-muted-foreground truncate max-w-xs">
                        {u.organizationName || "(sans organisation)"}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <Badge
                        variant={
                          planLabel === "free"
                            ? "yellow"
                            : planLabel === "expert"
                            ? "purple"
                            : "green"
                        }
                      >
                        {planLabel}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className="font-mono">
                        {u.currentStep} / {u.totalSteps}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {u.nextStep
                        ? `Étape ${u.nextStep} — ${u.nextScheduledAt ? new Date(u.nextScheduledAt).toLocaleDateString("fr-FR") : "—"}`
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {u.sentCount}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {u.openRate}%
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {u.clickedCount}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-1">
                        {u.pendingCount > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={actionUser === u.userId}
                            onClick={() => userAction(u.userId, "remove")}
                            title="Retirer de la séquence"
                          >
                            <XCircle className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={actionUser === u.userId}
                          onClick={() => userAction(u.userId, "restart")}
                          title="Relancer la séquence"
                        >
                          <RotateCw className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
