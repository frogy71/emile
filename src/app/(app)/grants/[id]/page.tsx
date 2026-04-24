import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GenerateProposalButton } from "@/components/generate-proposal-button";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  Euro,
  ExternalLink,
  Globe,
  MapPin,
  Sparkles,
  Target,
} from "lucide-react";
import Link from "next/link";

/**
 * /grants/[id] — single grant detail page.
 *
 * This is where users land from:
 *   - The catalogue /grants list
 *   - The project podium ("Générer une proposition")
 *   - External email alerts
 *
 * The page shows the full grant record (summary, eligibility, amounts, link
 * to the funder's site) plus — if the user passed ?project_id=X — a one-click
 * "Generate proposal" action. Without a project, the CTA prompts them to
 * create one first since proposals without a logframe are useless.
 */
export default async function GrantDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ project_id?: string }>;
}) {
  const { id } = await params;
  const { project_id: projectIdFromUrl } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: grant, error } = await supabaseAdmin
    .from("grants")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !grant) notFound();

  // Resolve org for proposal generation
  const { data: org } = await supabaseAdmin
    .from("organizations")
    .select("id, name")
    .eq("user_id", user.id)
    .single();

  // Fetch projects for the "choose a project" picker (if no ?project_id)
  const { data: projects } = org
    ? await supabaseAdmin
        .from("projects")
        .select("id, name")
        .eq("organization_id", org.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  // Existing proposal for this org+grant+project (don't re-generate if one exists)
  let existingProposalId: string | null = null;
  if (org && projectIdFromUrl) {
    const { data: existing } = await supabaseAdmin
      .from("proposals")
      .select("id")
      .eq("organization_id", org.id)
      .eq("grant_id", grant.id)
      .eq("project_id", projectIdFromUrl)
      .limit(1)
      .maybeSingle();
    existingProposalId = existing?.id || null;
  }

  // Match score for this org+grant+project, if already computed
  let matchScore: number | null = null;
  if (org && projectIdFromUrl) {
    const { data: score } = await supabaseAdmin
      .from("match_scores")
      .select("score")
      .eq("organization_id", org.id)
      .eq("grant_id", grant.id)
      .eq("project_id", projectIdFromUrl)
      .maybeSingle();
    matchScore = score?.score ?? null;
  }

  const days = grant.deadline
    ? Math.ceil(
        (new Date(grant.deadline).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <Link href={projectIdFromUrl ? `/projects/${projectIdFromUrl}` : "/grants"}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {grant.source_name && (
              <Badge variant="secondary">{grant.source_name}</Badge>
            )}
            {grant.country && (
              <Badge variant={grant.country === "EU" ? "blue" : "yellow"}>
                {grant.country}
              </Badge>
            )}
            {grant.grant_type && (
              <Badge variant="purple">{grant.grant_type}</Badge>
            )}
            {matchScore !== null && (
              <Badge variant="green">
                <Target className="h-3 w-3 mr-1" />
                Score {matchScore}/100
              </Badge>
            )}
          </div>
          <h1 className="text-3xl font-black text-foreground leading-tight">
            {grant.title}
          </h1>
          {grant.funder && (
            <p className="text-lg font-bold text-muted-foreground mt-1">
              {grant.funder}
            </p>
          )}
        </div>
      </div>

      {/* Meta grid */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        {grant.deadline && (
          <div className="rounded-2xl border-2 border-border bg-[#ffa3d1] p-5 shadow-[4px_4px_0px_0px_#1a1a1a]">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider">
              <Calendar className="h-4 w-4" />
              Deadline
            </div>
            <p className="text-xl font-black mt-1">
              {new Date(grant.deadline).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            {days !== null && days >= 0 && (
              <p className="text-xs font-bold mt-1">
                {days === 0 ? "Aujourd'hui" : `Dans ${days} jour${days > 1 ? "s" : ""}`}
              </p>
            )}
            {days !== null && days < 0 && (
              <p className="text-xs font-bold mt-1 text-red-700">Expiré</p>
            )}
          </div>
        )}

        <div className="rounded-2xl border-2 border-border bg-[#c8f76f] p-5 shadow-[4px_4px_0px_0px_#1a1a1a]">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider">
            <Euro className="h-4 w-4" />
            Montant
          </div>
          <p className="text-xl font-black mt-1">
            {grant.max_amount_eur
              ? `Jusqu'à ${Number(grant.max_amount_eur).toLocaleString("fr-FR")} €`
              : "Non précisé"}
          </p>
          {grant.min_amount_eur != null && (
            <p className="text-xs font-bold mt-1">
              Minimum {Number(grant.min_amount_eur).toLocaleString("fr-FR")} €
            </p>
          )}
        </div>

        <div className="rounded-2xl border-2 border-border bg-[#ffe066] p-5 shadow-[4px_4px_0px_0px_#1a1a1a]">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider">
            <Clock className="h-4 w-4" />
            Cofinancement
          </div>
          <p className="text-xl font-black mt-1">
            {grant.co_financing_required ? "Requis" : "Non requis"}
          </p>
          {grant.co_financing_required && (
            <p className="text-xs font-bold mt-1">
              Prévois un apport complémentaire
            </p>
          )}
        </div>
      </div>

      {/* Summary */}
      {grant.summary && (
        <div className="rounded-2xl border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_#1a1a1a] mb-6">
          <h2 className="text-lg font-black mb-3">Description</h2>
          <div className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-foreground">
            {grant.summary}
          </div>
        </div>
      )}

      {/* Eligibility grid */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        {grant.eligible_entities && grant.eligible_entities.length > 0 && (
          <div className="rounded-2xl border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_#1a1a1a]">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-4 w-4" />
              <h3 className="text-sm font-black">Entités éligibles</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {grant.eligible_entities.map((e: string) => (
                <Badge key={e} variant="secondary">
                  {e}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {grant.eligible_countries && grant.eligible_countries.length > 0 && (
          <div className="rounded-2xl border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_#1a1a1a]">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4" />
              <h3 className="text-sm font-black">Pays / zones éligibles</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {grant.eligible_countries.map((c: string) => (
                <Badge key={c} variant="blue">
                  <Globe className="h-3 w-3 mr-1" />
                  {c}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {grant.thematic_areas && grant.thematic_areas.length > 0 && (
          <div className="rounded-2xl border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_#1a1a1a] md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4" />
              <h3 className="text-sm font-black">Thématiques</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {grant.thematic_areas.map((t: string) => (
                <Badge key={t} variant="purple">
                  {t}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action bar */}
      <div className="sticky bottom-4 rounded-2xl border-2 border-border bg-[#c8f76f] p-5 shadow-[6px_6px_0px_0px_#1a1a1a]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-black">Prêt à postuler ?</h3>
            <p className="text-xs font-bold text-foreground/70">
              {existingProposalId
                ? "Tu as déjà un brouillon pour cette combinaison projet × subvention."
                : projectIdFromUrl
                  ? "Génère un brouillon de proposition adapté à ton projet en 30 secondes."
                  : "Choisis un projet pour générer une proposition adaptée."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {grant.source_url && (
              <a
                href={grant.source_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline">
                  <ExternalLink className="h-4 w-4" />
                  Site officiel du bailleur
                </Button>
              </a>
            )}

            {existingProposalId ? (
              <Link href={`/proposals/${existingProposalId}`}>
                <Button variant="default">
                  <Sparkles className="h-4 w-4" />
                  Voir le brouillon existant
                </Button>
              </Link>
            ) : org ? (
              <GenerateProposalButton
                organizationId={org.id}
                grantId={grant.id}
                projects={projects || []}
                preselectedProjectId={projectIdFromUrl || null}
              />
            ) : (
              <Link href="/onboarding">
                <Button variant="default">Configurer mon organisation</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
