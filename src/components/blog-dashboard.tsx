"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Eye,
  MousePointerClick,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";

interface BlogPostRow {
  id: string;
  slug: string;
  title: string;
  status: string;
  view_count: number;
  cta_clicks: number;
  thematic_tag: string | null;
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

export function BlogDashboard() {
  const [posts, setPosts] = useState<BlogPostRow[]>([]);
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      const res = await fetch("/api/admin/blog?status=published", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || `HTTP ${res.status}`);
        return;
      }
      const body = await res.json();
      setKpis(body.kpis || null);
      setPosts((body.posts || []).slice(0, 5));
    }
    void load();
  }, []);

  if (error) {
    return (
      <div className="rounded-2xl border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_#1a1a1a] mb-8">
        <p className="flex items-center gap-2 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" /> Blog dashboard: {error}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_#1a1a1a] mb-8">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <h3 className="text-lg font-black tracking-tight">Blog — Grant du Jour</h3>
          {kpis && kpis.writablePool < 14 && (
            <Badge variant="destructive">
              Pool {kpis.writablePool}
            </Badge>
          )}
        </div>
        <Link
          href="/admin/blog"
          className="flex items-center gap-1 text-sm font-semibold hover:underline"
        >
          Ouvrir <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {kpis ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <Tile label="Publiés" value={kpis.published} />
          <Tile label="Brouillons" value={kpis.drafts} />
          <Tile
            label="Vues totales"
            value={kpis.totalViews.toLocaleString("fr-FR")}
            icon={<Eye className="h-3 w-3" />}
          />
          <Tile
            label="CTR"
            value={`${(kpis.ctr * 100).toFixed(2)}%`}
            sub={`${kpis.totalClicks} clics`}
            icon={<MousePointerClick className="h-3 w-3" />}
          />
          <Tile
            label="Pool"
            value={kpis.writablePool}
            warn={kpis.writablePool < 14}
          />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      )}

      {posts.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Top vues récents
          </p>
          <ul className="space-y-1">
            {[...posts]
              .sort((a, b) => b.view_count - a.view_count)
              .slice(0, 5)
              .map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-border p-2 text-sm"
                >
                  <Link
                    href={`/blog/${p.slug}`}
                    target="_blank"
                    className="line-clamp-1 hover:underline"
                  >
                    {p.title}
                  </Link>
                  <span className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      <Eye className="inline h-3 w-3" /> {p.view_count}
                    </span>
                    <span>
                      <MousePointerClick className="inline h-3 w-3" />{" "}
                      {p.cta_clicks}
                    </span>
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Tile({
  label,
  value,
  sub,
  icon,
  warn,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  warn?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border-2 p-3 ${warn ? "border-destructive bg-destructive/10" : "border-border bg-background"}`}
    >
      <p className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-xl font-black">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
