"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Save,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";

interface CtaTemplate {
  id: string;
  title_template: string;
  body_text: string;
  cta_button_label: string;
  logframe_embed_url: string | null;
  reassurance_line: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminCtaTemplatePage() {
  const [templates, setTemplates] = useState<CtaTemplate[]>([]);
  const [editing, setEditing] = useState<CtaTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function getToken() {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }

  async function load() {
    setLoading(true);
    const token = await getToken();
    if (!token) {
      setError("Non authentifié");
      setLoading(false);
      return;
    }
    const res = await fetch("/api/admin/blog/cta-template", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Échec du chargement");
      setLoading(false);
      return;
    }
    const json = await res.json();
    setTemplates(json.templates || []);
    const active =
      (json.templates as CtaTemplate[]).find((t) => t.is_active) ||
      (json.templates as CtaTemplate[])[0] ||
      null;
    setEditing(active ? { ...active } : null);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function save() {
    if (!editing) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    const token = await getToken();
    if (!token) {
      setSaving(false);
      return;
    }
    const res = await fetch("/api/admin/blog/cta-template", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        id: editing.id,
        title_template: editing.title_template,
        body_text: editing.body_text,
        cta_button_label: editing.cta_button_label,
        logframe_embed_url: editing.logframe_embed_url,
        reassurance_line: editing.reassurance_line,
        is_active: editing.is_active,
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Échec de la sauvegarde");
    } else {
      setMessage("Template sauvegardé");
      void load();
    }
    setSaving(false);
  }

  async function applyToAll() {
    if (
      !confirm(
        "Re-générer le bloc CTA sur tous les articles publiés ? Les blocs existants seront remplacés."
      )
    )
      return;
    setApplying(true);
    setMessage(null);
    setError(null);
    const token = await getToken();
    if (!token) {
      setApplying(false);
      return;
    }
    const res = await fetch("/api/admin/blog/cta-template", {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Échec de l'application");
    } else {
      const body = await res.json();
      setMessage(`Bloc CTA re-rendu sur ${body.updated} article(s).`);
    }
    setApplying(false);
  }

  if (loading) return <p className="p-8 text-muted-foreground">Chargement…</p>;

  const previewTitle = (editing?.title_template || "").replace(
    /\{\{\s*thematic_tag\s*\}\}/g,
    "transition écologique"
  );

  return (
    <div className="space-y-8 p-6 md:p-10">
      <header className="space-y-2">
        <Link
          href="/admin/blog"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Retour blog
        </Link>
        <h1 className="text-3xl font-black tracking-tight">Template CTA</h1>
        <p className="text-muted-foreground">
          Le bloc qui clôt chaque article. Le titre est contextualisé via Haiku
          au moment de la publication, à partir du <code>{`{{thematic_tag}}`}</code>.
        </p>
      </header>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border-2 border-destructive bg-destructive/10 p-3 text-sm">
          <AlertTriangle className="h-4 w-4" /> {error}
        </div>
      )}
      {message && (
        <div className="flex items-center gap-2 rounded-lg border-2 border-border bg-muted/30 p-3 text-sm">
          <CheckCircle className="h-4 w-4" /> {message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <Card>
          <CardContent className="space-y-4 p-6">
            {editing ? (
              <>
                <Field label="Titre (gabarit, accepte {{thematic_tag}})">
                  <Input
                    value={editing.title_template}
                    onChange={(e) =>
                      setEditing({ ...editing, title_template: e.target.value })
                    }
                  />
                </Field>
                <Field label="Corps">
                  <textarea
                    value={editing.body_text}
                    onChange={(e) =>
                      setEditing({ ...editing, body_text: e.target.value })
                    }
                    rows={4}
                    className="w-full rounded-md border-2 border-border bg-background p-2 text-sm"
                  />
                </Field>
                <Field label="Label du bouton">
                  <Input
                    value={editing.cta_button_label}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        cta_button_label: e.target.value,
                      })
                    }
                  />
                </Field>
                <Field label="URL du formulaire intégré (logframe)">
                  <Input
                    value={editing.logframe_embed_url || ""}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        logframe_embed_url: e.target.value,
                      })
                    }
                    placeholder="https://emile.so/embed/quick-start"
                  />
                </Field>
                <Field label="Ligne de réassurance">
                  <Input
                    value={editing.reassurance_line}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        reassurance_line: e.target.value,
                      })
                    }
                  />
                </Field>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editing.is_active}
                    onChange={(e) =>
                      setEditing({ ...editing, is_active: e.target.checked })
                    }
                  />
                  Template actif (utilisé par le cron)
                </label>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button onClick={save} disabled={saving} variant="default">
                    <Save className="mr-1 h-4 w-4" />
                    {saving ? "Sauvegarde…" : "Sauvegarder"}
                  </Button>
                  <Button
                    onClick={applyToAll}
                    disabled={applying}
                    variant="accent"
                  >
                    {applying ? (
                      <RefreshCw className="mr-1 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-1 h-4 w-4" />
                    )}
                    Appliquer à tous les articles publiés
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">
                Aucun template — créez-en un en remplissant les champs et en
                cliquant sur Sauvegarder.
              </p>
            )}
          </CardContent>
        </Card>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardContent className="space-y-3 p-6">
              <h2 className="font-bold">Aperçu rendu</h2>
              <div className="emile-blog-article">
                <section className="emile-cta-block">
                  <h2 className="emile-cta-title">{previewTitle || "—"}</h2>
                  <p className="emile-cta-body">
                    {editing?.body_text || "—"}
                  </p>
                  <p className="emile-cta-actions">
                    <span className="emile-cta-button">
                      {editing?.cta_button_label || "—"}
                    </span>
                  </p>
                  <p className="emile-cta-reassurance">
                    {editing?.reassurance_line || "—"}
                  </p>
                </section>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-6">
              <h2 className="font-bold">Tous les templates</h2>
              <ul className="space-y-2 text-sm">
                {templates.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-border p-2"
                  >
                    <span className="line-clamp-1">{t.title_template}</span>
                    {t.is_active && <Badge>actif</Badge>}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-semibold text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
