"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import {
  Sparkles,
  Save,
  RefreshCw,
  Image as ImageIcon,
  Copy,
  AlertTriangle,
  CheckCircle,
  Shield,
  Cloud,
  Folder,
  Link as LinkIcon,
} from "lucide-react";

interface CarouselPreview {
  grantId: string;
  grantTitle: string;
  funder: string | null;
  accent: string;
  caption: string;
  slides: string[]; // base64 PNGs
}

interface PublishedCarousel {
  id: string;
  carouselIndex: number;
  grantId: string;
  grantTitle: string;
  funder: string | null;
  accent: string;
  slideUrls: string[];
  captionPreview: string;
}

interface SavedDropboxCarousel {
  grantId: string;
  grantTitle: string;
  funder: string | null;
  accent: string;
  slidePaths: string[];
  captionPath: string;
}

type ResultState =
  | {
      kind: "published";
      date: string;
      latestApiUrl: string;
      carousels: PublishedCarousel[];
    }
  | {
      kind: "dropbox";
      outputDir: string;
      carousels: SavedDropboxCarousel[];
    };

export default function CarouselMakerPage() {
  const [previews, setPreviews] = useState<CarouselPreview[] | null>(null);
  const [result, setResult] = useState<ResultState | null>(null);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [savingDropbox, setSavingDropbox] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function withSession(): Promise<string | null> {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setError("Session expirée — reconnectez-vous.");
      return null;
    }
    return session.access_token;
  }

  async function generate() {
    setGenerating(true);
    setError(null);
    setResult(null);
    try {
      const token = await withSession();
      if (!token) {
        setGenerating(false);
        return;
      }
      const res = await fetch("/api/admin/carousels/generate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ count: 2 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `HTTP ${res.status}`);
        setGenerating(false);
        return;
      }
      setPreviews(data.carousels);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur réseau");
    }
    setGenerating(false);
  }

  async function publish() {
    if (!previews) return;
    setPublishing(true);
    setError(null);
    try {
      const token = await withSession();
      if (!token) {
        setPublishing(false);
        return;
      }
      const res = await fetch("/api/admin/carousels/publish", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ count: previews.length }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `HTTP ${res.status}`);
        setPublishing(false);
        return;
      }
      setResult({
        kind: "published",
        date: data.date,
        latestApiUrl: `${window.location.origin}/api/carousels/latest`,
        carousels: data.carousels,
      });
      setPreviews(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur réseau");
    }
    setPublishing(false);
  }

  async function saveDropbox() {
    if (!previews) return;
    setSavingDropbox(true);
    setError(null);
    try {
      const token = await withSession();
      if (!token) {
        setSavingDropbox(false);
        return;
      }
      const res = await fetch("/api/admin/carousels/save", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ count: previews.length }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `HTTP ${res.status}`);
        setSavingDropbox(false);
        return;
      }
      setResult({
        kind: "dropbox",
        outputDir: data.outputDir,
        carousels: data.carousels,
      });
      setPreviews(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur réseau");
    }
    setSavingDropbox(false);
  }

  const busy = generating || publishing || savingDropbox;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-foreground">
              Carousel Maker
            </h1>
            <Badge variant="pink">
              <Shield className="h-3 w-3 mr-1" />
              Privé
            </Badge>
          </div>
          <p className="text-muted-foreground font-medium mt-1">
            Subvention du jour — publié vers Botato via{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-xs">
              GET /api/carousels/latest
            </code>
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="accent" onClick={generate} disabled={busy}>
            <Sparkles
              className={`h-4 w-4 ${generating ? "animate-spin" : ""}`}
            />
            {generating
              ? "Génération..."
              : previews
              ? "Re-générer"
              : "Générer les carousels du jour"}
          </Button>
        </div>
      </div>

      {previews && (
        <div className="rounded-2xl border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_#1a1a1a] mb-6">
          <p className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3">
            Action
          </p>
          <div className="flex flex-wrap gap-3 items-center">
            <Button variant="default" onClick={publish} disabled={busy}>
              <Cloud
                className={`h-4 w-4 ${publishing ? "animate-spin" : ""}`}
              />
              {publishing ? "Publication..." : "Publier (Supabase + API)"}
            </Button>
            <Button variant="outline" onClick={saveDropbox} disabled={busy}>
              <Save className={`h-4 w-4 ${savingDropbox ? "animate-spin" : ""}`} />
              {savingDropbox ? "Export..." : "Export Dropbox (fallback)"}
            </Button>
            <p className="text-xs text-muted-foreground font-medium">
              « Publier » est l&apos;action par défaut : les images vont dans
              Supabase Storage et Botato les récupère via l&apos;API publique.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-2xl border-2 border-border bg-[#ffa3d1] p-4 shadow-[4px_4px_0px_0px_#1a1a1a] flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="font-bold">{error}</div>
        </div>
      )}

      {result?.kind === "published" && (
        <div className="mb-6 rounded-2xl border-2 border-border bg-[#c8f76f] p-5 shadow-[4px_4px_0px_0px_#1a1a1a]">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-6 w-6 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-lg font-black">
                {result.carousels.length} carousel
                {result.carousels.length > 1 ? "s" : ""} publié
                {result.carousels.length > 1 ? "s" : ""} ({result.date}).
              </p>
              <p className="text-sm font-bold mt-2 flex items-center gap-2 flex-wrap">
                <LinkIcon className="h-4 w-4" />
                Endpoint Botato :{" "}
                <a
                  href={result.latestApiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-mono text-xs break-all"
                >
                  {result.latestApiUrl}
                </a>
              </p>
              <div className="mt-3 space-y-2">
                {result.carousels.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-lg bg-foreground/10 p-2 text-xs font-medium"
                  >
                    <p className="font-bold">
                      #{c.carouselIndex + 1} — {c.grantTitle}
                    </p>
                    <p className="text-muted-foreground">
                      {c.slideUrls.length} slides ·{" "}
                      <a
                        href={c.slideUrls[0]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        ouvrir slide 1
                      </a>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {result?.kind === "dropbox" && (
        <div className="mb-6 rounded-2xl border-2 border-border bg-[#ffe066] p-5 shadow-[4px_4px_0px_0px_#1a1a1a]">
          <div className="flex items-start gap-3">
            <Folder className="h-6 w-6 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-lg font-black">
                {result.carousels.length} carousel
                {result.carousels.length > 1 ? "s" : ""} exporté
                {result.carousels.length > 1 ? "s" : ""} en local.
              </p>
              <p className="text-sm font-bold mt-1">
                Dossier :{" "}
                <code className="bg-foreground/10 px-2 py-0.5 rounded font-mono text-xs">
                  {result.outputDir}
                </code>
              </p>
              <div className="mt-3 space-y-1">
                {result.carousels.map((c) => (
                  <p key={c.grantId} className="text-xs font-medium">
                    ✓ {c.grantTitle} —{" "}
                    <span className="text-muted-foreground">
                      {c.slidePaths.length} slides
                    </span>
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {!previews && !generating && !result && (
        <div className="rounded-2xl border-2 border-dashed border-border bg-card p-10 text-center">
          <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-base font-bold text-foreground">
            Aucun carousel généré pour l&apos;instant.
          </p>
          <p className="text-sm text-muted-foreground font-medium mt-1">
            Cliquez sur « Générer les carousels du jour » pour prévisualiser
            la sélection.
          </p>
          <div className="mt-5 text-xs text-muted-foreground max-w-xl mx-auto font-medium">
            Règles : 2 subventions/jour, jamais déjà publiées, deadline 14-30
            jours en priorité, montants élevés, thématiques distinctes.
          </div>
        </div>
      )}

      {generating && !previews && (
        <div className="rounded-2xl border-2 border-border bg-card p-10 text-center shadow-[4px_4px_0px_0px_#1a1a1a]">
          <RefreshCw className="h-10 w-10 mx-auto animate-spin text-muted-foreground mb-3" />
          <p className="text-base font-bold">Rendu des slides en cours...</p>
          <p className="text-sm text-muted-foreground font-medium mt-1">
            5 slides × 2 carousels = 10 PNG. Quelques secondes.
          </p>
        </div>
      )}

      {previews && previews.length > 0 && (
        <div className="space-y-8">
          {previews.map((c, idx) => (
            <CarouselPreviewCard key={c.grantId} carousel={c} index={idx + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function CarouselPreviewCard({
  carousel,
  index,
}: {
  carousel: CarouselPreview;
  index: number;
}) {
  const [copied, setCopied] = useState(false);

  function copyCaption() {
    navigator.clipboard.writeText(carousel.caption).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="rounded-2xl border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_#1a1a1a]">
      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="purple">Carousel #{index}</Badge>
            <span
              className="inline-block w-4 h-4 rounded-full border-2 border-border"
              style={{ backgroundColor: carousel.accent }}
              title={`Accent ${carousel.accent}`}
            />
          </div>
          <h2 className="text-xl font-black text-foreground">
            {carousel.grantTitle}
          </h2>
          {carousel.funder && (
            <p className="text-sm text-muted-foreground font-medium">
              {carousel.funder}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        {carousel.slides.map((b64, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={`data:image/png;base64,${b64}`}
            alt={`Slide ${i + 1}`}
            className="w-full aspect-square rounded-lg border-2 border-border bg-muted"
          />
        ))}
      </div>

      <div className="rounded-xl border-2 border-border bg-muted/30 p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            Caption Instagram / LinkedIn
          </p>
          <Button variant="outline" size="sm" onClick={copyCaption}>
            <Copy className="h-3 w-3" />
            {copied ? "Copié !" : "Copier"}
          </Button>
        </div>
        <pre className="whitespace-pre-wrap text-sm font-medium text-foreground font-sans leading-relaxed">
          {carousel.caption}
        </pre>
      </div>
    </div>
  );
}
