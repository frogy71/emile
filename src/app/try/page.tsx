"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Sparkles, Target } from "lucide-react";
import {
  QuickStartForm,
  PENDING_PROJECT_STORAGE_KEY,
  type QuickStartFormData,
} from "@/components/quick-start-form";

/**
 * Public, pre-signup project form. The conversion-funnel entry point: the
 * prospect describes their project *before* hitting the auth wall, which
 * dramatically improves signup completion (sunk-cost commitment, plus
 * they've already seen the value proposition take shape).
 *
 * On submit we save the form to localStorage and redirect to
 * /signup?from=try. The post-signup landing page reads the stored payload,
 * creates the project server-side, runs cleanup + embedding, and lands the
 * user on /projects/[id]?match=auto.
 *
 * Lives outside (app)/ so the layout's auth gate doesn't kick the user
 * back to /login. The middleware also exempts /try and /essai explicitly.
 */
export default function TryPage() {
  const router = useRouter();

  const handleSubmit = async (data: QuickStartFormData) => {
    try {
      localStorage.setItem(
        PENDING_PROJECT_STORAGE_KEY,
        JSON.stringify({ ...data, savedAt: Date.now() })
      );
    } catch {
      // localStorage may be unavailable (private mode, quota). The signup
      // page will simply not find a pending project and the user will go
      // through the normal onboarding flow — degraded but not broken.
    }
    router.push("/signup?from=try");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav — kept lightweight so the form is the focus */}
      <nav className="border-b-2 border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link
            href="/"
            className="text-2xl font-black tracking-tight text-foreground"
          >
            Emile
            <span className="text-[#c8f76f] bg-foreground px-2 py-0.5 rounded-lg ml-1 text-lg">
              .
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                J&apos;ai déjà un compte
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-6 py-10 md:py-16">
        <div className="mb-8">
          <Link href="/">
            <Button variant="outline" size="sm" className="mb-6">
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
          </Link>

          <Badge variant="green" className="mb-4 text-sm px-3 py-1">
            <Sparkles className="h-3.5 w-3.5 mr-1" />
            Étape 1/2 — Décrivez votre projet
          </Badge>

          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-border bg-[#c8f76f] shadow-[4px_4px_0px_0px_#1a1a1a]">
            <Target className="h-6 w-6" />
          </div>
          <h1 className="text-4xl font-black text-foreground md:text-5xl">
            Parlez-nous de votre projet.
          </h1>
          <p className="mt-3 text-base font-medium text-muted-foreground md:text-lg">
            Six champs. Notre IA croise votre description avec 5 700+ subventions
            FR &amp; UE pour trouver celles qui matchent vraiment.
          </p>
        </div>

        <QuickStartForm
          ctaLabel="Trouver mes subventions"
          loadingLabel="Préparation..."
          onSubmit={handleSubmit}
        />

        <div className="mt-6 rounded-xl border-2 border-border bg-[#ffe066] p-4 shadow-[3px_3px_0px_0px_#1a1a1a]">
          <p className="text-sm font-bold flex items-start gap-2">
            <ArrowRight className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              Étape suivante : créez votre compte (30 secondes) pour découvrir
              vos résultats.
            </span>
          </p>
        </div>

        <p className="mt-6 text-center text-xs font-medium text-muted-foreground">
          Aucune carte bancaire requise. Vos données restent privées.
        </p>
      </div>
    </div>
  );
}
