import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calendar,
  Download,
  Euro,
  FileText,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

type ProposalSection = { title: string; content: string };

type ProposalContent = {
  sections?: ProposalSection[];
  language?: string;
  generatedAt?: string;
};

/**
 * /proposals/[id] — render one proposal's sections + export CTA.
 *
 * Read-only for now: the .docx export is the authoritative editable artefact,
 * and in-app editing can land later without forcing a migration now.
 */
export default async function ProposalDetailPage({
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

  const { data: proposal, error } = await supabaseAdmin
    .from("proposals")
    .select(
      "*, grants(id, title, funder, deadline, max_amount_eur), projects(id, name), organizations!inner(user_id, name)"
    )
    .eq("id", id)
    .single();

  if (
    !proposal ||
    error ||
    (proposal.organizations as unknown as { user_id: string })?.user_id !==
      user.id
  ) {
    notFound();
  }

  const content = (proposal.content || {}) as ProposalContent;
  const sections: ProposalSection[] = content.sections || [];
  const grant = proposal.grants as {
    id?: string;
    title?: string;
    funder?: string;
    deadline?: string | null;
    max_amount_eur?: number | null;
  } | null;
  const project = proposal.projects as {
    id?: string;
    name?: string;
  } | null;

  const generatedAt = content.generatedAt
    ? new Date(content.generatedAt)
    : new Date(proposal.created_at);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <Link href="/proposals">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Badge variant="purple">
                <Sparkles className="h-3 w-3 mr-1" />
                Généré par IA
              </Badge>
              {project?.name && (
                <Link href={`/projects/${project.id}`}>
                  <Badge variant="secondary">{project.name}</Badge>
                </Link>
              )}
              <Badge
                variant={
                  proposal.status === "submitted"
                    ? "green"
                    : proposal.status === "draft"
                      ? "yellow"
                      : "secondary"
                }
              >
                {proposal.status === "submitted"
                  ? "Soumis"
                  : proposal.status === "draft"
                    ? "Brouillon"
                    : proposal.status}
              </Badge>
            </div>
            <h1 className="text-3xl font-black text-foreground truncate">
              {grant?.title || "Proposition"}
            </h1>
            {grant?.funder && (
              <p className="text-muted-foreground font-semibold mt-0.5">
                {grant.funder}
              </p>
            )}
          </div>
        </div>
        <div className="shrink-0">
          <a href={`/api/proposals/export?id=${proposal.id}`} download>
            <Button variant="accent">
              <Download className="h-4 w-4" />
              Exporter en .docx
            </Button>
          </a>
        </div>
      </div>

      {/* Meta row */}
      <div className="grid gap-3 md:grid-cols-3 mb-8">
        {grant?.deadline && (
          <div className="rounded-xl border-2 border-border bg-[#ffa3d1] p-4 shadow-[3px_3px_0px_0px_#1a1a1a]">
            <div className="flex items-center gap-2 text-xs font-bold">
              <Calendar className="h-4 w-4" />
              Deadline
            </div>
            <p className="text-lg font-black mt-1">
              {new Date(grant.deadline).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        )}
        {grant?.max_amount_eur != null && (
          <div className="rounded-xl border-2 border-border bg-[#c8f76f] p-4 shadow-[3px_3px_0px_0px_#1a1a1a]">
            <div className="flex items-center gap-2 text-xs font-bold">
              <Euro className="h-4 w-4" />
              Montant max
            </div>
            <p className="text-lg font-black mt-1">
              {Number(grant.max_amount_eur).toLocaleString("fr-FR")} €
            </p>
          </div>
        )}
        <div className="rounded-xl border-2 border-border bg-[#ffe066] p-4 shadow-[3px_3px_0px_0px_#1a1a1a]">
          <div className="flex items-center gap-2 text-xs font-bold">
            <FileText className="h-4 w-4" />
            Généré le
          </div>
          <p className="text-lg font-black mt-1">
            {generatedAt.toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Sections */}
      {sections.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              Aucun contenu structuré dans cette proposition.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Téléchargez le .docx pour voir le document complet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {sections.map((section, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg border-2 border-border bg-[#d4b5ff] text-sm font-black shadow-[2px_2px_0px_0px_#1a1a1a]">
                    {i + 1}
                  </span>
                  <h2 className="text-lg font-black">{section.title}</h2>
                </div>
                <div className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-foreground">
                  {section.content}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Bottom CTA */}
      <div className="mt-10 rounded-2xl border-2 border-border bg-[#a3d5ff] p-6 shadow-[4px_4px_0px_0px_#1a1a1a] flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black">
            Besoin de retoucher ?
          </h3>
          <p className="text-sm font-medium text-muted-foreground">
            Téléchargez le .docx et finalisez la rédaction dans votre éditeur
            préféré.
          </p>
        </div>
        <a href={`/api/proposals/export?id=${proposal.id}`} download>
          <Button variant="default">
            <Download className="h-4 w-4" />
            Télécharger .docx
          </Button>
        </a>
      </div>
    </div>
  );
}
