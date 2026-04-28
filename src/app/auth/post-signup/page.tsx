"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import {
  PENDING_PROJECT_STORAGE_KEY,
  quickStartToApiPayload,
  type QuickStartFormData,
} from "@/components/quick-start-form";

/**
 * Post-auth landing shim.
 *
 * After a user signs up (or logs in) coming from the /try funnel, they
 * land here. We:
 *   1. Read the pending project payload from localStorage.
 *   2. POST it to /api/projects (which finds-or-creates a default org,
 *      runs AI cleanup + embedding).
 *   3. Clear localStorage so the payload doesn't get re-applied if the
 *      user ever revisits this page.
 *   4. Redirect to /projects/[id]?match=auto so the detail page fires
 *      the matcher on mount and the user lands on results.
 *
 * If there's no pending project (normal login, or localStorage cleared
 * between tabs), we fall through to /dashboard. Existing users without
 * an org will then be bounced to /onboarding by the (app) layout, which
 * is the correct fallback behavior.
 *
 * Lives outside (app)/ on purpose — the (app) layout would redirect
 * brand-new users (no org yet) to /onboarding before our /api/projects
 * call runs and creates one for them.
 */
export default function PostSignupPage() {
  const router = useRouter();
  const [status, setStatus] = useState<
    "creating" | "redirecting" | "error" | "no-pending"
  >("creating");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      let pending: (QuickStartFormData & { savedAt?: number }) | null = null;
      try {
        const raw = localStorage.getItem(PENDING_PROJECT_STORAGE_KEY);
        if (raw) pending = JSON.parse(raw);
      } catch {
        // Malformed JSON or localStorage unavailable — treat as no
        // pending project. The user goes straight to dashboard /
        // onboarding.
      }

      if (!pending || !pending.name) {
        setStatus("no-pending");
        router.replace("/dashboard");
        return;
      }

      try {
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(quickStartToApiPayload(pending)),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || "Erreur lors de la création du projet");
        }
        const { project } = await res.json();
        // Only clear after we know the project was created — if the API
        // call failed we want to give the user a chance to retry without
        // losing their input.
        try {
          localStorage.removeItem(PENDING_PROJECT_STORAGE_KEY);
        } catch {
          // ignore
        }
        if (cancelled) return;
        setStatus("redirecting");
        router.replace(`/projects/${project.id}?match=auto`);
      } catch (e) {
        if (cancelled) return;
        setStatus("error");
        setErrorMessage(
          e instanceof Error ? e.message : "Erreur lors de la création du projet"
        );
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border-2 border-border bg-card p-8 shadow-[6px_6px_0px_0px_#1a1a1a] text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-border bg-[#c8f76f] shadow-[3px_3px_0px_0px_#1a1a1a]">
          {status === "error" ? (
            <Sparkles className="h-6 w-6" />
          ) : (
            <Loader2 className="h-6 w-6 animate-spin" />
          )}
        </div>

        {status === "creating" && (
          <>
            <h1 className="text-2xl font-black">On prépare vos résultats…</h1>
            <p className="mt-2 text-sm font-medium text-muted-foreground">
              Création du projet, nettoyage IA et matching avec 5 700+ subventions.
              Quelques secondes.
            </p>
          </>
        )}

        {status === "redirecting" && (
          <>
            <h1 className="text-2xl font-black">Redirection…</h1>
            <p className="mt-2 text-sm font-medium text-muted-foreground">
              Vos premières subventions arrivent.
            </p>
          </>
        )}

        {status === "no-pending" && (
          <>
            <h1 className="text-2xl font-black">Bienvenue !</h1>
            <p className="mt-2 text-sm font-medium text-muted-foreground">
              Redirection vers votre espace…
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="text-2xl font-black">Un instant…</h1>
            <p className="mt-2 text-sm font-medium text-muted-foreground">
              {errorMessage ||
                "Impossible de créer le projet automatiquement. Vous pouvez le créer manuellement depuis votre dashboard."}
            </p>
            <button
              onClick={() => router.replace("/dashboard")}
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl border-2 border-border bg-[#ffe066] px-5 py-2.5 text-sm font-bold shadow-[3px_3px_0px_0px_#1a1a1a] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_#1a1a1a] transition-all"
            >
              Aller au dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}
