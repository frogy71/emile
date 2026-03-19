import { createClient } from "@/lib/supabase/server";

export interface GrantRow {
  id: string;
  source_url: string;
  source_name: string;
  title: string;
  summary: string | null;
  funder: string | null;
  country: string | null;
  thematic_areas: string[] | null;
  eligible_entities: string[] | null;
  min_amount_eur: number | null;
  max_amount_eur: number | null;
  co_financing_required: boolean | null;
  deadline: string | null;
  grant_type: string | null;
  language: string | null;
  status: string | null;
  ai_summary: string | null;
  created_at: string;
}

/**
 * Fetch grants with optional filters
 */
export async function getGrants(params?: {
  country?: string;
  search?: string;
  limit?: number;
  offset?: number;
  status?: string;
}): Promise<{ grants: GrantRow[]; total: number }> {
  const supabase = await createClient();
  let query = supabase
    .from("grants")
    .select("*", { count: "exact" })
    .order("deadline", { ascending: true, nullsFirst: false });

  if (params?.country) {
    query = query.eq("country", params.country);
  }
  if (params?.status) {
    query = query.eq("status", params.status);
  }
  if (params?.search) {
    query = query.or(
      `title.ilike.%${params.search}%,funder.ilike.%${params.search}%,summary.ilike.%${params.search}%`
    );
  }
  if (params?.limit) {
    query = query.limit(params.limit);
  }
  if (params?.offset) {
    query = query.range(params.offset, params.offset + (params?.limit || 20) - 1);
  }

  const { data, count, error } = await query;

  if (error) {
    console.error("Error fetching grants:", error);
    return { grants: [], total: 0 };
  }

  return { grants: data || [], total: count || 0 };
}

/**
 * Get grant by ID
 */
export async function getGrantById(
  id: string
): Promise<GrantRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("grants")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

/**
 * Get grant stats for dashboard
 */
export async function getGrantStats(): Promise<{
  totalActive: number;
  deadlinesThisMonth: number;
  countryCounts: { country: string; count: number }[];
}> {
  const supabase = await createClient();

  // Total active
  const { count: totalActive } = await supabase
    .from("grants")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  // Deadlines this month
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const { count: deadlinesThisMonth } = await supabase
    .from("grants")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")
    .gte("deadline", now.toISOString())
    .lte("deadline", endOfMonth.toISOString());

  return {
    totalActive: totalActive || 0,
    deadlinesThisMonth: deadlinesThisMonth || 0,
    countryCounts: [],
  };
}
