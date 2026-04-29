"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Save,
  Eye,
  AlertTriangle,
  CheckCircle,
  Search,
} from "lucide-react";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  meta_title: string | null;
  meta_description: string | null;
  body_html: string;
  cta_block: string | null;
  cover_image_url: string | null;
  thematic_tag: string | null;
  keywords: string[] | null;
  status: "draft" | "published" | "scheduled";
  published_at: string | null;
  word_count: number | null;
  view_count: number;
  cta_clicks: number;
}

const META_TITLE_MAX = 60;
const META_DESC_MAX = 158;

export default function AdminBlogEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  async function getToken() {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }

  useEffect(() => {
    async function load() {
      const token = await getToken();
      if (!token) {
        setError("Non authentifié");
        setLoading(false);
        return;
      }
      const res = await fetch(`/api/admin/blog/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Échec du chargement");
        setLoading(false);
        return;
      }
      const data = (await res.json()) as BlogPost;
      setPost(data);
      setLoading(false);
    }
    void load();
  }, [id]);

  async function save(extraUpdates: Partial<BlogPost> = {}) {
    if (!post) return;
    setSaving(true);
    setError(null);
    const token = await getToken();
    if (!token) {
      setError("Non authentifié");
      setSaving(false);
      return;
    }
    const payload = {
      title: post.title,
      slug: post.slug,
      meta_title: post.meta_title,
      meta_description: post.meta_description,
      body_html: post.body_html,
      cta_block: post.cta_block,
      cover_image_url: post.cover_image_url,
      thematic_tag: post.thematic_tag,
      keywords: post.keywords,
      status: post.status,
      ...extraUpdates,
    };
    const res = await fetch(`/api/admin/blog/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Échec de la sauvegarde");
      setSaving(false);
      return;
    }
    const data = (await res.json()) as BlogPost;
    setPost(data);
    setSavedAt(new Date().toLocaleTimeString("fr-FR"));
    setSaving(false);
  }

  if (loading) {
    return <p className="p-8 text-muted-foreground">Chargement…</p>;
  }
  if (error && !post) {
    return (
      <div className="p-8">
        <Link
          href="/admin/blog"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>
        <p className="mt-4 text-destructive">{error}</p>
      </div>
    );
  }
  if (!post) return null;

  const metaTitleLen = (post.meta_title || "").length;
  const metaDescLen = (post.meta_description || "").length;

  return (
    <div className="space-y-6 p-6 md:p-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/admin/blog"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Retour à la liste
          </Link>
          <h1 className="text-2xl font-black tracking-tight">Édition</h1>
          <p className="text-xs text-muted-foreground">
            {post.view_count} vues · {post.cta_clicks} clics CTA ·{" "}
            {post.word_count ?? 0} mots
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={post.status === "published" ? "default" : "secondary"}>
            {post.status}
          </Badge>
          {savedAt && (
            <span className="text-xs text-muted-foreground">
              <CheckCircle className="inline h-3 w-3 mr-1" />
              Sauvegardé à {savedAt}
            </span>
          )}
          {post.status === "published" && (
            <Link href={`/blog/${post.slug}`} target="_blank">
              <Button size="sm" variant="ghost">
                <Eye className="mr-1 h-4 w-4" /> Voir
              </Button>
            </Link>
          )}
          {post.status === "draft" ? (
            <Button
              size="sm"
              variant="accent"
              onClick={() => save({ status: "published" })}
              disabled={saving}
            >
              Publier
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => save({ status: "draft" })}
              disabled={saving}
            >
              Dépublier
            </Button>
          )}
          <Button size="sm" variant="default" onClick={() => save()} disabled={saving}>
            <Save className="mr-1 h-4 w-4" />
            Sauvegarder
          </Button>
        </div>
      </header>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border-2 border-destructive bg-destructive/10 p-3 text-sm">
          <AlertTriangle className="h-4 w-4" /> {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4 p-6">
              <Field label="Titre">
                <Input
                  value={post.title}
                  onChange={(e) => setPost({ ...post, title: e.target.value })}
                />
              </Field>
              <Field label="Slug">
                <Input
                  value={post.slug}
                  onChange={(e) => setPost({ ...post, slug: e.target.value })}
                />
              </Field>
              <Field label="Thème">
                <Input
                  value={post.thematic_tag || ""}
                  onChange={(e) =>
                    setPost({ ...post, thematic_tag: e.target.value })
                  }
                />
              </Field>
              <Field label="Cover image URL">
                <Input
                  value={post.cover_image_url || ""}
                  onChange={(e) =>
                    setPost({ ...post, cover_image_url: e.target.value })
                  }
                />
              </Field>
              <Field label="Mots-clés (séparés par des virgules)">
                <Input
                  value={(post.keywords || []).join(", ")}
                  onChange={(e) =>
                    setPost({
                      ...post,
                      keywords: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-6">
              <h2 className="font-bold">SEO</h2>
              <Field
                label={`Meta title (${metaTitleLen}/${META_TITLE_MAX})`}
                warn={metaTitleLen > META_TITLE_MAX}
              >
                <Input
                  value={post.meta_title || ""}
                  onChange={(e) =>
                    setPost({ ...post, meta_title: e.target.value })
                  }
                />
              </Field>
              <Field
                label={`Meta description (${metaDescLen}/${META_DESC_MAX})`}
                warn={metaDescLen > META_DESC_MAX}
              >
                <textarea
                  value={post.meta_description || ""}
                  onChange={(e) =>
                    setPost({ ...post, meta_description: e.target.value })
                  }
                  rows={3}
                  className="w-full rounded-md border-2 border-border bg-background p-2 text-sm"
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-2 p-6">
              <h2 className="font-bold">Corps de l&apos;article (HTML)</h2>
              <p className="text-xs text-muted-foreground">
                Tags autorisés : h2, h3, p, ul, li, table, strong, em. Le bloc
                CTA est rendu séparément ci-dessous et concaténé à la
                publication.
              </p>
              <textarea
                value={post.body_html}
                onChange={(e) =>
                  setPost({ ...post, body_html: e.target.value })
                }
                rows={28}
                className="w-full rounded-md border-2 border-border bg-background p-3 font-mono text-xs"
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-2 p-6">
              <h2 className="font-bold">Bloc CTA (HTML)</h2>
              <textarea
                value={post.cta_block || ""}
                onChange={(e) =>
                  setPost({ ...post, cta_block: e.target.value })
                }
                rows={8}
                className="w-full rounded-md border-2 border-border bg-background p-3 font-mono text-xs"
              />
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardContent className="space-y-3 p-6">
              <h2 className="flex items-center gap-2 font-bold">
                <Search className="h-4 w-4" /> Aperçu Google
              </h2>
              <div className="rounded-md border border-border bg-white p-3">
                <p className="truncate text-xs text-emerald-700">
                  emile.so &gt; blog &gt; {post.slug}
                </p>
                <p className="mt-1 text-base text-blue-700 hover:underline cursor-pointer">
                  {post.meta_title || post.title}
                </p>
                <p className="mt-1 line-clamp-3 text-xs text-gray-700">
                  {post.meta_description || "—"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-6">
              <h2 className="font-bold">Aperçu rendu</h2>
              <div
                className="emile-blog-article max-h-[500px] overflow-auto rounded-md border-2 border-border bg-card p-4 text-sm"
                dangerouslySetInnerHTML={{
                  __html: post.body_html + (post.cta_block || ""),
                }}
              />
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Field({
  label,
  warn,
  children,
}: {
  label: string;
  warn?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span
        className={`text-xs font-semibold ${warn ? "text-destructive" : "text-muted-foreground"}`}
      >
        {label}
      </span>
      {children}
    </label>
  );
}
