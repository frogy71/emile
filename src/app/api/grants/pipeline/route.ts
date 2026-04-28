import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * GET /api/grants/pipeline
 *
 * Returns every grant the user has expressed interest in (via like / save /
 * apply), grouped by their Kanban column. Used by the /pipeline page.
 *
 * A grant can have multiple interactions (e.g. liked and saved) — we
 * dedupe by grant_id and keep the row with the highest "lifecycle stage"
 * so the card lives in the right column.
 */

const COLUMN_ORDER = [
  "discovered",
  "preparing",
  "applied",
  "waiting",
  "accepted",
  "rejected",
] as const;

type Column = (typeof COLUMN_ORDER)[number];

type InteractionRow = {
  id: string;
  grant_id: string;
  pipeline_status: Column | null;
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
};

export type PipelineCard = {
  interactionId: string;
  grantId: string;
  title: string;
  funder: string | null;
  deadline: string | null;
  maxAmountEur: number | null;
  sourceUrl: string | null;
  sourceName: string | null;
  status: Column;
  createdAt: string;
};

export type PipelineResponse = {
  columns: Record<Column, PipelineCard[]>;
};

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: org, error: orgError } = await supabaseAdmin
    .from("organizations")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (orgError || !org) {
    return NextResponse.json(
      { error: "Organization not found" },
      { status: 404 }
    );
  }

  const { data: rowsRaw, error } = await supabaseAdmin
    .from("user_grant_interactions")
    .select(
      "id, grant_id, pipeline_status, interaction_type, created_at, grants(id, title, funder, deadline, max_amount_eur, source_url, source_name)"
    )
    .eq("organization_id", org.id)
    .in("interaction_type", ["like", "save", "apply"])
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (rowsRaw || []) as unknown as InteractionRow[];

  // Dedupe by grant_id — multiple interactions on the same grant collapse to
  // one card. We keep the row whose pipeline_status is furthest along the
  // workflow (rejected/accepted beat applied beats discovered).
  const stageRank: Record<Column, number> = {
    discovered: 0,
    preparing: 1,
    applied: 2,
    waiting: 3,
    accepted: 4,
    rejected: 5,
  };

  const byGrant = new Map<string, InteractionRow>();
  for (const row of rows) {
    if (!row.grants) continue;
    const existing = byGrant.get(row.grant_id);
    if (!existing) {
      byGrant.set(row.grant_id, row);
      continue;
    }
    const a = stageRank[(existing.pipeline_status ?? "discovered") as Column];
    const b = stageRank[(row.pipeline_status ?? "discovered") as Column];
    if (b > a) byGrant.set(row.grant_id, row);
  }

  const columns: Record<Column, PipelineCard[]> = {
    discovered: [],
    preparing: [],
    applied: [],
    waiting: [],
    accepted: [],
    rejected: [],
  };

  for (const row of byGrant.values()) {
    if (!row.grants) continue;
    const status = (row.pipeline_status ?? "discovered") as Column;
    if (!COLUMN_ORDER.includes(status)) continue;
    columns[status].push({
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
    });
  }

  // Within each column, the most urgent application (soonest deadline)
  // comes first. Cards with no deadline sink to the bottom — they're the
  // least time-sensitive.
  const FAR_FUTURE = Number.POSITIVE_INFINITY;
  for (const key of COLUMN_ORDER) {
    columns[key].sort((a, b) => {
      const da = a.deadline ? new Date(a.deadline).getTime() : FAR_FUTURE;
      const db = b.deadline ? new Date(b.deadline).getTime() : FAR_FUTURE;
      return da - db;
    });
  }

  const response: PipelineResponse = { columns };
  return NextResponse.json(response);
}
