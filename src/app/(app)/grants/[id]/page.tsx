import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GenerateProposalButton } from "@/components/generate-proposal-button";
import { GrantInteractions, type InteractionType } from "@/components/grant-interactions";
import { resolveTier } from "@/lib/plan";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CalendarCheck,
  CheckSquare,
  Clock,
  Euro,
  ExternalLink,
  FileText,
  Globe,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import Link from "next/link";

/**
 * /grants/[id] — single grant detail page.
 *
 * Uniform template (matches the spec we publish to NGOs): the page always
 * renders the same sections in the same order regardless of how rich the
 * underlying record is. Missing fields render as a muted "Non renseigné"
 * placeholder rather than disappearing — that way users can mentally model
 * what's known vs. unknown about a call, and the page never looks broken.
 *
 * Field provenance (read top-to-bottom):
 *   1. Direct API mappings from the ingest transforms
 *      (Aides-Territoires's application_url + contact, EU SEDIA's startDate…)
 *   2. AI enrichment pass that scrapes the source page and asks Haiku to
 *      extract open_date, difficulty, eligibility, required documents,
 *      contact info and co-financing % — see lib/ai/grant-enricher.ts
 *   3. Original ingestion fields (deadline, amounts, summary, raw_content)
 */

const NOT_PROVIDED = "Non renseigné";

const DIFFICULTY_META: Record<
  "easy" | "medium" | "hard" | "expert",
  { label: string; bg: string; description: string }
> = {
  easy: {
    label: "Facile",
    bg: "bg-[#c8f76f]",
    description: "Formulaire court, peu de pièces, sélection légère",
  },
  medium: {
    label: "Moyen",
    bg: "bg-[#ffe066]",
    description: "Dossier classique avec budget et lettre de motivation",
  },
  hard: {
    label: "Difficile",
    bg: "bg-[#ffa3d1]",
    description: "Appel à projets avec rapport détaillé, jury, audition possible",
  },
  expert: {
    label: "Expert",
    bg: "bg-[#ff6b6b] text-white",
    description: "Programme européen ou consortium recherche, due diligence longue",
  },
};

function deadlineColor(days: number | null): { bg: string; text: string } {
  if (days === null) return { bg: "bg-card", text: "text-foreground" };
  if (days < 0) return { bg: "bg-[#ff6b6b]", text: "text-white" };
  if (days <= 14) return { bg: "bg-[#ffa3d1]", text: "text-foreground" };
  if (days <= 60) return { bg: "bg-[#ffe066]", text: "text-foreground" };
  return { bg: "bg-[#c8f76f]", text: "text-foreground" };
}

function daysUntil(target: string | null | undefined): number | null {
  if (!target) return null;
  const t = new Date(target).getTime();
  if (Number.isNaN(t)) return null;
  // Date.now() is impure but this is a server component evaluated once per
  // request — extracting it into a helper hides it from the
  // react-hooks/purity rule (which fires inside JSX render bodies).
  return Math.ceil((t - Date.now()) / (1000 * 60 * 60 * 24));
}

function formatDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function NotProvided({ className = "" }: { className?: string }) {
  return (
    <span className={`text-sm font-bold text-muted-foreground italic ${className}`}>
      {NOT_PROVIDED}
    </span>
  );
}

function SectionShell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_#1a1a1a] ${className}`}
    >
      {children}
    </section>
  );
}

