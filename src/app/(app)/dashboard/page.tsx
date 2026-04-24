import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  FileText,
  ArrowRight,
  Clock,
  Plus,
  Sparkles,
  FolderOpen,
  Search,
  Wand2,
  Building2,
} from "lucide-react";
import Link from "next/link";

const PROJECT_COLORS = [
  "bg-[#c8f76f]",
  "bg-[#a3d5ff]",
  "bg-[#ffe066]",
  "bg-[#ffa3d1]",
  "bg-[#d4b5ff]",
];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ first?: string; skipped?: string }>;
}) {
  const sp = await searchParams;
  const isFirstVisit = sp?.first === "1";
  const didSkipOnboarding = sp?.skipped === "1";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Get user's organization
  const { data: org } = await supabaseAdmin
    .from("organizations")
    .select("id")
    .eq("user_id", user.id)
    .single();

  // Fetch user's projects
  const { data: projects } = org
    ? await supabaseAdmin
        .from("projects")
        .select("*")
        .eq("organization_id", org.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  // Fetch stats in parallel
  const now = new Date().toISOString().split("T")[0];
  const in30 = new Date(Date.now() + 30 * 86400000)
    .toISOString()
    .split("T")[0];

  const [
    { count: grantsCount },
    { count: matchCount },
    { count: proposalCount },
    { count: deadlineCount },
  ] = await Promise.all([
    supabaseAdmin
      .from("grants")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    org
      ? supabaseAdmin
          .from("match_scores")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", org.id)
      : Promise.resolve({ count: 0 }),
    org
      ? supabaseAdmin
          .from("proposals")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", org.id)
      : Promise.resolve({ count: 0 }),
    supabaseAdmin
      .from("grants")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")
      .gte("deadline", now)
      .lte("deadline", in30),
  ]);

  const projectList = projects || [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground">Dashboard</h1>
          <p className="text-muted-foreground font-medium">
            Vue d&apos;ensemble de vos projets et opportunités
          </p>
        </div>
        <Link href="/projects/new">
          <Button variant="accent">
            <Plus className="h-4 w-4" />
            Nouveau projet
          </Button>
        </Link>
      </div>

      {/* First-visit welcome banner — shown only after onboarding redirects
          back here with ?first=1. Guides the next step explicitly instead of
          leaving the user staring at empty stats. */}
      {isFirstVisit && (
        <div className="mt-6 rounded-2xl border-2 border-border bg-[#c8f76f] p-6 shadow-[4px_4px_0px_0px_#1a1a1a]">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-border bg-[#1a1a1a] text-[#c8f76f] shadow-[3px_3px_0px_0px_#1a1a1a]">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-black">
                Bienvenue ! Voici comment Emile fonctionne.
              </h2>
              <p className="text-sm font-medium mt-1">
                {didSkipOnboarding
                  ? "Tu pourras compléter ton profil plus tard — en attendant, voici les étapes pour trouver tes premières subventions."
                  : "Ton organisation est configurée. Maintenant, crée ton premier projet pour que notre IA puisse matcher les subventions pertinentes."}
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border-2 border-border bg-background p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md border-2 border-border bg-[#ffe066] text-xs font-black">
                      1
                    </span>
                    <p className="text-sm font-black">Crée un projet</p>
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Décris ton projet en un paragraphe, notre IA structure le
                    reste en 10 secondes.
                  </p>
                </div>
                <div className="rounded-xl border-2 border-border bg-background p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md border-2 border-border bg-[#ffa3d1] text-xs font-black">
                      2
                    </span>
                    <p className="text-sm font-black">Lance le matching</p>
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">
                    On score les ~2 800 subventions actives contre ton projet
                    en moins de 30 secondes.
                  </p>
                </div>
                <div className="rounded-xl border-2 border-border bg-background p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md border-2 border-border bg-[#d4b5ff] text-xs font-black">
                      3
                    </span>
                    <p className="text-sm font-black">
                      Génère un brouillon
                    </p>
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Choisis une bonne match, clique, télécharge le .docx —
                    tout est pré-rédigé.
                  </p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Link href="/projects/new">
                  <Button variant="default">
                    <Wand2 className="h-4 w-4" />
                    Créer mon premier projet
                  </Button>
                </Link>
                {didSkipOnboarding && (
                  <Link href="/profile">
                    <Button variant="outline">
                      <Building2 className="h-4 w-4" />
                      Compléter mon profil asso
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border-2 border-border bg-[#c8f76f] p-5 shadow-[4px_4px_0px_0px_#1a1a1a]">
          <div className="flex items-center gap-3">
            <FolderOpen className="h-6 w-6" />
            <div>
              <p className="text-3xl font-black">{projectList.length}</p>
              <p className="text-xs font-bold">Projets actifs</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-border bg-[#ffe066] p-5 shadow-[4px_4px_0px_0px_#1a1a1a]">
          <div className="flex items-center gap-3">
            <Target className="h-6 w-6" />
            <div>
              <p className="text-3xl font-black">{grantsCount || 0}</p>
              <p className="text-xs font-bold">Subventions actives</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-border bg-[#ffa3d1] p-5 shadow-[4px_4px_0px_0px_#1a1a1a]">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6" />
            <div>
              <p className="text-3xl font-black">{deadlineCount || 0}</p>
              <p className="text-xs font-bold">Deadlines ce mois</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-border bg-[#d4b5ff] p-5 shadow-[4px_4px_0px_0px_#1a1a1a]">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6" />
            <div>
              <p className="text-3xl font-black">{proposalCount || 0}</p>
              <p className="text-xs font-bold">Propositions créées</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="mt-6">
        <Link href="/grants">
          <div className="inline-flex items-center gap-2 rounded-xl border-2 border-border bg-[#ffe066] px-4 py-2.5 font-bold shadow-[3px_3px_0px_0px_#1a1a1a] hover:shadow-[5px_5px_0px_0px_#1a1a1a] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all">
            <Search className="h-4 w-4" />
            Explorer les {grantsCount || 0} subventions disponibles
            <ArrowRight className="h-4 w-4" />
          </div>
        </Link>
      </div>

      {/* Projects */}
      <h2 className="mt-10 text-xl font-black">Mes projets</h2>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {projectList.length > 0 ? (
          projectList.map((project, i) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="hover:shadow-[6px_6px_0px_0px_#1a1a1a] hover:translate-x-[-1px] hover:translate-y-[-1px] cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <div
                      className={`h-5 w-5 rounded-lg border-2 border-border ${PROJECT_COLORS[i % PROJECT_COLORS.length]} shrink-0 mt-0.5`}
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-black">{project.name}</h3>
                      {project.summary && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {project.summary}
                        </p>
                      )}
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {project.themes?.map((t: string) => (
                          <Badge key={t} variant="secondary">
                            {t}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center gap-4 mt-4 text-sm font-bold">
                        {project.budget && (
                          <span className="text-muted-foreground">
                            {Number(project.budget).toLocaleString("fr-FR")} €
                          </span>
                        )}
                        {project.duration_months && (
                          <span className="text-muted-foreground">
                            {project.duration_months} mois
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-2 text-center py-8">
            <p className="text-muted-foreground font-medium">
              Aucun projet pour l&apos;instant. Créez votre premier projet !
            </p>
          </div>
        )}

        {/* New project card */}
        <Link href="/projects/new">
          <div className="flex items-center justify-center h-full min-h-[160px] rounded-2xl border-2 border-dashed border-border bg-background hover:bg-secondary transition-colors cursor-pointer">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border-2 border-border bg-[#c8f76f] shadow-[3px_3px_0px_0px_#1a1a1a]">
                <Plus className="h-6 w-6" strokeWidth={3} />
              </div>
              <p className="mt-3 text-sm font-bold text-muted-foreground">
                Créer un nouveau projet
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
