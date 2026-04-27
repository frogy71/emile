import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { Bookmark, Calendar, Euro, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UnsaveButton } from "@/components/unsave-button";

type SavedRow = {
  id: string;
  created_at: string;
  project_id: string | null;
  grant_id: string;
  grants: {
    id: string;
    title: string;
    funder: string | null;
    summary: string | null;
    deadline: string | null;
    max_amount_eur: number | null;
    source_name: string | null;
    thematic_areas: string[] | null;
    status: string | null;
  } | null;
};

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function deadlineBadge(days: number | null): {
  label: string;
  className: string;
} | null {
  if (days === null) return null;
  if (days < 0) {
    return {
      label: "Expirée",
      className: "bg-secondary text-muted-foreground",
    };
  }
  if (days <= 14) {
    return {
      label: `J-${days}`,
      className: "bg-[#ffa3d1] text-foreground",
    };
  }
  if (days <= 30) {
    return {
      label: `J-${days}`,
      className: "bg-[#ffe066] text-foreground",
    };
  }
  return {
    label: `J-${days}`,
    className: "bg-[#c8f76f] text-foreground",
  };
}

function formatEur(n: number | null | undefined): string | null {
  if (!n) return null;
  if (n >= 1_000_000)
    return `${(n / 1_000_000).toFixed(1).replace(".0", "")} M€`;
  if (n >= 1_000) return `${Math.round(n / 1_000)} k€`;
  return `${n} €`;
}

