"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, Loader2, Send, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Tinder-style feedback row for a grant. Renders icon-only buttons (with
 * aria labels for screen readers) that POST to /api/grants/[id]/interact.
 *
 * Two layouts:
 *   - layout="card"   : compact pair (👍 / 👎) for podium/top-7 rows
 *   - layout="detail" : full quartet (save / apply / dismiss + dislike) for
 *                       the grant detail page action bar
 *
 * Each button shows a brief "pop" animation on click, mirroring the
 * Tinder swipe-feedback feel without pulling in framer-motion. The active
 * state persists for the rest of the page lifetime so users see what they
 * voted on (full hydration across pages comes from /api/grants/preferences,
 * which the parent server component can use to seed `initialActive`).
 */

export type InteractionType =
  | "like"
  | "dislike"
  | "save"
  | "dismiss"
  | "apply";

interface GrantInteractionsProps {
  grantId: string;
  projectId?: string | null;
  layout?: "card" | "detail";
  initialActive?: InteractionType[];
  /**
   * Refresh the server route after a positive interaction so popularity
   * counters stay in sync. Off by default for podium clicks (avoids a full
   * page re-render on every vote).
   */
  refreshOnSuccess?: boolean;
  className?: string;
}

const POSITIVE: ReadonlySet<InteractionType> = new Set([
  "like",
  "save",
  "apply",
]);

interface ButtonSpec {
  type: InteractionType;
  label: string;
  Icon: typeof ThumbsUp;
  activeColor: string;
  hoverColor: string;
}

const CARD_BUTTONS: ButtonSpec[] = [
  {
    type: "like",
    label: "J'aime cette subvention",
    Icon: ThumbsUp,
    activeColor: "bg-[#c8f76f]",
    hoverColor: "hover:bg-[#c8f76f]",
  },
  {
    type: "dismiss",
    label: "Pas pour moi",
    Icon: ThumbsDown,
    activeColor: "bg-[#ffa3d1]",
    hoverColor: "hover:bg-[#ffa3d1]",
  },
];

const DETAIL_BUTTONS: ButtonSpec[] = [
  {
    type: "save",
    label: "Sauvegarder",
    Icon: Bookmark,
    activeColor: "bg-[#ffe066]",
    hoverColor: "hover:bg-[#ffe066]",
  },
  {
    type: "apply",
    label: "Je postule",
    Icon: Send,
    activeColor: "bg-[#c8f76f]",
    hoverColor: "hover:bg-[#c8f76f]",
  },
  {
    type: "dismiss",
    label: "Ignorer",
    Icon: X,
    activeColor: "bg-[#ffa3d1]",
    hoverColor: "hover:bg-[#ffa3d1]",
  },
  {
    type: "dislike",
    label: "Pas pour nous",
    Icon: ThumbsDown,
    activeColor: "bg-[#d4b5ff]",
    hoverColor: "hover:bg-[#d4b5ff]",
  },
];

export function GrantInteractions({
  grantId,
  projectId,
  layout = "card",
  initialActive = [],
  refreshOnSuccess = false,
  className,
}: GrantInteractionsProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [active, setActive] = useState<Set<InteractionType>>(
    () => new Set(initialActive)
  );
  const [pending, setPending] = useState<InteractionType | null>(null);
  const [popping, setPopping] = useState<InteractionType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const buttons = layout === "card" ? CARD_BUTTONS : DETAIL_BUTTONS;

  const handle = async (type: InteractionType) => {
    if (pending) return;
    setPending(type);
    setError(null);
    setPopping(type);
    setTimeout(() => setPopping(null), 280);
    try {
      const res = await fetch(`/api/grants/${grantId}/interact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interaction_type: type,
          project_id: projectId ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setActive((prev) => {
        const next = new Set(prev);
        next.add(type);
        // Mutual-exclusion: liking/saving toggles off the dismiss state and
        // vice versa, so the UI doesn't show contradictory active markers.
        if (POSITIVE.has(type)) {
          next.delete("dismiss");
          next.delete("dislike");
        } else {
          next.delete("like");
          next.delete("save");
          next.delete("apply");
        }
        return next;
      });
      if (refreshOnSuccess && POSITIVE.has(type)) {
        startTransition(() => router.refresh());
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setPending(null);
    }
  };

  const sizeClasses =
    layout === "card" ? "h-9 w-9 text-sm" : "h-11 w-11 text-base";

  return (
    <div
      className={cn(
        "flex items-center gap-2",
        layout === "detail" && "flex-wrap",
        className
      )}
    >
      {buttons.map(({ type, label, Icon, activeColor, hoverColor }) => {
        const isActive = active.has(type);
        const isPopping = popping === type;
        const isPending = pending === type;
        return (
          <button
            key={type}
            type="button"
            aria-label={label}
            aria-pressed={isActive}
            disabled={isPending}
            onClick={() => handle(type)}
            className={cn(
              "inline-flex items-center justify-center rounded-xl border-2 border-border font-bold shadow-[2px_2px_0px_0px_#1a1a1a] transition-all",
              sizeClasses,
              isActive ? activeColor : `bg-background ${hoverColor}`,
              "hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_#1a1a1a]",
              "active:translate-x-0 active:translate-y-0 active:shadow-[1px_1px_0px_0px_#1a1a1a]",
              isPopping && "scale-110",
              isPending && "opacity-70 cursor-wait"
            )}
            title={label}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Icon className="h-4 w-4" />
            )}
          </button>
        );
      })}
      {error && (
        <span className="text-[10px] font-bold text-red-700">{error}</span>
      )}
    </div>
  );
}
