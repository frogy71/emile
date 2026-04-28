"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings2, Target } from "lucide-react";
import {
  QuickStartForm,
  quickStartToApiPayload,
  type QuickStartFormData,
} from "@/components/quick-start-form";

/**
 * Authenticated quick-start. Posts to /api/projects then redirects to
 * /projects/[id]?match=auto so the detail page auto-launches the matcher.
 *
 * Power users who want the cadre-logique form can opt in via
 * /projects/new?advanced=true.
 */
export default function QuickStart() {
  const router = useRouter();

  const handleSubmit = async (data: QuickStartFormData) => {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quickStartToApiPayload(data)),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error || "Erreur lors de la création du projet");
    }
    const { project } = await res.json();
    router.push(`/projects/${project.id}?match=auto`);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 flex items-center justify-between">
        <Link href="/dashboard">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <Link
          href="/projects/new?advanced=true"
          className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
        >
          <Settings2 className="h-3.5 w-3.5" />
          Mode avancé (cadre logique)
        </Link>
      </div>

      <div className="mb-8">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-border bg-[#c8f76f] shadow-[4px_4px_0px_0px_#1a1a1a]">
          <Target className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-black text-foreground md:text-4xl">
          Nouveau projet
        </h1>
        <p className="mt-2 text-base font-medium text-muted-foreground">
          Six champs, on lance le matching juste après. Vous pourrez tout affiner
          ensuite.
        </p>
      </div>

      <QuickStartForm
        ctaLabel="Créer et trouver mes subventions"
        loadingLabel="Création et matching en cours..."
        onSubmit={handleSubmit}
      />

      <p className="mt-5 text-center text-xs font-medium text-muted-foreground">
        Vous pourrez compléter le cadre logique complet après le matching.
      </p>
    </div>
  );
}