function SectionTitle({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-border bg-[#ffe066]">
        {icon}
      </div>
      <h2 className="text-lg font-black uppercase tracking-tight">{children}</h2>
    </div>
  );
}

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

  const { data: org } = await supabaseAdmin
    .from("organizations")
    .select("id, name, plan, plan_status")
    .eq("user_id", user.id)
    .single();

  const tier = resolveTier(org?.plan, org?.plan_status);

  const { data: projects } = org
    ? await supabaseAdmin
        .from("projects")
        .select("id, name")
        .eq("organization_id", org.id)
        .order("created_at", { ascending: false })
    : { data: [] };

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

  let existingInteractions: InteractionType[] = [];
  if (org) {
    const { data: interactionRows } = await supabaseAdmin
      .from("user_grant_interactions")
      .select("interaction_type")
      .eq("organization_id", org.id)
      .eq("grant_id", grant.id);
    existingInteractions = (interactionRows || [])
      .map((r) => r.interaction_type as InteractionType)
      .filter((t): t is InteractionType =>
        ["like", "dislike", "save", "dismiss", "apply"].includes(t)
      );
  }

  const days = daysUntil(grant.deadline);

  // Duration between open and deadline (in days). Only renders when both ends
  // are known and the deadline is after the open date (ingested feeds
  // occasionally invert these on multi-stage calls).
  let durationDays: number | null = null;
  if (grant.open_date && grant.deadline) {
    const ms =
      new Date(grant.deadline).getTime() - new Date(grant.open_date).getTime();
    if (ms > 0) durationDays = Math.ceil(ms / (1000 * 60 * 60 * 24));
  }

  const dl = deadlineColor(days);
  const difficulty = grant.difficulty_level
    ? DIFFICULTY_META[grant.difficulty_level as keyof typeof DIFFICULTY_META]
    : null;

  const candidateUrl =
    grant.application_url || grant.source_url || null;
  const formattedOpenDate = formatDate(grant.open_date);
  const formattedDeadline = formatDate(grant.deadline);
  const formattedUpdatedAt = formatDate(grant.updated_at);

  // Co-financing display: percent wins (most precise), boolean is a fallback
  // for legacy rows. Pre-enrichment grants that only have the boolean still
  // show a meaningful answer.
  let coFinanceText: string | null = null;
  if (typeof grant.co_financing_pct === "number") {
    coFinanceText =
      grant.co_financing_pct > 0
        ? `${grant.co_financing_pct}% à la charge du porteur`
        : "Aucun cofinancement requis";
  } else if (grant.co_financing_required === true) {
    coFinanceText = "Cofinancement requis (montant non précisé)";
  } else if (grant.co_financing_required === false) {
    coFinanceText = "Aucun cofinancement requis";
  }

  const amountText = (() => {
    const min = grant.min_amount_eur;
    const max = grant.max_amount_eur;
    if (typeof min === "number" && typeof max === "number" && min !== max) {
      return `${min.toLocaleString("fr-FR")} € — ${max.toLocaleString("fr-FR")} €`;
    }
    if (typeof max === "number") {
      return `Jusqu'à ${max.toLocaleString("fr-FR")} €`;
    }
    if (typeof min === "number") {
      return `À partir de ${min.toLocaleString("fr-FR")} €`;
    }
    return null;
  })();

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <div>
        <Link href={projectIdFromUrl ? `/projects/${projectIdFromUrl}` : "/grants"}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        </Link>
      </div>

      {/* Section 1 — Header */}
      <SectionShell className="bg-[#fff8e8]">
        <div className="flex flex-wrap items-center gap-2 mb-3">
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
          {grant.popularity_score > 0 && (
            <Badge variant="purple">
              <Users className="h-3 w-3 mr-1" />
              {grant.popularity_score} ONG intéressée
              {grant.popularity_score > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-foreground leading-tight">
          {grant.title}
        </h1>
        {grant.funder ? (
          <p className="text-lg font-bold text-muted-foreground mt-2">
            {grant.funder}
          </p>
        ) : (
          <div className="mt-2"><NotProvided /></div>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {candidateUrl ? (
            <a href={candidateUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="default" size="lg">
                Candidater <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
          ) : (
            <Button variant="default" size="lg" disabled>
              Candidater <ExternalLink className="h-4 w-4" />
            </Button>
          )}
        </div>
      </SectionShell>

      {/* Section 2 — Dates */}
      <SectionShell>
        <SectionTitle icon={<Calendar className="h-4 w-4" />}>Dates</SectionTitle>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border-2 border-border bg-[#fff8e8] p-4 shadow-[3px_3px_0px_0px_#1a1a1a]">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider mb-2">
              <CalendarCheck className="h-4 w-4" />
              Ouverture
            </div>
            {formattedOpenDate ? (
              <p className="text-base font-black">{formattedOpenDate}</p>
            ) : (
              <NotProvided />
            )}
          </div>

          <div
            className={`rounded-xl border-2 border-border ${dl.bg} ${dl.text} p-4 shadow-[3px_3px_0px_0px_#1a1a1a]`}
          >
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider mb-2">
              <Calendar className="h-4 w-4" />
              Clôture
            </div>
            {formattedDeadline ? (
              <>
                <p className="text-base font-black">{formattedDeadline}</p>
                {days !== null && (
                  <p className="text-xs font-bold mt-1">
                    {days < 0
                      ? `Expiré (J+${Math.abs(days)})`
                      : days === 0
                        ? "Aujourd'hui"
                        : `J-${days}`}
                  </p>
                )}
              </>
            ) : (
              <NotProvided />
            )}
          </div>

          <div className="rounded-xl border-2 border-border bg-[#fff8e8] p-4 shadow-[3px_3px_0px_0px_#1a1a1a]">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider mb-2">
              <Clock className="h-4 w-4" />
              Durée
            </div>
            {durationDays !== null ? (
              <p className="text-base font-black">
                {durationDays} jour{durationDays > 1 ? "s" : ""}
              </p>
            ) : (
              <NotProvided />
            )}
          </div>
        </div>
      </SectionShell>

      {/* Section 3 — Financement */}
      <SectionShell>
        <SectionTitle icon={<Euro className="h-4 w-4" />}>Financement</SectionTitle>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border-2 border-border bg-[#c8f76f] p-4 shadow-[3px_3px_0px_0px_#1a1a1a]">
            <div className="text-xs font-black uppercase tracking-wider mb-2">
              Montant
            </div>
            {amountText ? (
              <p className="text-xl font-black">{amountText}</p>
            ) : (
              <NotProvided />
            )}
          </div>
          <div className="rounded-xl border-2 border-border bg-[#fff8e8] p-4 shadow-[3px_3px_0px_0px_#1a1a1a]">
            <div className="text-xs font-black uppercase tracking-wider mb-2">
              Cofinancement
            </div>
            {coFinanceText ? (
              <p className="text-base font-black">{coFinanceText}</p>
            ) : (
              <NotProvided />
            )}
          </div>
        </div>
      </SectionShell>

      {/* Section 4 — Niveau de difficulté */}
      <SectionShell>
        <SectionTitle icon={<Target className="h-4 w-4" />}>
          Niveau de difficulté
        </SectionTitle>
        {difficulty ? (
          <div
            className={`inline-flex flex-col gap-1 rounded-xl border-2 border-border ${difficulty.bg} px-5 py-3 shadow-[3px_3px_0px_0px_#1a1a1a]`}
          >
            <span className="text-xl font-black uppercase">{difficulty.label}</span>
            <span className="text-xs font-bold">{difficulty.description}</span>
          </div>
        ) : (
          <NotProvided />
        )}
      </SectionShell>

      {/* Section 5 — Conditions d'éligibilité */}
      <SectionShell>
        <SectionTitle icon={<Building2 className="h-4 w-4" />}>
          Conditions d&apos;éligibilité
        </SectionTitle>
        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider mb-2 text-muted-foreground">
              Entités éligibles
            </h3>
            {grant.eligible_entities && grant.eligible_entities.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {grant.eligible_entities.map((e: string) => (
                  <Badge key={e} variant="secondary">
                    {e}
                  </Badge>
                ))}
              </div>
            ) : (
              <NotProvided />
            )}
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-wider mb-2 text-muted-foreground">
              Pays / zones éligibles
            </h3>
            {grant.eligible_countries && grant.eligible_countries.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {grant.eligible_countries.map((c: string) => (
                  <Badge key={c} variant="blue">
                    <Globe className="h-3 w-3 mr-1" />
                    {c}
                  </Badge>
                ))}
              </div>
            ) : (
              <NotProvided />
            )}
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-wider mb-2 text-muted-foreground">
              Conditions
            </h3>
            {grant.eligibility_conditions ? (
              <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed">
                {grant.eligibility_conditions}
              </p>
            ) : (
              <NotProvided />
            )}
          </div>

          {grant.thematic_areas && grant.thematic_areas.length > 0 && (
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider mb-2 text-muted-foreground">
                Thématiques
              </h3>
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
      </SectionShell>

      {/* Section 6 — Documents requis */}
      <SectionShell>
        <SectionTitle icon={<FileText className="h-4 w-4" />}>
          Documents requis
        </SectionTitle>
        {grant.required_documents && grant.required_documents.length > 0 ? (
          <ul className="space-y-2">
            {grant.required_documents.map((doc: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm font-medium">
                <CheckSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{doc}</span>
              </li>
            ))}
          </ul>
        ) : (
          <NotProvided />
        )}
      </SectionShell>

      {/* Section 7 — Description */}
      <SectionShell>
        <SectionTitle icon={<Sparkles className="h-4 w-4" />}>Description</SectionTitle>
        {grant.summary || grant.raw_content ? (
          <div className="space-y-4">
            {grant.summary && (
              <div className="whitespace-pre-wrap text-sm font-medium leading-relaxed">
                {grant.summary}
              </div>
            )}
            {grant.raw_content && grant.raw_content !== grant.summary && (
              <details className="group">
                <summary className="cursor-pointer text-xs font-black uppercase tracking-wider text-muted-foreground hover:text-foreground">
                  Contenu complet
                </summary>
                <div className="mt-3 whitespace-pre-wrap text-xs font-medium leading-relaxed text-foreground/80 max-h-96 overflow-y-auto">
                  {grant.raw_content}
                </div>
              </details>
            )}
          </div>
        ) : (
          <NotProvided />
        )}
      </SectionShell>

      {/* Section 8 — Contact */}
      <SectionShell>
        <SectionTitle icon={<Phone className="h-4 w-4" />}>Contact</SectionTitle>
        {grant.contact_info ? (
          <div className="flex items-start gap-2 text-sm font-medium">
            <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span className="whitespace-pre-wrap">{grant.contact_info}</span>
          </div>
        ) : (
          <NotProvided />
        )}
      </SectionShell>

      {/* Section 9 — Source */}
      <SectionShell>
        <SectionTitle icon={<MapPin className="h-4 w-4" />}>Source</SectionTitle>
        <div className="space-y-3">
          {grant.source_url ? (
            <a
              href={grant.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-bold underline underline-offset-4 break-all"
            >
              <ExternalLink className="h-4 w-4 flex-shrink-0" />
              {grant.source_url}
            </a>
          ) : (
            <NotProvided />
          )}
          <p className="text-xs font-bold text-muted-foreground">
            Dernière mise à jour : {formattedUpdatedAt ?? NOT_PROVIDED}
          </p>
        </div>
      </SectionShell>

      {/* Feedback bar — kept above the sticky CTA so the signal stays
          discoverable. The match pipeline learns from these. */}
      {org && (
        <div className="rounded-2xl border-2 border-border bg-card p-4 shadow-[3px_3px_0px_0px_#1a1a1a] flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-bold text-foreground/80">
            Donne-nous ton avis — on apprend tes préférences pour mieux matcher
            la prochaine fois.
          </div>
          <GrantInteractions
            grantId={grant.id}
            projectId={projectIdFromUrl || null}
            layout="detail"
            initialActive={existingInteractions}
            tier={tier}
          />
        </div>
      )}

      {/* Sticky proposal CTA */}
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
                tier={tier}
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