export default async function SavedGrantsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: org } = await supabaseAdmin
    .from("organizations")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!org) redirect("/onboarding");

  const [{ data: savedRaw }, { data: projects }] = await Promise.all([
    supabaseAdmin
      .from("user_grant_interactions")
      .select(
        "id, created_at, project_id, grant_id, grants(id, title, funder, summary, deadline, max_amount_eur, source_name, thematic_areas, status)"
      )
      .eq("organization_id", org.id)
      .eq("interaction_type", "save")
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("projects")
      .select("id, name")
      .eq("organization_id", org.id),
  ]);

  const saved = (savedRaw || []) as unknown as SavedRow[];
  const projectMap = new Map(
    (projects || []).map((p: { id: string; name: string }) => [p.id, p.name])
  );

  // Group saved grants by project — projects help users batch their work,
  // and "no project" gets its own bucket so unattached saves stay visible.
  const NO_PROJECT_KEY = "__none__";
  const groups = new Map<string, SavedRow[]>();
  for (const row of saved) {
    const key = row.project_id || NO_PROJECT_KEY;
    const list = groups.get(key) || [];
    list.push(row);
    groups.set(key, list);
  }

  const groupOrder = Array.from(groups.keys()).sort((a, b) => {
    if (a === NO_PROJECT_KEY) return 1;
    if (b === NO_PROJECT_KEY) return -1;
    return (projectMap.get(a) || "").localeCompare(projectMap.get(b) || "");
  });

  const totalPotential = saved.reduce((sum, row) => {
    const amount = row.grants?.max_amount_eur;
    return typeof amount === "number" ? sum + amount : sum;
  }, 0);

  return (
    <div>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-border bg-[#ffa3d1] shadow-[3px_3px_0px_0px_#1a1a1a]">
              <Bookmark className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-black text-foreground">
              Mes subventions sauvegardées
            </h1>
          </div>
          <p className="text-muted-foreground font-medium">
            {saved.length} subvention{saved.length > 1 ? "s" : ""} sauvegardée
            {saved.length > 1 ? "s" : ""}
            {totalPotential > 0 && (
              <>
                {" · "}
                <span className="font-bold text-foreground">
                  {formatEur(totalPotential)} de potentiel
                </span>
              </>
            )}
          </p>
        </div>
        <Link href="/grants">
          <Button variant="outline">
            <Search className="h-4 w-4" />
            Explorer le catalogue
          </Button>
        </Link>
      </div>

      {saved.length === 0 ? (
        <div className="mt-10 rounded-2xl border-2 border-dashed border-border bg-card p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-border bg-[#ffe066] shadow-[3px_3px_0px_0px_#1a1a1a]">
            <Bookmark className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-xl font-black">
            Pas encore de subventions sauvegardées
          </h2>
          <p className="mt-2 text-sm font-medium text-muted-foreground max-w-md mx-auto">
            Sauvegarde une subvention depuis sa fiche pour la retrouver ici.
            Les sauvegardes sont triées par projet et signalent automatiquement
            les deadlines proches.
          </p>
          <Link href="/grants" className="inline-block mt-5">
            <Button variant="accent">
              <Sparkles className="h-4 w-4" />
              Découvrir les subventions
            </Button>
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {groupOrder.map((key) => {
            const rows = groups.get(key) || [];
            const projectName =
              key === NO_PROJECT_KEY
                ? "Sans projet associé"
                : projectMap.get(key) || "Projet";
            return (
              <section key={key}>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-lg font-black">{projectName}</h2>
                  <span className="text-xs font-bold text-muted-foreground">
                    ({rows.length})
                  </span>
                </div>
                <div className="space-y-3">
                  {rows.map((row) => {
                    const grant = row.grants;
                    if (!grant) return null;
                    const days = grant.deadline
                      ? daysUntil(grant.deadline)
                      : null;
                    const badge = deadlineBadge(days);
                    const amount = formatEur(grant.max_amount_eur);
                    return (
                      <div
                        key={row.id}
                        className="rounded-2xl border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_#1a1a1a] transition-all hover:shadow-[6px_6px_0px_0px_#1a1a1a] hover:translate-x-[-1px] hover:translate-y-[-1px]"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                              {grant.source_name && (
                                <Badge variant="secondary" className="text-[10px]">
                                  {grant.source_name}
                                </Badge>
                              )}
                              {badge && (
                                <span
                                  className={`inline-flex items-center gap-1 rounded-md border-2 border-border px-2 py-0.5 text-[10px] font-black ${badge.className}`}
                                >
                                  {badge.label}
                                </span>
                              )}
                              {grant.thematic_areas
                                ?.slice(0, 3)
                                .map((t) => (
                                  <Badge key={t} variant="secondary">
                                    {t}
                                  </Badge>
                                ))}
                            </div>

                            <Link
                              href={`/grants/${grant.id}`}
                              className="block group"
                            >
                              <h3 className="text-lg font-black leading-tight group-hover:underline decoration-2 underline-offset-2">
                                {grant.title}
                              </h3>
                            </Link>
                            {grant.funder && (
                              <p className="text-sm font-semibold text-muted-foreground mt-0.5">
                                {grant.funder}
                              </p>
                            )}
                            {grant.summary && (
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                {grant.summary}
                              </p>
                            )}

                            <div className="flex items-center gap-5 mt-3 text-sm font-semibold text-muted-foreground flex-wrap">
                              {grant.deadline && (
                                <span className="flex items-center gap-1.5">
                                  <Calendar className="h-3.5 w-3.5" />
                                  {new Date(grant.deadline).toLocaleDateString(
                                    "fr-FR"
                                  )}
                                </span>
                              )}
                              {amount && (
                                <span className="flex items-center gap-1.5">
                                  <Euro className="h-3.5 w-3.5" />
                                  Jusqu&apos;à {amount}
                                </span>
                              )}
                              <span className="text-xs px-2 py-0.5 rounded-lg bg-secondary">
                                Sauvegardée le{" "}
                                {new Date(row.created_at).toLocaleDateString(
                                  "fr-FR"
                                )}
                              </span>
                            </div>
                          </div>

                          <div className="shrink-0 flex flex-col gap-2">
                            <Link href={`/grants/${grant.id}`}>
                              <Button variant="outline" size="sm">
                                Voir la fiche
                              </Button>
                            </Link>
                            <UnsaveButton grantId={grant.id} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
