"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Bookmark,
  Loader2,
  Lock,
  Send,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UpgradeModal } from "@/components/upgrade-modal";
import { useToast } from "@/components/ui/toast";

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
 *
 * Free users see grayed buttons with a small "Pro" overlay; clicking opens
 * the upgrade modal. Feedback learning is a Pro+ feature because it is the
 * mechanism through which the matching pipeline personalises results — we
 * don't capture or apply signals from free users.
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
  /** "free" disables the buttons and surfaces the upgrade modal on click. */
  tier?: "free" | "pro" | "expert";
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
  tier = "free",
}: GrantInteractionsProps) {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [active, setActive] = useState<Set<InteractionType>>(
    () => new Set(initialActive)
  );
  const [pending, setPending] = useState<InteractionType | null>(null);
  const [popping, setPopping] = useState<InteractionType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);

  const isFree = tier === "free";
  const buttons = layout === "card" ? CARD_BUTTONS : DETAIL_BUTTONS;

  const handle = async (type: InteractionType) => {
    if (isFree) {
      setPaywallOpen(true);
      return;
    }
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
      // Tiny micro-feedback so the user knows the action stuck — and the
      // "save" toast doubles as a discoverability nudge for /saved.
      const messages: Partial<Record<InteractionType, [string, string?]>> = {
        save: ["Sauvegardé", "Retrouve-la dans Mes subventions sauvegardées."],
        like: ["Bien noté", "On va te proposer plus de subventions comme celle-ci."],
        apply: ["Marqué comme « je postule »", "On garde ça en tête pour la suite."],
        dismiss: ["Subvention ignorée"],
        dislike: ["Bien noté", "On évitera de te proposer ce type de subvention."],
      };
      const msg = messages[type];
      if (msg) {
        if (POSITIVE.has(type)) {
          toast.success(msg[0], msg[1]);
        } else {
          toast.info(msg[0], msg[1]);
        }
      }
      if (refreshOnSuccess && POSITIVE.has(type)) {
        startTransition(() => router.refresh());
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erreur";
      setError(message);
      toast.error("L'action n'a pas pu être enregistrée", message);
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
        const isActive = !isFree && active.has(type);
        const isPopping = popping === type;
        const isPending = pending === type;
        const buttonLabel = isFree ? `${label} (réservé Pro)` : label;
        return (
          <button
            key={type}
            type="button"
            aria-label={buttonLabel}
            aria-pressed={isActive}
            disabled={isPending}
            onClick={() => handle(type)}
            className={cn(
              "relative inline-flex items-center justify-center rounded-xl border-2 border-border font-bold shadow-[2px_2px_0px_0px_#1a1a1a] transition-all",
              sizeClasses,
              isFree
                ? "bg-secondary/60 text-muted-foreground cursor-pointer hover:bg-secondary"
                : isActive
                  ? activeColor
                  : `bg-background ${hoverColor}`,
              !isFree &&
                "hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_#1a1a1a]",
              !isFree &&
                "active:translate-x-0 active:translate-y-0 active:shadow-[1px_1px_0px_0px_#1a1a1a]",
              isPopping && "scale-110",
              isPending && "opacity-70 cursor-wait"
            )}
            title={buttonLabel}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Icon className="h-4 w-4" />
            )}
            {isFree && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-border bg-foreground">
                <Lock className="h-2 w-2 text-background" />
              </span>
            )}
          </button>
        );
      })}
      {isFree && (
        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
          Pro
        </span>
      )}
      {error && (
        <span className="text-[10px] font-bold text-red-700">{error}</span>
      )}
      <UpgradeModal
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        title="Le feedback learning est une fonctionnalité Pro"
        message="Vos likes et dislikes améliorent les matchings suivants. Passez à Pro pour activer le feedback learning."
        highlightedTier="pro"
      />
    </div>
  );
}
