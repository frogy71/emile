"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ExternalLink,
  GripVertical,
  Inbox,
  PartyPopper,
  Search,
  Sparkles,
  Trophy,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";

/**
 * Trello-style Kanban board for grant applications.
 *
 * Each column represents a stage of the application lifecycle (see migration
 * 0011 for the canonical list). Cards are draggable between columns; the
 * drop handler PATCHes /api/grants/[id]/pipeline with the new status and
 * optimistically reflects the move so the UX feels instant. On error we
 * revert and toast.
 */

export type PipelineStatus =
  | "discovered"
  | "preparing"
  | "applied"
  | "waiting"
  | "accepted"
  | "rejected";

export type PipelineCard = {
  interactionId: string;
  grantId: string;
  title: string;
  funder: string | null;
  deadline: string | null;
  maxAmountEur: number | null;
  sourceUrl: string | null;
  sourceName: string | null;
  status: PipelineStatus;
  createdAt: string;
};

type ColumnDef = {
  id: PipelineStatus;
  label: string;
  description: string;
  headerBg: string;
  cardAccent: string;
  emptyHint: string;
};

const COLUMNS: ColumnDef[] = [
  {
    id: "discovered",
    label: "Découvert",
    description: "Subventions repérées",
    headerBg: "bg-[#c8f76f]",
    cardAccent: "border-l-[#c8f76f]",
    emptyHint:
      "Aime une subvention dans le matching pour la voir apparaître ici.",
  },
  {
    id: "preparing",
    label: "En préparation",
    description: "Dossier en cours",
    headerBg: "bg-[#a3d5ff]",
    cardAccent: "border-l-[#a3d5ff]",
    emptyHint: "Glisse une carte ici quand tu te lances dans le dossier.",
  },
  {
    id: "applied",
    label: "Candidaté",
    description: "Dossier envoyé",
    headerBg: "bg-[#d4b5ff]",
    cardAccent: "border-l-[#d4b5ff]",
    emptyHint: "Tes candidatures envoyées arrivent ici.",
  },
  {
    id: "waiting",
    label: "En attente",
    description: "Réponse en cours",
    headerBg: "bg-[#ffe066]",
    cardAccent: "border-l-[#ffe066]",
    emptyHint: "Les dossiers en attente de réponse.",
  },
  {
    id: "accepted",
    label: "Accepté",
    description: "Subvention obtenue",
    headerBg: "bg-[#7be276]",
    cardAccent: "border-l-[#7be276]",
    emptyHint: "Aucune victoire pour le moment — patience !",
  },
  {
    id: "rejected",
    label: "Refusé",
    description: "Pas retenu",
    headerBg: "bg-[#d6d6d6]",
    cardAccent: "border-l-[#a3a3a3]",
    emptyHint: "Les refus s'archivent ici.",
  },
];

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function deadlineBadge(days: number | null): {
  label: string;
  className: string;
} {
  if (days === null) {
    return {
      label: "Sans deadline",
      className: "bg-secondary text-muted-foreground",
    };
  }
  if (days < 0) {
    return {
      label: "Expirée",
      className: "bg-secondary text-muted-foreground",
    };
  }
  if (days < 7) {
    return { label: `J-${days}`, className: "bg-[#ffa3d1] text-foreground" };
  }
  if (days < 30) {
    return { label: `J-${days}`, className: "bg-[#ffe066] text-foreground" };
  }
  return { label: `J-${days}`, className: "bg-[#c8f76f] text-foreground" };
}

function formatEur(n: number | null | undefined): string | null {
  if (!n || n <= 0) return null;
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    const rounded = m >= 10 ? Math.round(m) : Math.round(m * 10) / 10;
    return `${String(rounded).replace(".", ",")}M€`;
  }
  if (n >= 1_000) return `${Math.round(n / 1_000)}k€`;
  return `${n}€`;
}

