import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { enrollUser, skipPendingForUser } from "@/lib/email/send-engine";

/**
 * POST /api/admin/email-sequences/users/[userId]
 * Body: { action: "remove" | "restart" }
 *
 * "remove"  : marks every pending row as skipped.
 * "restart" : marks pending as skipped + re-enrolls from the user's signup
 *             date so any active step missed will fire on the next cron.
 */

export async function POST(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { userId } = await context.params;
  const { action } = await request.json();

  if (action === "remove") {
    const skipped = await skipPendingForUser(userId, "converted");
    return NextResponse.json({ success: true, skipped });
  }

  if (action === "restart") {
    // Drop all queue rows for the user and re-enroll. This is the only safe
    // way to re-fire steps that were already 'sent' — a simple status flip
    // would re-fire them with stale scheduled_at.
    const { error: delErr } = await supabaseAdmin
      .from("email_sequence_queue")
      .delete()
      .eq("user_id", userId);
    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 500 });
    }

    // Find org + signup date.
    const { data: org } = await supabaseAdmin
      .from("organizations")
      .select("id, email_unsubscribed")
      .eq("user_id", userId)
      .maybeSingle();

    if (org?.email_unsubscribed) {
      // Reset the unsubscribe flag on explicit admin restart.
      await supabaseAdmin
        .from("organizations")
        .update({ email_unsubscribed: false })
        .eq("id", org.id);
    }

    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
    const signupDate = userData?.user?.created_at
      ? new Date(userData.user.created_at)
      : new Date();

    const { enrolled } = await enrollUser(userId, org?.id ?? null, signupDate);
    return NextResponse.json({ success: true, enrolled });
  }

  return NextResponse.json(
    { error: "Unknown action — use 'remove' or 'restart'" },
    { status: 400 }
  );
}
