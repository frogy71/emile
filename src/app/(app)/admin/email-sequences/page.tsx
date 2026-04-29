"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Mail,
  Edit2,
  Send,
  Save,
  RefreshCw,
  Eye,
  Smartphone,
  Monitor,
  Users,
  ArrowLeft,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

interface Template {
  id: string;
  step_number: number;
  delay_days: number;
  subject: string;
  body_html: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface Stats {
  total: number;
  sent: number;
  opened: number;
  clicked: number;
  failed: number;
  skipped: number;
  unsubscribed: number;
  pending: number;
}

export default function EmailSequencesAdminPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [stats, setStats] = useState<Record<number, Stats>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Template | null>(null);
  const [previewWidth, setPreviewWidth] = useState<"desktop" | "mobile">("desktop");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

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
    const res = await fetch("/api/admin/email-sequences", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || `HTTP ${res.status}`);
      setLoading(false);
      return;
    }
    const data = await res.json();
    setTemplates(data.templates);
    setStats(data.stats || {});
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveTemplate(t: Template) {
    setSavingId(t.id);
    const token = await getToken();
    if (!token) return;
    const res = await fetch(`/api/admin/email-sequences/${t.id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subject: t.subject,
        body_html: t.body_html,
        delay_days: t.delay_days,
        active: t.active,
      }),
    });
    setSavingId(null);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      alert(`Erreur: ${body.error || res.status}`);
      return;
    }
    await load();
    setEditing(null);
  }

  async function toggleActive(t: Template) {
    const token = await getToken();
    if (!token) return;
    await fetch(`/api/admin/email-sequences/${t.id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ active: !t.active }),
    });
    await load();
  }

  async function sendTest(template: Template) {
    setTestStatus(null);
    const token = await getToken();
    if (!token) return;
    const res = await fetch("/api/admin/email-sequences/test-send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        templateId: template.id,
        to: testEmail || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setTestStatus(`❌ ${data.error || res.status}`);
    } else {
      setTestStatus(`✓ Envoyé à ${data.sent_to}`);
    }
  }

  async function reseed(force: boolean) {
    if (
      force &&
      !confirm(
        "Réinitialiser TOUS les emails depuis les templates par défaut ? Cela écrase vos modifications."
      )
    )
      return;
    setSeeding(true);
    const token = await getToken();
    if (!token) return;
    const res = await fetch("/api/admin/email-sequences/seed", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ force }),
    });
    setSeeding(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(`Erreur: ${data.error || res.status}`);
      return;
    }
    alert(
      `OK — ${data.inserted} insérés, ${data.updated} mis à jour, ${data.preserved} préservés.`
    );
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

  if (editing) {
    return (
      <EditorView
        template={editing}
        previewWidth={previewWidth}
        setPreviewWidth={setPreviewWidth}
        savingId={savingId}
        testEmail={testEmail}
        setTestEmail={setTestEmail}
        testStatus={testStatus}
        onChange={(t) => setEditing(t)}
        onCancel={() => {
          setEditing(null);
          setTestStatus(null);
        }}
        onSave={() => saveTemplate(editing)}
        onTest={() => sendTest(editing)}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-black">Séquence emails</h1>
            <Badge variant="purple">
              <Mail className="h-3 w-3 mr-1" />
              Free → Pro
            </Badge>
          </div>
          <p className="text-muted-foreground font-medium mt-1">
            7 emails déclenchés J+1 à J+30 après l&apos;inscription
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/admin/email-sequences/users">
            <Button variant="outline">
              <Users className="h-4 w-4" />
              Voir les utilisateurs
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={() => reseed(false)}
            disabled={seeding}
          >
            <RefreshCw className={`h-4 w-4 ${seeding ? "animate-spin" : ""}`} />
            Recharger les templates
          </Button>
          <Button
            variant="outline"
            onClick={() => reseed(true)}
            disabled={seeding}
          >
            Forcer reset
          </Button>
        </div>
      </div>

      <Card className="border-2 border-border shadow-[4px_4px_0px_0px_#1a1a1a] mb-6">
        <CardContent className="pt-6">
          <p className="text-sm font-bold mb-2">Variables disponibles dans subject &amp; body :</p>
          <div className="flex gap-2 flex-wrap text-xs font-mono">
            <code className="px-2 py-1 bg-muted rounded">{"{{first_name}}"}</code>
            <code className="px-2 py-1 bg-muted rounded">{"{{org_name}}"}</code>
            <code className="px-2 py-1 bg-muted rounded">{"{{app_url}}"}</code>
            <code className="px-2 py-1 bg-muted rounded">{"{{unsubscribe_link}}"}</code>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {templates.length === 0 ? (
          <Card className="border-2 border-border shadow-[4px_4px_0px_0px_#1a1a1a]">
            <CardContent className="pt-6">
              <p className="text-muted-foreground font-medium">
                Aucun template. Cliquez sur « Recharger les templates » pour
                charger la séquence par défaut.
              </p>
            </CardContent>
          </Card>
        ) : (
          templates.map((t) => {
            const s = stats[t.step_number] || {
              total: 0,
              sent: 0,
              opened: 0,
              clicked: 0,
              failed: 0,
              skipped: 0,
              unsubscribed: 0,
              pending: 0,
            };
            const openRate = s.sent > 0 ? Math.round((s.opened / s.sent) * 100) : 0;
            const clickRate = s.sent > 0 ? Math.round((s.clicked / s.sent) * 100) : 0;
            return (
              <div
                key={t.id}
                className="rounded-2xl border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_#1a1a1a]"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant={t.active ? "green" : "secondary"}>
                        Étape {t.step_number}
                      </Badge>
                      <Badge variant="yellow">J+{t.delay_days}</Badge>
                      {!t.active && <Badge variant="pink">Désactivé</Badge>}
                    </div>
                    <h3 className="font-black text-base truncate">
                      {t.subject}
                    </h3>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleActive(t)}
                    >
                      {t.active ? "Désactiver" : "Activer"}
                    </Button>
                    <Button
                      variant="accent"
                      size="sm"
                      onClick={() => {
                        setEditing(t);
                        setTestStatus(null);
                      }}
                    >
                      <Edit2 className="h-3 w-3" />
                      Éditer
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-4 text-xs">
                  <Metric label="Envoyés" value={s.sent} />
                  <Metric label="Ouverts" value={`${s.opened} (${openRate}%)`} />
                  <Metric label="Cliqués" value={`${s.clicked} (${clickRate}%)`} />
                  <Metric label="En attente" value={s.pending} />
                  <Metric
                    label="Skipped / Unsub"
                    value={`${s.skipped + s.unsubscribed}`}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
        {label}
      </p>
      <p className="font-black">{value}</p>
    </div>
  );
}

function EditorView(props: {
  template: Template;
  previewWidth: "desktop" | "mobile";
  setPreviewWidth: (w: "desktop" | "mobile") => void;
  savingId: string | null;
  testEmail: string;
  setTestEmail: (e: string) => void;
  testStatus: string | null;
  onChange: (t: Template) => void;
  onCancel: () => void;
  onSave: () => void;
  onTest: () => void;
}) {
  const {
    template: t,
    previewWidth,
    setPreviewWidth,
    savingId,
    testEmail,
    setTestEmail,
    testStatus,
    onChange,
    onCancel,
    onSave,
    onTest,
  } = props;

  const previewSrcDoc = useMemo(() => {
    return t.body_html
      .replaceAll("{{first_name}}", "François")
      .replaceAll("{{org_name}}", "Test Org")
      .replaceAll("{{app_url}}", "#")
      .replaceAll("{{unsubscribe_link}}", "#unsubscribe");
  }, [t.body_html]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4" /> Retour
          </Button>
          <Badge variant="purple">Étape {t.step_number}</Badge>
          <Badge variant="yellow">J+{t.delay_days}</Badge>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={onTest}>
            <Send className="h-4 w-4" />
            Envoyer un test
          </Button>
          <Button
            variant="accent"
            onClick={onSave}
            disabled={savingId === t.id}
          >
            <Save className="h-4 w-4" />
            {savingId === t.id ? "Sauvegarde…" : "Sauvegarder"}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-2 border-border shadow-[4px_4px_0px_0px_#1a1a1a]">
          <CardContent className="pt-6 space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-1 block">
                Délai (jours après inscription)
              </label>
              <Input
                type="number"
                min={0}
                max={365}
                value={t.delay_days}
                onChange={(e) =>
                  onChange({ ...t, delay_days: parseInt(e.target.value || "0", 10) })
                }
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-1 block">
                Sujet
              </label>
              <Input
                value={t.subject}
                onChange={(e) => onChange({ ...t, subject: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-1 block">
                Corps HTML
              </label>
              <textarea
                value={t.body_html}
                onChange={(e) => onChange({ ...t, body_html: e.target.value })}
                rows={20}
                className="w-full font-mono text-xs border-2 border-border rounded-xl px-3 py-2 bg-card focus:outline-none focus:ring-2 focus:ring-[#c8f76f]"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Variables : <code>{"{{first_name}}"}</code>,{" "}
                <code>{"{{org_name}}"}</code>, <code>{"{{app_url}}"}</code>,{" "}
                <code>{"{{unsubscribe_link}}"}</code>
              </p>
            </div>

            <div className="border-t pt-4 mt-4">
              <label className="text-xs font-bold uppercase tracking-wider mb-2 block">
                Test send
              </label>
              <div className="flex gap-2 flex-wrap">
                <Input
                  placeholder="(par défaut: votre email admin)"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  type="email"
                />
              </div>
              {testStatus && (
                <p className="text-xs font-bold mt-2">{testStatus}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-border shadow-[4px_4px_0px_0px_#1a1a1a]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Aperçu
                </span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setPreviewWidth("desktop")}
                  className={`p-2 border-2 border-border rounded-lg ${previewWidth === "desktop" ? "bg-[#c8f76f]" : "bg-card"}`}
                >
                  <Monitor className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPreviewWidth("mobile")}
                  className={`p-2 border-2 border-border rounded-lg ${previewWidth === "mobile" ? "bg-[#c8f76f]" : "bg-card"}`}
                >
                  <Smartphone className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div
              className="border-2 border-border rounded-xl bg-white overflow-hidden mx-auto transition-all"
              style={{
                width: previewWidth === "desktop" ? "100%" : "375px",
                maxWidth: "100%",
              }}
            >
              <iframe
                srcDoc={previewSrcDoc}
                title="preview"
                className="w-full"
                style={{ height: "640px", border: "none" }}
                sandbox=""
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Variables remplacées par des valeurs de démo
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
