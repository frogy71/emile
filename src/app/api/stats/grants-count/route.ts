import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 600;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * GET /api/stats/grants-count
 *
 * Public landing-page stats: how many active grants we currently expose,
 * and a rough total of available funding (sum of max_amount_eur).
 *
 * The total amount is necessarily approximate: most grants don't publish a
 * single max envelope, so this is best read as "billions of euros are on
 * the table" rather than a contractual figure.
 */
export async function GET() {
  const supabase = getSupabase();

  const [{ count, error: countErr }, { data: amountRows, error: sumErr }] =
    await Promise.all([
      supabase
        .from("grants")
        .select("id", { head: true, count: "exact" })
        .eq("status", "active"),
      supabase
        .from("grants")
        .select("max_amount_eur")
        .eq("status", "active")
        .not("max_amount_eur", "is", null),
    ]);

  if (countErr || sumErr) {
    return NextResponse.json(
      { error: countErr?.message || sumErr?.message },
      { status: 500 }
    );
  }

  const totalAmount = (amountRows || []).reduce<number>((acc, row) => {
    const v = row.max_amount_eur;
    return acc + (typeof v === "number" && Number.isFinite(v) ? v : 0);
  }, 0);

  return NextResponse.json(
    {
      count: count ?? 0,
      totalAmount,
    },
    {
      headers: {
        "Cache-Control":
          "public, s-maxage=600, stale-while-revalidate=3600",
      },
    }
  );
}
