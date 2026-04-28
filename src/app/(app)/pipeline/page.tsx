import { redirect } from "next/navigation";
import Link from "next/link";
import { KanbanSquare, Search, TrendingUp, Trophy, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import {
  PipelineBoard,
  type PipelineCard,
  type PipelineStatus,
} from "@/components/pipeline-board";

type InteractionRow = {
  id: string;
  grant_id: string;
  project_id: string | null;
  pipeline_status: PipelineStatus | null;
  interaction_type: string;
  created_at: string;
  grants: {
    id: string;
    title: string;
    funder: string | null;
    deadline: string | null;
    max_amount_eur: number | null;
    source_url: string | null;
    source_name: string | null;
  } | null;
  projects: {
    id: string;
    name: string | null;
  } | null;
};

const STAGE_RANK: Record<PipelineStatus, number> = {
  discovered: 0,
  preparing: 1,
  applied: 2,
  waiting: 3,
  accepted: 4,
  rejected: 5,
};

function formatEurFull(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    const rounded = m >= 10 ? Math.round(m) : Math.round(m * 10) / 10;
    return `${String(rounded).replace(".", ",")} M€`;
  }
  if (n >= 1_000) return `${Math.round(n / 1_000)} k€`;
  return `${n} €`;
}

export default async function PipelinePage() {
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

  const { data: rowsRaw } = await supabaseAdmin
    .from("user_grant_interactions")
    .select(
      "id, grant_id, project_id, pipeline_status, interaction_type, created_at, grants(id, title, funder, deadline, max_amount_eur, source_url, source_name), projects(id, name)"
    )
    .eq("organization_id", org.id)
    .in("interaction_type", ["like", "save", "apply"])
    .order("created_at", { ascending: false });

  const rows = (rowsRaw || []) as unknown as InteractionRow[];

  // Dedupe — one card per grant, keeping the row whose pipeline_status is
  // furthest along the lifecycle.
  const byGrant = new Map<string, InteractionRow>();
  for (const row of rows) {
    if (!row.grants) continue;
    const existing = byGrant.get(row.grant_id);
    if (!existing) {
      byGrant.set(row.grant_id, row);
      continue;
    }
    const a = STAGE_RANK[(existing.pipeline_status ?? "discovered")];
    const b = STAGE_RANK[(row.pipeline_status ?? "discovered")];
    if (b > a) byGrant.set(row.grant_id, row);
  }

  const cards: PipelineCard[] = Array.from(byGrant.values())
    .map((row) => {
      if (!row.grants) return null;
      const status = (row.pipeline_status ?? "discovered") as PipelineStatus;
      return {
        interactionId: row.id,
        grantId: row.grant_id,
        title: row.grants.title,
        funder: row.grants.funder,
        deadline: row.grants.deadline,
        maxAmountEur: row.grants.max_amount_eur,
        sourceUrl: row.grants.source_url,
        sourceName: row.grants.source_name,
        status,
        createdAt: row.created_at,
        projectId: row.project_id,
        projectName: row.projects?.name ?? null,
      } satisfies PipelineCard;
    })
    .filter((c): c is PipelineCard => c !== null);

  // Headline numbers across the board. "potentiel" excludes rejected so
  // the user sees only what's still in play; "en attente" sums the two
  // columns where money is awaiting a yes/no.
  const totalPotential = cards.reduce((sum, c) => {
    if (c.status === "rejected") return sum;
    return typeof c.maxAmountEur === "number" ? sum + c.maxAmountEur : sum;
  }, 0);
  const totalWaiting = cards.reduce((sum, c) => {
    if (c.status !== "applied" && c.status !== "waiting") return sum;
    return typeof c.maxAmountEur === "number" ? sum + c.maxAmountEur : sum;
  }, 0);
  const totalWon = cards.reduce((sum, c) => {
    if (c.status !== "accepted") return sum;
    return typeof c.maxAmountEur === "number" ? sum + c.maxAmountEur : sum;
  }, 0);

  return (
    <div>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-border bg-[#a3d5ff] shadow-[3px_3px_0px_0px_#1a1a1a]">
              <KanbanSquare className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-black text-foreground">Mon pipeline</h1>
          </div>
          <p className="text-muted-foreground font-medium">
            Glisse-dépose tes candidatures pour suivre leur avancement.
          </p>
        </div>
        <Link href="/grants">
          <Button variant="outline">
            <Search className="h-4 w-4" />
            Explorer le catalogue
          </Button>
        </Link>
      </div>

      {cards.length > 0 && (
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Total pipeline"
            value={String(cards.length)}
            sub={`subvention${cards.length > 1 ? "s" : ""}`}
            bg="bg-[#c8f76f]"
            Icon={KanbanSquare}
          />
          <StatCard
            label="Potentiel total"
            value={formatEurFull(totalPotential)}
            sub="hors refus"
            bg="bg-[#ffe066]"
            Icon={TrendingUp}
          />
          <StatCard
            label="En attente"
            value={formatEurFull(totalWaiting)}
            sub="candidaté + en attente"
            bg="bg-[#a3d5ff]"
            Icon={Wallet}
          />
          <StatCard
            label="Gagné"
            value={formatEurFull(totalWon)}
            sub="subventions obtenues"
            bg="bg-[#7be276]"
            Icon={Trophy}
          />
        </div>
      )}

      <PipelineBoard initialCards={cards} />
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  bg,
  Icon,
}: {
  label: string;
  value: string;
  sub: string;
  bg: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border-2 border-border bg-card p-4 shadow-[3px_3px_0px_0px_#1a1a1a]">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-lg border-2 border-border ${bg}`}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <p className="mt-2 text-2xl font-black leading-tight">{value}</p>
      <p className="text-[11px] font-bold text-muted-foreground mt-0.5">
        {sub}
      </p>
    </div>
  );
}