export function PipelineBoard({
  initialCards,
}: {
  initialCards: PipelineCard[];
}) {
  const toast = useToast();
  const [cards, setCards] = useState<PipelineCard[]>(initialCards);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoverColumn, setHoverColumn] = useState<PipelineStatus | null>(null);

  const grouped = useMemo(() => {
    const map: Record<PipelineStatus, PipelineCard[]> = {
      discovered: [],
      preparing: [],
      applied: [],
      waiting: [],
      accepted: [],
      rejected: [],
    };
    const FAR_FUTURE = Number.POSITIVE_INFINITY;
    for (const card of cards) {
      map[card.status].push(card);
    }
    for (const key of Object.keys(map) as PipelineStatus[]) {
      map[key].sort((a, b) => {
        const da = a.deadline ? new Date(a.deadline).getTime() : FAR_FUTURE;
        const db = b.deadline ? new Date(b.deadline).getTime() : FAR_FUTURE;
        return da - db;
      });
    }
    return map;
  }, [cards]);

  const handleDrop = async (grantId: string, target: PipelineStatus) => {
    setDraggingId(null);
    setHoverColumn(null);

    const previous = cards.find((c) => c.grantId === grantId);
    if (!previous || previous.status === target) return;

    // Optimistic move — flip the status locally first so the card jumps
    // immediately, then PATCH. On failure we restore the previous status.
    setCards((prev) =>
      prev.map((c) => (c.grantId === grantId ? { ...c, status: target } : c))
    );

    try {
      const res = await fetch(`/api/grants/${grantId}/pipeline`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: target }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur");
      }
      const targetCol = COLUMNS.find((c) => c.id === target);
      if (target === "accepted") {
        toast.success("Bravo, subvention obtenue ! 🎉", previous.title);
      } else if (targetCol) {
        toast.success(`Déplacé vers « ${targetCol.label} »`, previous.title);
      }
    } catch (e) {
      setCards((prev) =>
        prev.map((c) =>
          c.grantId === grantId ? { ...c, status: previous.status } : c
        )
      );
      toast.error(
        "Le déplacement a échoué",
        e instanceof Error ? e.message : undefined
      );
    }
  };

  if (cards.length === 0) {
    return (
      <div className="mt-10 rounded-2xl border-2 border-dashed border-border bg-card p-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-border bg-[#ffe066] shadow-[3px_3px_0px_0px_#1a1a1a]">
          <Inbox className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-xl font-black">Ton pipeline est vide</h2>
        <p className="mt-2 text-sm font-medium text-muted-foreground max-w-md mx-auto">
          Chaque fois que tu aimes ou sauvegardes une subvention, elle
          s&apos;ajoute automatiquement à la colonne « Découvert » pour que tu
          puisses suivre l&apos;avancement de tes candidatures.
        </p>
        <Link href="/grants" className="inline-block mt-5">
          <Button variant="accent">
            <Sparkles className="h-4 w-4" />
            Découvrir les subventions
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {COLUMNS.map((column) => {
          const columnCards = grouped[column.id];
          const isHover = hoverColumn === column.id;
          return (
            <div
              key={column.id}
              onDragOver={(e) => {
                e.preventDefault();
                setHoverColumn(column.id);
              }}
              onDragLeave={(e) => {
                if (e.currentTarget === e.target) setHoverColumn(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                const grantId = e.dataTransfer.getData("text/plain");
                if (grantId) handleDrop(grantId, column.id);
              }}
              className={`flex w-80 shrink-0 flex-col rounded-2xl border-2 border-border bg-card transition-all ${
                isHover
                  ? "shadow-[6px_6px_0px_0px_#1a1a1a] -translate-y-0.5"
                  : "shadow-[3px_3px_0px_0px_#1a1a1a]"
              }`}
            >
              <div
                className={`rounded-t-xl border-b-2 border-border ${column.headerBg} px-4 py-3`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3 className="text-sm font-black uppercase tracking-wider truncate">
                      {column.label}
                    </h3>
                    {column.id === "accepted" && (
                      <Trophy className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-md border-2 border-border bg-card px-1.5 text-xs font-black">
                    {columnCards.length}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] font-bold text-foreground/70">
                  {column.description}
                </p>
              </div>

              <div className="flex flex-col gap-3 p-3 min-h-[120px]">
                {columnCards.length === 0 ? (
                  <div
                    className={`rounded-xl border-2 border-dashed border-border/60 px-3 py-6 text-center text-[11px] font-semibold text-muted-foreground transition-colors ${
                      isHover ? "bg-secondary/60" : ""
                    }`}
                  >
                    {isHover ? (
                      <span className="text-foreground">Déposer ici</span>
                    ) : (
                      column.emptyHint
                    )}
                  </div>
                ) : (
                  columnCards.map((card) => (
                    <KanbanCard
                      key={card.interactionId}
                      card={card}
                      accent={column.cardAccent}
                      muted={column.id === "rejected"}
                      celebrate={column.id === "accepted"}
                      isDragging={draggingId === card.grantId}
                      onDragStart={() => setDraggingId(card.grantId)}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setHoverColumn(null);
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KanbanCard({
  card,
  accent,
  muted,
  celebrate,
  isDragging,
  onDragStart,
  onDragEnd,
}: {
  card: PipelineCard;
  accent: string;
  muted?: boolean;
  celebrate?: boolean;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const days = card.deadline ? daysUntil(card.deadline) : null;
  const badge = deadlineBadge(days);
  const amount = formatEur(card.maxAmountEur);

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", card.grantId);
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className={`group relative rounded-xl border-2 border-l-[6px] border-border bg-background p-3 shadow-[2px_2px_0px_0px_#1a1a1a] transition-all hover:shadow-[3px_3px_0px_0px_#1a1a1a] hover:-translate-y-0.5 cursor-grab active:cursor-grabbing ${accent} ${
        muted ? "opacity-70" : ""
      } ${isDragging ? "opacity-40 rotate-1" : ""}`}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/60 group-hover:text-muted-foreground" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
            <span
              className={`inline-flex items-center gap-1 rounded-md border-2 border-border px-1.5 py-0.5 text-[10px] font-black ${badge.className}`}
            >
              {badge.label}
            </span>
            {amount && (
              <span className="inline-flex items-center rounded-md border-2 border-border bg-card px-1.5 py-0.5 text-[10px] font-black">
                {amount}
              </span>
            )}
            {celebrate && (
              <span className="inline-flex items-center gap-0.5 rounded-md border-2 border-border bg-[#c8f76f] px-1.5 py-0.5 text-[10px] font-black">
                <PartyPopper className="h-2.5 w-2.5" />
                Gagné
              </span>
            )}
          </div>

          <Link
            href={`/grants/${card.grantId}`}
            draggable={false}
            onClick={(e) => e.stopPropagation()}
            className="block"
          >
            <h4 className="text-sm font-black leading-snug line-clamp-2 hover:underline decoration-2 underline-offset-2">
              {card.title}
            </h4>
          </Link>

          {card.funder && (
            <p className="mt-1 text-xs font-semibold text-muted-foreground line-clamp-1">
              {card.funder}
            </p>
          )}

          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-muted-foreground truncate">
              {card.sourceName || "Source"}
            </span>
            {card.sourceUrl && (
              <a
                href={card.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                draggable={false}
                onClick={(e) => e.stopPropagation()}
                aria-label="Ouvrir la page de candidature"
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 border-border bg-card transition-colors hover:bg-secondary"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PipelineEmptyCta() {
  return (
    <Link href="/grants">
      <Button variant="outline">
        <Search className="h-4 w-4" />
        Explorer le catalogue
      </Button>
    </Link>
  );
}
