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
  FileText,
  RefreshCw,
  Sparkles,
  Eye,
  AlertTriangle,
  CheckCircle,
  Edit2,
  Trash2,
  Settings,
  MousePointerClick,
} from "lucide-react";

interface BlogPostRow {
  id: string;
  slug: string;
  title: string;
  status: "draft" | "published" | "scheduled";
  thematic_tag: string | null;
  view_count: number;
  cta_clicks: number;
  word_count: number | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  cover_image_url: string | null;
}

interface Kpis {
  total: number;
  drafts: number;
  published: number;
  totalViews: number;
  totalClicks: number;
  ctr: number;
  writablePool: number;
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  published: "Publié",
  scheduled: "Planifié",
};

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPostRow[]>([]);
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generateMessage, setGenerateMessage] = useState<string | null>(null);

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
    const params = new URLSearchParams({ status: statusFilter });
    if (search) params.set("q", search);
    const res = await fetch(`/api/admin/blog?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Échec du chargement");
      setLoading(false);
      return;
    }
    const json = await res.json();
    setPosts(json.posts || []);
    setKpis(json.kpis || null);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function generateNow(autoPublish: boolean) {
    setGenerating(true);
    setGenerateMessage(null);
    const token = await getToken();
    if (!token) {
      setGenerateMessage("Non authentifié");
      setGenerating(false);
      return;
    }
    const res = await fetch("/api/admin/blog/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ autoPublish }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.ok) {
      setGenerateMessage(body.error || "Échec de la génération");
    } else {
      setGenerateMessage(
        `Article ${body.status === "published" ? "publié" : "créé en brouillon"} : ${body.title}`
      );
      void load();
    }
    setGenerating(false);
  }

  async function deletePost(id: string) {
    if (!confirm("Supprimer cet article définitivement ?")) return;
    const token = await getToken();
    if (!token) return;
    const res = await fetch(`/api/admin/blog/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      alert(body.error || "Échec de la suppression");
      return;
    }
    void load();
  }

  async function togglePublish(post: BlogPostRow) {
    const token = await getToken();
    if (!token) return;
    const newStatus = post.status === "published" ? "draft" : "published";
    const res = await fetch(`/api/admin/blog/${post.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      alert(body.error || "Échec");
      return;
    }
    void load();
  }

  return (
    <div className="space-y-8 p-6 md:p-10">
      <header className="space-y-3">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Retour admin
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Blog</h1>
            <p className="text-muted-foreground">
              Pipeline du Grant du Jour : génération, statut, performance.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/blog/cta-template">
              <Button variant="ghost" size="sm">
                <Sparkles className="mr-1 h-4 w-4" />
                Template CTA
              </Button>
            </Link>
            <Link href="/admin/blog/settings">
              <Button variant="ghost" size="sm">
                <Settings className="mr-1 h-4 w-4" />
                Paramètres
              </Button>
            </Link>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => generateNow(false)}
              disabled={generating}
            >
              <FileText className="mr-1 h-4 w-4" />
              Générer (brouillon)
            </Button>
            <Button
              size="sm"
              variant="accent"
              onClick={() => generateNow(true)}
              disabled={generating}
            >
              {generating ? (
                <RefreshCw className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-1 h-4 w-4" />
              )}
              Publier maintenant
            </Button>
          </div>
        </div>
        {generateMessage && (
          <div className="rounded-lg border-2 border-border bg-muted/30 px-4 py-2 text-sm">
            {generateMessage}
          </div>
        )}
      </header>

      {kpis && (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <KpiTile label="Articles" value={kpis.total.toString()} />
          <KpiTile label="Publiés" value={kpis.published.toString()} />
          <KpiTile label="Brouillons" value={kpis.drafts.toString()} />
          <KpiTile label="Vues totales" value={kpis.totalViews.toLocaleString("fr-FR")} />
          <KpiTile
            label="CTR"
            value={`${(kpis.ctr * 100).toFixed(2)}%`}
            sub={`${kpis.totalClicks} clics`}
          />
          <KpiTile
            label="Pool restant"
            value={kpis.writablePool.toString()}
            warn={kpis.writablePool < 14}
            sub="grants éligibles"
          />
        </div>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1">
              {(["all", "draft", "published", "scheduled"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
                    statusFilter === s
                      ? "bg-foreground text-background"
                      : "bg-muted hover:bg-muted/70"
                  }`}
                >
                  {s === "all" ? "Tous" : STATUS_LABELS[s]}
                </button>
              ))}
            </div>
            <div className="flex flex-1 gap-2">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Recherche par titre / slug…"
                className="max-w-md"
                onKeyDown={(e) => {
                  if (e.key === "Enter") void load();
                }}
              />
              <Button size="sm" variant="outline" onClick={() => void load()}>
                Rechercher
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border-2 border-destructive bg-destructive/10 p-3 text-sm">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground">Chargement…</p>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            Aucun article {statusFilter !== "all" ? "à ce statut" : ""}.
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-2xl border-2 border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="p-3 text-left">Titre</th>
                <th className="p-3 text-left">Statut</th>
                <th className="p-3 text-left">Thème</th>
                <th className="p-3 text-right">Mots</th>
                <th className="p-3 text-right">Vues</th>
                <th className="p-3 text-right">Clics</th>
                <th className="p-3 text-left">Publié le</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="p-3">
                    <p className="font-bold">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{p.slug}</p>
                  </td>
                  <td className="p-3">
                    <Badge
                      variant={
                        p.status === "published" ? "default" : "secondary"
                      }
                    >
                      {STATUS_LABELS[p.status] || p.status}
                    </Badge>
                  </td>
                  <td className="p-3 text-xs">
                    {p.thematic_tag || "—"}
                  </td>
                  <td className="p-3 text-right">{p.word_count ?? "—"}</td>
                  <td className="p-3 text-right">{p.view_count}</td>
                  <td className="p-3 text-right">
                    <span className="inline-flex items-center gap-1">
                      <MousePointerClick className="h-3 w-3" />
                      {p.cta_clicks}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {p.published_at
                      ? new Date(p.published_at).toLocaleDateString("fr-FR")
                      : "—"}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      {p.status === "published" && (
                        <Link href={`/blog/${p.slug}`} target="_blank">
                          <Button size="sm" variant="ghost">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </Link>
                      )}
                      <Link href={`/admin/blog/${p.id}/edit`}>
                        <Button size="sm" variant="ghost">
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => togglePublish(p)}
                        title={
                          p.status === "published" ? "Dépublier" : "Publier"
                        }
                      >
                        {p.status === "published" ? "↓" : "↑"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deletePost(p.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function KpiTile({
  label,
  value,
  sub,
  warn,
}: {
  label: string;
  value: string;
  sub?: string;
  warn?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border-2 p-4 ${
        warn ? "border-destructive bg-destructive/10" : "border-border bg-card"
      }`}
    >
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black">{value}</p>
      {sub && (
        <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
          {warn && <AlertTriangle className="h-3 w-3" />}
          {!warn && <CheckCircle className="h-3 w-3 text-muted-foreground" />}
          {sub}
        </p>
      )}
    </div>
  );
}
