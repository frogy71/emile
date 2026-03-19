import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * CRON: Automated grant update routine
 *
 * Schedule:
 * - Daily at 6am: Aides-Territoires (main source, changes frequently)
 * - Weekly (Sunday 3am): All sources
 *
 * Triggered by Vercel Cron or manual call.
 * After update: marks expired grants, counts new grants.
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const AT_TOKEN = process.env.AIDES_TERRITOIRES_API_TOKEN!;

function cleanHtml(h: string | null): string | null {
  if (!h) return null;
  return h
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

// ── Aides-Territoires API ingestion ──────────────────────────────

async function updateAidesTerritoires(): Promise<{
  fetched: number;
  upserted: number;
}> {
  // Get JWT
  const jwtRes = await fetch(
    "https://aides-territoires.beta.gouv.fr/api/aids/?page_size=1",
    { headers: { "X-AUTH-TOKEN": AT_TOKEN } }
  );
  const { token: jwt } = await jwtRes.json();

  // Fetch all active aids for associations
  const allAids: any[] = [];
  let nextUrl: string | null =
    "https://aides-territoires.beta.gouv.fr/api/aids/?targeted_audiences=association&is_live=true&page_size=50";

  while (nextUrl) {
    const pageRes: Response = await fetch(nextUrl, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    if (!pageRes.ok) break;
    const data = await pageRes.json();
    allAids.push(...data.results);
    nextUrl = data.next as string | null;
    if (nextUrl) await new Promise((r) => setTimeout(r, 100));
  }

  // Transform and upsert
  const grants = allAids.map((raw) => {
    const isEU = raw.programs?.some((p: string) =>
      /europ|erasmus|cerv|horizon|life|esf|feder/i.test(p)
    );
    const desc = cleanHtml(raw.description);
    const elig = cleanHtml(raw.eligibility);
    const funders = (raw.financers || [])
      .map((f: any) => f.name || f)
      .filter(Boolean);
    const themes = (raw.categories || [])
      .map((c: any) => c.name || c)
      .filter(Boolean)
      .slice(0, 10);

    return {
      source_url:
        "https://aides-territoires.beta.gouv.fr/aides/" +
        (raw.slug || raw.id) +
        "/",
      source_name: "Aides-Territoires",
      title: (raw.name || "Sans titre").slice(0, 300),
      summary: desc?.slice(0, 500) || null,
      raw_content: [desc, elig].filter(Boolean).join(" ").slice(0, 10000) || null,
      funder: funders.join(", ") || null,
      country: isEU ? "EU" : "FR",
      thematic_areas: themes.length > 0 ? themes : null,
      eligible_entities: raw.targeted_audiences || ["association"],
      eligible_countries: ["FR"],
      min_amount_eur: null,
      max_amount_eur: null,
      co_financing_required:
        raw.subvention_rate_upper_bound != null &&
        raw.subvention_rate_upper_bound < 100,
      deadline: raw.submission_deadline || null,
      grant_type: raw.is_call_for_project
        ? "appel_a_projets"
        : "subvention",
      language: "fr",
      status: "active",
      ai_summary: null,
      updated_at: new Date().toISOString(),
    };
  });

  // Upsert in chunks
  let upserted = 0;
  for (let i = 0; i < grants.length; i += 50) {
    const chunk = grants.slice(i, i + 50);
    const { error } = await supabase.from("grants").upsert(chunk, {
      onConflict: "source_url",
      ignoreDuplicates: false,
    });
    if (!error) upserted += chunk.length;
  }

  return { fetched: allAids.length, upserted };
}

// ── Mark expired grants ──────────────────────────────────────────

async function markExpiredGrants(): Promise<number> {
  const { data } = await supabase
    .from("grants")
    .update({ status: "expired" })
    .eq("status", "active")
    .lt("deadline", new Date().toISOString())
    .select("id");

  return data?.length || 0;
}

// ── Main handler ─────────────────────────────────────────────────

export async function GET(request: Request) {
  // Verify cron secret (Vercel sends this)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    // 1. Update Aides-Territoires (API — most reliable)
    const atResult = await updateAidesTerritoires();

    // 2. Mark expired grants
    const expired = await markExpiredGrants();

    // 3. Get total count
    const { count: totalGrants } = await supabase
      .from("grants")
      .select("id", { count: "exact", head: true });

    const duration = Math.round((Date.now() - startTime) / 1000);

    const report = {
      success: true,
      timestamp: new Date().toISOString(),
      duration_seconds: duration,
      aides_territoires: atResult,
      expired_marked: expired,
      total_grants: totalGrants,
    };

    console.log("[CRON] Grant update complete:", report);

    return NextResponse.json(report);
  } catch (error) {
    console.error("[CRON] Update failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
