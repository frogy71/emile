"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Check,
  Edit3,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";

type Section = { title: string; content: string };

/**
 * ProposalEditor — inline editing for a proposal's sections.
 *
 * Design choices:
 *  - Read-only by default (most users will just export the .docx).
 *  - Clicking "Éditer" swaps the whole sections column into a form.
 *  - Autosave is explicit (Save button) rather than on-blur — the tokens
 *    involved in [À COMPLÉTER] placeholders mean users WILL delete-retype
 *    whole paragraphs and we don't want to fire 20 PATCHes for that.
 *  - Add/remove/reorder happens in the same form so users don't have to
 *    bounce in and out of edit mode.
 */
export function ProposalEditor({
  proposalId,
  initialSections,
}: {
  proposalId: string;
  initialSections: Section[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [original, setOriginal] = useState<Section[]>(initialSections);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const dirty = JSON.stringify(sections) !== JSON.stringify(original);

  const updateSection = (i: number, patch: Partial<Section>) => {
    setSections((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s))
    );
  };

  const addSection = () => {
    setSections((prev) => [
      ...prev,
      { title: "Nouvelle section", content: "" },
    ]);
  };

  const removeSection = (i: number) => {
    if (!confirm("Supprimer cette section ?")) return;
    setSections((prev) => prev.filter((_, idx) => idx !== i));
  };

  const moveSection = (i: number, dir: -1 | 1) => {
    const target = i + dir;
    if (target < 0 || target >= sections.length) return;
    setSections((prev) => {
      const next = [...prev];
      [next[i], next[target]] = [next[target], next[i]];
      return next;
    });
  };

  const cancel = () => {
    setSections(original);
    setEditing(false);
    setError(null);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/proposals/${proposalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Erreur lors de l'enregistrement");
      }
      setOriginal(sections);
      setSavedAt(new Date());
      setEditing(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <>
        {/* Read-only view with an Edit button */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground">
            {savedAt && (
              <span className="inline-flex items-center gap-1 text-green-700">
                <Check className="h-3.5 w-3.5" />
                Enregistré à {savedAt.toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            <Edit3 className="h-4 w-4" />
            Éditer
          </Button>
        </div>

        {sections.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                Aucun contenu structuré dans cette proposition.
              </p>
              <Button
                variant="accent"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setEditing(true);
                  addSection();
                }}
              >
                <Plus className="h-4 w-4" />
                Ajouter une section
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {sections.map((section, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg border-2 border-border bg-[#d4b5ff] text-sm font-black shadow-[2px_2px_0px_0px_#1a1a1a]">
                      {i + 1}
                    </span>
                    <h2 className="text-lg font-black">{section.title}</h2>
                  </div>
                  <div className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-foreground">
                    {section.content}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </>
    );
  }

  // Edit mode
  return (
    <>
      {/* Sticky save bar */}
      <div className="sticky top-0 z-20 -mx-4 px-4 py-3 mb-4 bg-background/95 backdrop-blur border-b-2 border-border">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-bold">
            Mode édition{" "}
            {dirty && (
              <span className="ml-2 text-xs font-medium text-orange-600">
                • modifications non enregistrées
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={cancel}
              disabled={saving}
            >
              <X className="h-4 w-4" />
              Annuler
            </Button>
            <Button
              size="sm"
              variant="accent"
              onClick={save}
              disabled={saving || !dirty}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Enregistrer
            </Button>
          </div>
        </div>
        {error && (
          <p className="mt-2 text-xs font-bold text-red-600">{error}</p>
        )}
      </div>

      <div className="space-y-4">
        {sections.map((section, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg border-2 border-border bg-[#d4b5ff] text-sm font-black shadow-[2px_2px_0px_0px_#1a1a1a]">
                  {i + 1}
                </span>
                <input
                  className="flex-1 min-w-0 rounded-lg border-2 border-border bg-background px-3 py-1.5 text-lg font-black focus:border-foreground focus:outline-none"
                  value={section.title}
                  onChange={(e) =>
                    updateSection(i, { title: e.target.value })
                  }
                  placeholder="Titre de la section"
                />
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveSection(i, -1)}
                    disabled={i === 0}
                    className="rounded-md border-2 border-border px-2 py-1 text-xs font-bold hover:bg-secondary disabled:opacity-30"
                    title="Monter"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSection(i, 1)}
                    disabled={i === sections.length - 1}
                    className="rounded-md border-2 border-border px-2 py-1 text-xs font-bold hover:bg-secondary disabled:opacity-30"
                    title="Descendre"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSection(i)}
                    className="rounded-md border-2 border-border bg-[#ffa3d1] px-2 py-1 text-xs font-bold hover:shadow-[2px_2px_0px_0px_#1a1a1a]"
                    title="Supprimer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <textarea
                className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm font-medium leading-relaxed focus:border-foreground focus:outline-none"
                value={section.content}
                onChange={(e) => updateSection(i, { content: e.target.value })}
                rows={Math.max(
                  6,
                  Math.min(24, Math.ceil(section.content.length / 80))
                )}
                spellCheck
                lang="fr"
                placeholder="Rédige le contenu de cette section..."
              />
              <p className="mt-1 text-xs font-medium text-muted-foreground">
                {section.content.length} caractères
              </p>
            </CardContent>
          </Card>
        ))}

        <div className="flex justify-center">
          <Button variant="outline" onClick={addSection}>
            <Plus className="h-4 w-4" />
            Ajouter une section
          </Button>
        </div>
      </div>
    </>
  );
}
