"use client";

import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Frosted-glass overlay for free-tier-locked content. Wraps a child node, blurs
 * it, and surfaces an upgrade CTA on top. Used to "show but lock" the best
 * matches (#1-3) and the long tail (#7+) on the matching results page.
 */
export function PaywallOverlay({
  title = "Débloquez vos meilleurs matchs",
  subtitle = "Passez à Pro pour voir tous vos matchs en clair.",
  cta = "Passer Pro — 79€/mois",
  ctaHref = "/pricing",
  blurClass = "blur-md",
  children,
  className,
}: {
  title?: string;
  subtitle?: string;
  cta?: string;
  ctaHref?: string;
  /** Tailwind blur intensity. Use blur-sm / blur / blur-md / blur-lg. */
  blurClass?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <div
        aria-hidden
        className={cn(
          "pointer-events-none select-none transition-all",
          blurClass
        )}
      >
        {children}
      </div>

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="rounded-2xl border-2 border-border bg-card/95 backdrop-blur-sm px-5 py-4 shadow-[4px_4px_0px_0px_#1a1a1a] text-center max-w-sm">
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl border-2 border-border bg-[#ffe066] shadow-[2px_2px_0px_0px_#1a1a1a]">
            <Lock className="h-4 w-4" />
          </div>
          <h4 className="mt-3 text-sm font-black leading-tight">{title}</h4>
          <p className="mt-1 text-xs font-medium text-muted-foreground leading-snug">
            {subtitle}
          </p>
          <Link href={ctaHref} className="inline-block mt-3">
            <Button variant="default" size="sm">
              <Sparkles className="h-3.5 w-3.5" />
              {cta}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
