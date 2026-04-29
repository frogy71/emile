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
  AlertTriangle,
  CheckCircle,
  Trash2,
} from "lucide-react";

interface Settings {
  autoPublish: boolean;
  cronSchedule: string;
  blacklist: { id: string; title: string; funder: string | null; deadline: string | null }[];
  indexNowKey: "configured" | "missing";
  blogAlertEmail: string;
}

export default function AdminBlogSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [grantId, setGrantId] = useState("");
  const [error, setError] = useState<string | null>(null);

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
    const res = await fetch("/api/admin/blog/settings", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Échec du chargement");
      setLoading(false);
      return;
    }
    const data = (await res.json()) as Settings;
    setSettings(data);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function addToBlacklist() {
    if (!grantId.trim()) return;
    const token = await getToken();
    if (!token) return;
    await fetch("/api/admin/blog/settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ blacklistAdd: grantId.trim() }),
    });
    setGrantId("");
    void load();
  }

  async function removeFromBlacklist(id: string) {
    const token = await getToken();
    if (!token) return;
    await fetch("/api/admin/blog/settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ blacklistRemove: id }),
    });
    void load();
  }

  if (loading) return <p className="p-8 text-muted-foreground">Chargement…</p>;
  if (!settings) return <p className="p-8 text-destructive">{error}</p>;

  return (
    <div className="space-y-8 p-6 md:p-10">
      <header className="space-y-2">
        <Link
          href="/admin/blog"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Retour blog
        </Link>
        <h1 className="text-3xl font-black tracking-tight">Paramètres</h1>
        <p className="text-muted-foreground">
          Configuration de l&apos;engine. Les valeurs marquées <code>env</code>{" "}
          sont contrôlées par les variables d&apos;environnement et nécessitent
          un redéploiement pour être modifiées.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="space-y-3 p-6">
            <h2 className="font-bold">Publication automatique</h2>
            <Badge variant={settings.autoPublish ? "default" : "secondary"}>
              {settings.autoPublish ? "Activée" : "Désactivée (mode brouillon)"}
            </Badge>
            <p className="text-xs text-muted-foreground">
              Variable d&apos;env <code>BLOG_AUTO_PUBLISH</code>. Quand
              désactivé, le cron écrit les articles en brouillon et un admin
              doit les publier manuellement.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-6">
            <h2 className="font-bold">Planning</h2>
            <p className="text-sm">
              Cron : <code>{settings.cronSchedule}</code>{" "}
              <span className="text-muted-foreground">(UTC, vercel.json)</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Modifier le créneau nécessite d&apos;éditer{" "}
              <code>vercel.json</code> et de redéployer.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-6">
            <h2 className="font-bold">IndexNow</h2>
            <Badge
              variant={
                settings.indexNowKey === "configured" ? "default" : "secondary"
              }
            >
              Clé {settings.indexNowKey}
            </Badge>
            <p className="text-xs text-muted-foreground">
              Si la clé est manquante, le ping IndexNow est sauté. Définir{" "}
              <code>INDEXNOW_KEY</code> en env pour l&apos;activer.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-6">
            <h2 className="font-bold">Alertes pool</h2>
            <p className="text-sm">{settings.blogAlertEmail}</p>
            <p className="text-xs text-muted-foreground">
              Email destinataire quand le pool de subventions disponibles passe
              sous 14. Variable d&apos;env <code>BLOG_ALERT_EMAIL</code>.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div>
            <h2 className="font-bold">Liste noire de subventions</h2>
            <p className="text-xs text-muted-foreground">
              Subventions qui ne seront jamais sélectionnées par le selector.
              Utile pour les appels qui ne se prêtent pas au format blog
              (financement permanent, contenu sensible, etc.).
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              value={grantId}
              onChange={(e) => setGrantId(e.target.value)}
              placeholder="UUID de la subvention…"
              className="max-w-md"
            />
            <Button onClick={addToBlacklist} disabled={!grantId.trim()}>
              Ajouter
            </Button>
          </div>
          {settings.blacklist.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              <CheckCircle className="inline h-3 w-3 mr-1" />
              Aucune subvention sur la liste noire.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {settings.blacklist.map((g) => (
                <li
                  key={g.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-border p-2"
                >
                  <span>
                    <strong>{g.title}</strong>
                    <span className="text-xs text-muted-foreground">
                      {" "}
                      — {g.funder || "—"}
                    </span>
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFromBlacklist(g.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border-2 border-destructive bg-destructive/10 p-3 text-sm">
          <AlertTriangle className="h-4 w-4" /> {error}
        </div>
      )}
    </div>
  );
}
