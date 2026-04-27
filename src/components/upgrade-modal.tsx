"use client";

import { useEffect } from "react";
import Link from "next/link";
import { X, Sparkles, Crown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * Upgrade modal — surfaced when a free user hits a limit (3 matchings reached,
 * proposal generation attempted, etc). The two-tier inline comparison nudges
 * Pro by default but keeps Expert visible for power users.
 *
 * No portal: rendered inline; the parent component decides when to mount/unmount.
 * Esc + backdrop close. Body scroll is locked while open.
 */
export function UpgradeModal({
  open,
  onClose,
  title,
  message,
  highlightedTier = "pro",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  highlightedTier?: "pro" | "expert";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
    >
      <div
        className="relative w-full max-w-2xl rounded-3xl border-2 border-border bg-background p-6 shadow-[8px_8px_0px_0px_#1a1a1a]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-4 right-4 inline-flex h-8 w-8 items-center justify-center rounded-lg border-2 border-border bg-card hover:bg-secondary transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-border bg-[#ffe066] shadow-[2px_2px_0px_0px_#1a1a1a]">
            <Sparkles className="h-5 w-5" />
          </div>
          <h2 id="upgrade-modal-title" className="text-2xl font-black">
            {title}
          </h2>
        </div>
        <p className="mt-2 text-sm font-medium text-muted-foreground max-w-md">
          {message}
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2 items-start">
          {/* Pro */}
          <div
            className={
              highlightedTier === "pro"
                ? "relative rounded-2xl border-4 border-foreground bg-[#ffe066] p-5 shadow-[6px_6px_0px_0px_#1a1a1a]"
                : "rounded-2xl border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_#1a1a1a]"
            }
          >
            {highlightedTier === "pro" && (
              <Badge
                variant="default"
                className="absolute -top-3 left-1/2 -translate-x-1/2 bg-foreground text-background px-3 py-1 text-[10px] font-black whitespace-nowrap"
              >
                Le plus populaire
              </Badge>
            )}
            <div className="flex items-baseline justify-between">
              <h3 className="text-xl font-black">Pro</h3>
              <p className="text-2xl font-black">
                79€<span className="text-xs font-bold">/mois</span>
              </p>
            </div>
            <ul className="mt-3 space-y-1.5 text-sm font-medium">
              <Feature>Matchings illimités</Feature>
              <Feature>Top 50 résultats</Feature>
              <Feature>5 dossiers IA / mois</Feature>
              <Feature>Alertes intelligentes</Feature>
              <Feature>Feedback learning</Feature>
            </ul>
            <Link href="/settings" className="block mt-4">
              <Button variant="default" className="w-full">
                <Sparkles className="h-4 w-4" />
                Passer Pro
              </Button>
            </Link>
          </div>

          {/* Expert */}
          <div
            className={
              highlightedTier === "expert"
                ? "relative rounded-2xl border-4 border-foreground bg-[#a3d5ff] p-5 shadow-[6px_6px_0px_0px_#1a1a1a]"
                : "rounded-2xl border-2 border-border bg-[#a3d5ff] p-5 shadow-[4px_4px_0px_0px_#1a1a1a]"
            }
          >
            {highlightedTier === "expert" && (
              <Badge
                variant="default"
                className="absolute -top-3 left-1/2 -translate-x-1/2 bg-foreground text-background px-3 py-1 text-[10px] font-black whitespace-nowrap"
              >
                Le plus populaire
              </Badge>
            )}
            <div className="flex items-baseline justify-between">
              <h3 className="text-xl font-black">Expert</h3>
              <p className="text-2xl font-black">
                199€<span className="text-xs font-bold">/mois</span>
              </p>
            </div>
            <ul className="mt-3 space-y-1.5 text-sm font-medium">
              <Feature>Tout illimité</Feature>
              <Feature>Dossiers IA illimités</Feature>
              <Feature>Accès prioritaire aux nouvelles subventions</Feature>
              <Feature>Dashboard analytics</Feature>
              <Feature>Support prioritaire</Feature>
            </ul>
            <Link href="/settings" className="block mt-4">
              <Button variant="outline" className="w-full">
                <Crown className="h-4 w-4" />
                Choisir Expert
              </Button>
            </Link>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] font-bold text-muted-foreground">
          Annulable à tout moment · Associations loi 1901 : TVA non applicable
        </p>
      </div>
    </div>
  );
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-1.5">
      <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-foreground" />
      <span>{children}</span>
    </li>
  );
}
