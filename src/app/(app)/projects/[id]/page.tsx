import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  Download,
  Euro,
  FileText,
  Globe,
  MapPin,
  Sparkles,
  TrendingUp,
  Users,
  Activity,
  CheckCircle,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { ProjectActions } from "@/components/project-actions";
import { MatchButton } from "@/components/match-button";
import { ProjectMatches } from "@/components/project-matches";
import { resolveTier } from "@/lib/plan";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch project and verify ownership
  const { data: project, error } = await supabaseAdmin
    .from("projects")
    .select("*, organizations!inner(user_id, plan, plan_status)")
    .eq("id", id)
    .single();

  if (!project || error || (project.organizations as unknown as { user_id: string })?.user_id !== user.id) {
    notFound();
  }

  const orgInfo = project.organizations as unknown as {
    plan?: string | null;
    plan_status?: string | null;
  };
  const tier = resolveTier(orgInfo?.plan, orgInfo?.plan_status);

  // Fetch linked proposals and match scores in parallel
  const [{ data: proposals }, { data: matchScores }] = await Promise.all([
    supabaseAdmin
      .from("proposals")
      .select("*, grants(id, title, funder, deadline)")
      .eq("project_id", id)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("match_scores")
      .select(
        "*, grants(id, title, funder, summary, deadline, max_amount_eur, source_name, source_url, popularity_score)"
      )
      .eq("project_id", id)
      .order("score", { ascending: false })
      // No hard cap: show every scored grant so users see all ≥ 80 matches
      // and the long tail. The UI (ProjectMatches) collapses #8+ behind a
      // toggle, so rendering hundreds doesn't hurt.
      .limit(1000),
  ]);

  const proposalList = proposals || [];
  const matchList = matchScores || [];

  // Total money theoretically available = sum of max_amount_eur across every
  // match. Not a guarantee — some of these are mutually exclusive — but a
  // motivating "potential" number that shows the user how much headroom the
  // project has across all scored opportunities.
  const totalAvailableEur = matchList.reduce((sum, m) => {
    const amt = m.grants?.max_amount_eur;
    return sum + (amt ? Number(amt) : 0);
  }, 0);

  const formatBigEur = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".0", "")} M€`;
    if (n >= 1_000) return `${Math.round(n / 1_000)}k€`;
    return `${n} €`;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-start gap-4">
          <Link href="/dashboard">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-4 w-4 rounded-md border-2 border-border bg-[#c8f76f]" />
              <h1 className="text-3xl font-black text-foreground">
                {project.name}
              </h1>
            </div>
            {project.summary && (
              <p className="text-muted-foreground font-medium max-w-2xl mt-1">
                {project.summary}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <MatchButton projectId={project.id} />
          <Link href={`/grants?project_id=${project.id}`}>
            <Button variant="accent">
              <Sparkles className="h-4 w-4" />
              Explorer toutes les subventions
            </Button>
          </Link>
          <ProjectActions projectId={project.id} projectName={project.name} />
        </div>
      </div>

      {/* Key metrics row */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        {project.requested_amount_eur && (
          <div className="rounded-2xl border-2 border-border bg-[#c8f76f] p-5 shadow-[4px_4px_0px_0px_#1a1a1a]">
            <div className="flex items-center gap-3">
              <Euro className="h-6 w-6" />
              <div>
                <p className="text-2xl font-black">
                  {Number(project.requested_amount_eur).toLocaleString("fr-FR")} €
                </p>
                <p className="text-xs font-bold">Budget demandé</p>
              </div>
            </div>
          </div>
        )}

        {project.duration_months && (
          <div className="rounded-2xl border-2 border-border bg-[#ffe066] p-5 shadow-[4px_4px_0px_0px_#1a1a1a]">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6" />
              <div>
                <p className="text-2xl font-black">{project.duration_months} mois</p>
                <p className="text-xs font-bold">Durée du projet</p>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-2xl border-2 border-border bg-[#ffa3d1] p-5 shadow-[4px_4px_0px_0px_#1a1a1a]">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6" />
            <div>
              <p className="text-2xl font-black">{proposalList.length}</p>
              <p className="text-xs font-bold">Propositions</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-border bg-[#d4b5ff] p-5 shadow-[4px_4px_0px_0px_#1a1a1a]">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-6 w-6" />
            <div>
              <p className="text-2xl font-black">
                {totalAvailableEur > 0 ? formatBigEur(totalAvailableEur) : "—"}
              </p>
              <p className="text-xs font-bold">
                {totalAvailableEur > 0
                  ? `Disponibles · ${matchList.length} match${matchList.length > 1 ? "es" : ""}`
                  : "Argent disponible"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Project details grid */}
      <div className="grid gap-6 md:grid-cols-2 mb-10">
        {/* Objectives */}
        {project.objectives && project.objectives.length > 0 && (
          <div className="rounded-2xl border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_#1a1a1a]">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-border bg-[#c8f76f]">
                <TrendingUp className="h-4 w-4" />
              </div>
              <h3 className="text-lg font-black">Objectifs</h3>
            </div>
            <ul className="space-y-2">
              {project.objectives.map((obj: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm font-medium">
                  <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Beneficiaries */}
        {project.target_beneficiaries && project.target_beneficiaries.length > 0 && (
          <div className="rounded-2xl border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_#1a1a1a]">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-border bg-[#ffa3d1]">
                <Users className="h-4 w-4" />
              </div>
              <h3 className="text-lg font-black">Bénéficiaires cibles</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {project.target_beneficiaries.map((b: string) => (
                <Badge key={b} variant="pink">
                  {b}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Geography */}
        {project.target_geography && project.target_geography.length > 0 && (
          <div className="rounded-2xl border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_#1a1a1a]">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-border bg-[#a3d5ff]">
                <MapPin className="h-4 w-4" />
              </div>
              <h3 className="text-lg font-black">Géographie cible</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {project.target_geography.map((g: string) => (
                <Badge key={g} variant="blue">
                  <Globe className="h-3 w-3 mr-1" />
                  {g}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Indicators */}
        {project.indicators && project.indicators.length > 0 && (
          <div className="rounded-2xl border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_#1a1a1a]">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-border bg-[#ffe066]">
                <BarChart3 className="h-4 w-4" />
              </div>
              <h3 className="text-lg font-black">Indicateurs</h3>
            </div>
            <ul className="space-y-2">
              {project.indicators.map((ind: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm font-medium">
                  <Activity className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                  <span>{ind}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Match Scores — always rendered. Empty state guides to first run;
          otherwise delegates display to ProjectMatches (podium + top-7 + rest). */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black">
            Subventions matchées pour ce projet{" "}
            <span className="text-muted-foreground font-bold">
              ({matchList.filter((m) => m.score > 0).length})
            </span>
          </h2>
          {matchList.length > 0 && (
            <div className="flex gap-2">
              <Badge variant="green">
                {matchList.filter((m) => m.score >= 75).length} top matches
              </Badge>
            </div>
          )}
        </div>

        {matchList.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-border bg-[#c8f76f] shadow-[3px_3px_0px_0px_#1a1a1a]">
                <Sparkles className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-lg font-black text-foreground">
                Lance ton premier matching
              </h3>
              <p className="mt-2 max-w-md text-sm text-muted-foreground font-medium">
                Notre IA va scorer toutes les subventions actives contre ton
                projet (≈2 800 subventions). Ça prend moins de 30 secondes.
              </p>
              <div className="mt-6">
                <MatchButton projectId={project.id} />
              </div>
              <Link href={`/grants?project_id=${project.id}`} className="mt-4">
                <Button variant="outline" size="sm">
                  Ou parcourir le catalogue
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <ProjectMatches matches={matchList} projectId={project.id} tier={tier} />
        )}
      </div>

      {/* Proposals Section */}
      <div className="mb-10">
        <h2 className="text-xl font-black mb-4">
          Propositions liées{" "}
          <span className="text-muted-foreground font-bold">
            ({proposalList.length})
          </span>
        </h2>

        {proposalList.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-border bg-[#d4b5ff] shadow-[3px_3px_0px_0px_#1a1a1a]">
                <FileText className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-lg font-black text-foreground">
                Aucune proposition pour ce projet
              </h3>
              <p className="mt-2 max-w-md text-sm text-muted-foreground font-medium">
                Trouvez des subventions compatibles et générez votre première
                proposition en un clic.
              </p>
              <Link href={`/grants?project_id=${project.id}`}>
                <Button variant="accent" className="mt-6">
                  <Sparkles className="h-4 w-4" />
                  Trouver des subventions
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {proposalList.map((proposal) => (
              <div
                key={proposal.id}
                className="rounded-2xl border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_#1a1a1a] transition-all hover:shadow-[6px_6px_0px_0px_#1a1a1a] hover:translate-x-[-1px] hover:translate-y-[-1px]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="purple">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Généré par IA
                      </Badge>
                      <Badge
                        variant={
                          proposal.status === "draft"
                            ? "yellow"
                            : proposal.status === "submitted"
                              ? "green"
                              : "secondary"
                        }
                      >
                        {proposal.status === "draft"
                          ? "Brouillon"
                          : proposal.status === "submitted"
                            ? "Soumis"
                            : proposal.status}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-black mt-2">
                      {proposal.grants?.title || "Proposition"}
                    </h3>
                    <p className="text-sm font-semibold text-muted-foreground">
                      {proposal.grants?.funder || ""}
                    </p>
                    {proposal.content && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {typeof proposal.content === "string"
                          ? proposal.content.slice(0, 200)
                          : JSON.stringify(proposal.content).slice(0, 200)}
                        ...
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-xs font-bold text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(proposal.created_at).toLocaleDateString("fr-FR")}
                      </span>
                      {proposal.grants?.deadline && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Deadline:{" "}
                          {new Date(proposal.grants.deadline).toLocaleDateString(
                            "fr-FR"
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 ml-4 flex flex-col gap-2">
                    <Link href={`/proposals/${proposal.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        Voir le brouillon
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    <a
                      href={`/api/proposals/export?id=${proposal.id}`}
                      download
                    >
                      <Button variant="accent" size="sm" className="w-full">
                        <Download className="h-4 w-4" />
                        .docx
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="rounded-2xl border-2 border-border bg-[#a3d5ff] p-8 shadow-[4px_4px_0px_0px_#1a1a1a] text-center">
        <h3 className="text-xl font-black">
          Prêt à trouver la subvention idéale ?
        </h3>
        <p className="text-sm font-medium text-muted-foreground mt-2 max-w-lg mx-auto">
          Notre IA analyse votre projet et le compare à des centaines de
          subventions pour trouver les meilleures opportunités.
        </p>
        <Link href={`/grants?project_id=${project.id}`}>
          <Button variant="accent" className="mt-4">
            <Sparkles className="h-4 w-4" />
            Générer une proposition
          </Button>
        </Link>
      </div>
    </div>
  );
}
