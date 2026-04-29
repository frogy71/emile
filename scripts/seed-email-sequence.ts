/**
 * Seed email_sequence_templates with the default 7-step nurture sequence.
 *
 * Usage:
 *   npx tsx scripts/seed-email-sequence.ts
 *
 * Idempotent. Behaviour:
 *  - Row missing for a step → inserted.
 *  - Row exists, never edited (updated_at == created_at) → re-applied.
 *  - Row exists and was edited via the admin UI → skipped (admin wins).
 *
 * To force-reset all rows from the canonical source, pass --force.
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import { SEQUENCE_STEPS } from "../src/lib/email/sequence-templates";

const force = process.argv.includes("--force");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let inserted = 0;
let updated = 0;
let preserved = 0;

for (const step of SEQUENCE_STEPS) {
  const { data: existing, error: selectErr } = await supabase
    .from("email_sequence_templates")
    .select("id, created_at, updated_at")
    .eq("step_number", step.stepNumber)
    .maybeSingle();

  if (selectErr) {
    console.error(`Step ${step.stepNumber}: select failed`, selectErr);
    process.exit(1);
  }

  if (existing) {
    const created = new Date(existing.created_at).getTime();
    const updatedAt = new Date(existing.updated_at).getTime();
    const wasEdited = Math.abs(updatedAt - created) > 1000;

    if (wasEdited && !force) {
      console.log(`Step ${step.stepNumber}: preserved (admin edit detected — pass --force to override)`);
      preserved++;
      continue;
    }

    const { error } = await supabase
      .from("email_sequence_templates")
      .update({
        delay_days: step.delayDays,
        subject: step.subject,
        body_html: step.bodyHtml,
        // Keep updated_at == created_at so re-runs detect this row as "untouched".
        updated_at: existing.created_at,
      })
      .eq("id", existing.id);
    if (error) {
      console.error(`Step ${step.stepNumber}: update failed`, error);
      process.exit(1);
    }
    console.log(`Step ${step.stepNumber}: updated (${step.subject})`);
    updated++;
  } else {
    const { error } = await supabase.from("email_sequence_templates").insert({
      step_number: step.stepNumber,
      delay_days: step.delayDays,
      subject: step.subject,
      body_html: step.bodyHtml,
    });
    if (error) {
      console.error(`Step ${step.stepNumber}: insert failed`, error);
      process.exit(1);
    }
    console.log(`Step ${step.stepNumber}: inserted (${step.subject})`);
    inserted++;
  }
}

console.log(`\nDone. ${inserted} inserted, ${updated} updated, ${preserved} preserved.`);
process.exit(0);
