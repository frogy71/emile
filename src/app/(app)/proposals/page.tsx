import { createClient } from "@supabase/supabase-js";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, ArrowRight, Clock, Sparkles, Download } from "lucide-react";
import Link from "next/link";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export default async function ProposalsPage() {
  const supabase = getSupabase();

  const { data: proposals } = await supabase
    .from("proposals")
    .select("*, grants(title, funder, deadline), projects(name)")
    .order("created_at", { ascending: false });

  const proposalList = proposals || [];

  return (
    <div>
      <div>
        <h1 className="text-3xl font-black text-foreground">Propositions</h1>
        <p className="text-muted-foreground font-medium">
          Vos brouillons de propositions générés par IA
        </p>
      </div>

      {proposalList.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-border bg-[#d4b5ff] shadow-[3px_3px_0px_0px_#1a1a1a]">
              <FileText className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-lg font-black text-foreground">
              Aucune proposition pour le moment
            </h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground font-medium">
              Explorez les subventions, trouvez un bon match, puis générez votre
              première proposition en un clic.
            </p>
            <Link href="/grants">
              <Button variant="accent" className="mt-6">
                Explorer les subventions
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 space-y-4">
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
                    {proposal.projects?.name && (
                      <Badge variant="secondary">{proposal.projects.name}</Badge>
                    )}
                  </div>
                  <h3 className="text-lg font-black mt-2">
                    {proposal.grants?.title || "Proposition"}
                  </h3>
                  <p className="text-sm font-semibold text-muted-foreground">
                    {proposal.grants?.funder || ""}
                  </p>
                  {proposal.content && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                      {typeof proposal.content === "string"
                        ? proposal.content.slice(0, 300)
                        : JSON.stringify(proposal.content).slice(0, 300)}
                      ...
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-xs font-bold text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(proposal.created_at).toLocaleDateString("fr-FR")}
                    </span>
                    {proposal.grants?.deadline && (
                      <span>
                        Deadline:{" "}
                        {new Date(proposal.grants.deadline).toLocaleDateString(
                          "fr-FR"
                        )}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0 ml-4">
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/api/proposals/export?id=${proposal.id}`} download>
                      <Download className="h-4 w-4" />
                      Exporter .docx
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
