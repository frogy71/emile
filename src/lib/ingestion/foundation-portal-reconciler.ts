/**
 * Foundation call-for-projects lifecycle reconciliation.
 *
 * Run AFTER the portal crawler produces its list of "CrawledCall"s.
 * Compares the new snapshot with what's already in the grants table
 * (source_name = "Fondations privées — appels actifs") and:
 *   - Inserts/updates the grant row (idempotent via portal_stable_key)
 *   - Appends exactly the right events to grant_lifecycle_events
 *   - Updates foundation_portal_health with the per-foundation rollup
 *
 * The reconciler is intentionally separate from the crawler so it can
 * be unit-tested without network calls, and so the crawler stays
 * focused on scraping.
 *
 * Robustness guarantees:
 *   - Anti-flicker: an AAP only counts as "disappeared" after 2 crawls
 *     in a row without seeing it (`missed_crawls >= 2`).
 *   - Portal down guard: if the foundation's portal returned HTTP error
 *     this run, we skip reconciliation for its grants entirely — no
 *     false "closed" events just because a site was down.
 *   - Stable key: hash(funder + normalized title) so tiny wording
 *     changes like "AAP 2026" → "AAP 2027" don't create a new row +
 *     duplicate notifications.
 */

import crypto from "crypto";
import {
  buildGrantEmbeddingText,
  generateEmbeddingsBatch,
  isEmbeddingsAvailable,
  toPgVector,
} from "../ai/embeddings";

// Event types match the CHECK constraint in 0005_foundation_lifecycle.sql
export type LifecycleEventType =
  | "opened"
  | "still_open"
  | "deadline_changed"
  | "closing_soon"
  | "disappeared"
  | "closed"
  | "reopened";

export interface CrawlSnapshot {
  /** Funder display name (matches fondations-curated.ts) */
  funder: string;
  /** Root URL of the foundation's portal */
  portalUrl: string;
  /** Whether the crawler reached the portal at all (for "portal down" guard) */
  portalReachable: boolean;
  /** If an error occurred while crawling this foundation, stored for admin display */
  errorMessage?: string | null;
  /** The list of active calls scraped on this run (empty if nothing found) */
  calls: Array<{
    title: string;
    summary: string;
    deadline: Date | null;
    amountEur: number | null;
    themes: string[];
    url: string;
  }>;
}

const SOURCE_NAME = "Fondations privées — appels actifs";

/**
 * Normalize a title so "Appel à projets 2026" and "Appel à projets 2027"
 * map to the same stable key (removes years, punctuation, stop-words).
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/\b(19|20)\d{2}\b/g, " ") // strip 4-digit years
    .replace(/\b(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\b/gi, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(le|la|les|un|une|des|de|du|d|l|et|ou|pour|par|en|a|au|aux|sur)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function stablePortalKey(funder: string, title: string): string {
  const input = `${funder.trim()}|${normalizeTitle(title)}`;
  return crypto.createHash("sha1").update(input).digest("hex");
}

// ───────────────────────────────────────────────────────────────
// Supabase REST helpers
// ───────────────────────────────────────────────────────────────

function creds() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  };
}

async function restSelect<T>(path: string): Promise<T[]> {
  const { url, key } = creds();
  const res = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) return [];
  return (await res.json()) as T[];
}

async function restUpsert(
  path: string,
  rows: Record<string, unknown>[],
  onConflict?: string
): Promise<boolean> {
  if (rows.length === 0) return true;
  const { url, key } = creds();
  const suffix = onConflict ? `?on_conflict=${onConflict}` : "";
  const res = await fetch(`${url}/rest/v1/${path}${suffix}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    console.error(
      `[reconciler] upsert ${path} failed`,
      await res.text().catch(() => "")
    );
    return false;
  }
  return true;
}

async function restUpdate(
  path: string,
  patch: Record<string, unknown>
): Promise<boolean> {
  const { url, key } = creds();
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method: "PATCH",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(patch),
  });
  return res.ok;
}

async function restInsert(
  path: string,
  rows: Record<string, unknown>[]
): Promise<boolean> {
  if (rows.length === 0) return true;
  const { url, key } = creds();
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    console.error(
      `[reconciler] insert ${path} failed`,
      await res.text().catch(() => "")
    );
    return false;
  }
  return true;
}

// ───────────────────────────────────────────────────────────────
// Public API
// ───────────────────────────────────────────────────────────────

export interface ReconcileResult {
  opened: number;
  stillOpen: number;
  deadlineChanged: number;
  closingSoon: number;
  disappeared: number;
  closed: number;
  reopened: number;
  foundationsProcessed: number;
  foundationsSkippedUnreachable: number;
}

interface ExistingGrant {
  id: string;
  portal_stable_key: string | null;
  title: string;
  funder: string;
  deadline: string | null;
  status: string;
  missed_crawls: number | null;
  disappeared_at: string | null;
}

/**
 * Run lifecycle reconciliation for every foundation snapshot.
 *
 * @param snapshots — one per foundation portal crawled this run.
 * @param runId — the ingestion run id, propagated into events for drill-down.
 */
export async function reconcileFoundationPortals(
  snapshots: CrawlSnapshot[],
  runId: string
): Promise<ReconcileResult> {
  const result: ReconcileResult = {
    opened: 0,
    stillOpen: 0,
    deadlineChanged: 0,
    closingSoon: 0,
    disappeared: 0,
    closed: 0,
    reopened: 0,
    foundationsProcessed: 0,
    foundationsSkippedUnreachable: 0,
  };

  // 1) Pull every existing AAP in this source so we can diff.
  //
  // The reconciler is intentionally partial-batch safe: it iterates over
  // `snapshots` only, so funders absent from this run are never touched
  // (no false "missed_crawls" bumps when it's just someone else's turn
  // to be crawled). Pulling all source rows up-front keeps the SQL simple
  // and works for both the daily ~35-portal cron and the local full crawl.
  const existing = await restSelect<ExistingGrant>(
    `grants?source_name=eq.${encodeURIComponent(
      SOURCE_NAME
    )}&select=id,portal_stable_key,title,funder,deadline,status,missed_crawls,disappeared_at`
  );

  const byFunder = new Map<string, ExistingGrant[]>();
  for (const g of existing) {
    if (!byFunder.has(g.funder)) byFunder.set(g.funder, []);
    byFunder.get(g.funder)!.push(g);
  }

  const now = new Date();
  const events: Record<string, unknown>[] = [];
  const grantUpdates: Array<{ id: string; patch: Record<string, unknown> }> =
    [];
  const grantInserts: Record<string, unknown>[] = [];
  const healthRows: Record<string, unknown>[] = [];

  for (const snap of snapshots) {
    result.foundationsProcessed += 1;

    // Portal down guard: don't turn a temporary 500 into "all calls closed".
    if (!snap.portalReachable) {
      result.foundationsSkippedUnreachable += 1;
      healthRows.push({
        funder: snap.funder,
        portal_url: snap.portalUrl,
        last_crawled_at: now.toISOString(),
        last_success_at: null,
        last_reachable: false,
        active_calls_count: 0,
        empty_crawls_in_a_row: null,
        last_error: snap.errorMessage ?? "portal unreachable",
        health: "unreachable",
        updated_at: now.toISOString(),
      });
      continue;
    }

    const previousForFunder = byFunder.get(snap.funder) ?? [];
    const seenKeys = new Set<string>();

    // 2) Process every call we just saw.
    for (const c of snap.calls) {
      const key = stablePortalKey(snap.funder, c.title);
      seenKeys.add(key);
      const prior = previousForFunder.find((g) => g.portal_stable_key === key);
      const deadlineIso = c.deadline ? c.deadline.toISOString() : null;

      if (!prior) {
        // New AAP — will be inserted. We attach the event AFTER insert so
        // we have the grant_id. Defer via a sentinel in grantInserts.
        //
        // Append a stable fragment to source_url so two AAP from the same
        // foundation (which often share the same landing-page URL when we
        // couldn't resolve a deep link) don't collide on the grants
        // source_url UNIQUE constraint. Browsers just ignore the fragment,
        // so "Voir chez le bailleur" links continue to work unchanged.
        const sourceUrlForDb = c.url.includes("#")
          ? c.url
          : `${c.url}#emile-aap-${key.slice(0, 10)}`;
        grantInserts.push({
          source_url: sourceUrlForDb,
          source_name: SOURCE_NAME,
          title: c.title,
          summary: c.summary,
          raw_content: c.summary,
          funder: snap.funder,
          country: "FR",
          thematic_areas: c.themes,
          eligible_entities: ["association", "ong"],
          eligible_countries: ["FR"],
          min_amount_eur: null,
          max_amount_eur: c.amountEur,
          co_financing_required: false,
          deadline: deadlineIso,
          grant_type: "fondation",
          language: "fr",
          status: "active",
          ai_summary: c.summary,
          portal_stable_key: key,
          first_seen_at: now.toISOString(),
          last_seen_at: now.toISOString(),
          missed_crawls: 0,
          updated_at: now.toISOString(),
        });
        result.opened += 1;
      } else {
        // Existing AAP — still present. Reset missed_crawls and emit
        // events for any state transition.
        const patch: Record<string, unknown> = {
          last_seen_at: now.toISOString(),
          missed_crawls: 0,
          status: "active",
        };

        // If it had been flagged as disappeared, mark a reopened event.
        if (prior.disappeared_at) {
          patch.disappeared_at = null;
          patch.reopened_at = now.toISOString();
          events.push({
            grant_id: prior.id,
            event_type: "reopened",
            detected_at: now.toISOString(),
            previous_status: prior.status,
            new_status: "active",
            crawl_run_id: runId,
            notes: `Réapparu après ${prior.missed_crawls ?? 0} crawls manqués`,
          });
          result.reopened += 1;
        } else {
          events.push({
            grant_id: prior.id,
            event_type: "still_open",
            detected_at: now.toISOString(),
            crawl_run_id: runId,
          });
          result.stillOpen += 1;
        }

        // Deadline changed?
        const priorIso = prior.deadline ? prior.deadline : null;
        if (priorIso !== deadlineIso) {
          patch.deadline = deadlineIso;
          events.push({
            grant_id: prior.id,
            event_type: "deadline_changed",
            detected_at: now.toISOString(),
            deadline_before: priorIso,
            deadline_after: deadlineIso,
            crawl_run_id: runId,
          });
          result.deadlineChanged += 1;
        }

        // Closing soon event (once, when we cross the 14-day threshold)?
        if (deadlineIso) {
          const ms = new Date(deadlineIso).getTime() - now.getTime();
          const days = ms / (1000 * 60 * 60 * 24);
          const priorDays = priorIso
            ? (new Date(priorIso).getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24)
            : Infinity;
          if (days <= 14 && priorDays > 14) {
            events.push({
              grant_id: prior.id,
              event_type: "closing_soon",
              detected_at: now.toISOString(),
              deadline_after: deadlineIso,
              crawl_run_id: runId,
              notes: `Clôture dans ${Math.round(days)} jours`,
            });
            result.closingSoon += 1;
          }
        }

        grantUpdates.push({ id: prior.id, patch });
      }
    }

    // 3) Anything in previousForFunder that we didn't see this run?
    //    First missed run → increment missed_crawls. Second in a row →
    //    mark as disappeared. If the deadline is already in the past we
    //    emit "closed" instead (natural expiry, not a flag).
    for (const prior of previousForFunder) {
      if (!prior.portal_stable_key) continue;
      if (seenKeys.has(prior.portal_stable_key)) continue;

      const deadlineIso = prior.deadline;
      const deadlinePassed =
        deadlineIso && new Date(deadlineIso).getTime() < now.getTime();

      if (deadlinePassed && prior.status !== "expired") {
        grantUpdates.push({
          id: prior.id,
          patch: { status: "expired" },
        });
        events.push({
          grant_id: prior.id,
          event_type: "closed",
          detected_at: now.toISOString(),
          previous_status: prior.status,
          new_status: "expired",
          crawl_run_id: runId,
          notes: "Deadline passée",
        });
        result.closed += 1;
        continue;
      }

      const newMissed = (prior.missed_crawls ?? 0) + 1;

      if (newMissed >= 2 && !prior.disappeared_at) {
        grantUpdates.push({
          id: prior.id,
          patch: {
            missed_crawls: newMissed,
            disappeared_at: now.toISOString(),
            status: "expired",
          },
        });
        events.push({
          grant_id: prior.id,
          event_type: "disappeared",
          detected_at: now.toISOString(),
          previous_status: prior.status,
          new_status: "expired",
          crawl_run_id: runId,
          notes: `Non trouvé pendant ${newMissed} crawls consécutifs`,
        });
        result.disappeared += 1;
      } else {
        grantUpdates.push({
          id: prior.id,
          patch: { missed_crawls: newMissed },
        });
      }
    }

    // 4) Update foundation health rollup.
    const activeCount = snap.calls.length;
    // Rough "empty-in-a-row" heuristic: if we found 0 calls this run, we
    // don't know the previous count here — the DB trigger / next-run read
    // handles that. We just set the latest value; the count of consecutive
    // empty crawls is incremented at update time via a server-side
    // expression when possible, or reset to 0 when we have active calls.
    // Keep ALL health rows with the same shape (PostgREST requires
    // identical key sets across a batch upsert).
    healthRows.push({
      funder: snap.funder,
      portal_url: snap.portalUrl,
      last_crawled_at: now.toISOString(),
      last_success_at: now.toISOString(),
      last_reachable: true,
      active_calls_count: activeCount,
      empty_crawls_in_a_row: activeCount > 0 ? 0 : null,
      health: activeCount > 0 ? "healthy" : "no_calls",
      last_error: null,
      updated_at: now.toISOString(),
    });
  }

  // ─── Apply writes ─────────────────────────────────────────────
  //
  // Order matters: insert new grants FIRST so we have their ids to attach
  // "opened" events, then run updates + event inserts in parallel.

  // Collect ids+rows of successfully inserted new grants so we can embed
  // them after the inserts complete.
  const newlyInsertedForEmbedding: Array<{
    id: string;
    row: Record<string, unknown>;
  }> = [];

  if (grantInserts.length > 0) {
    // Plain insert (not upsert) — the diff above already filtered out any
    // AAP we've seen before for this funder, so these are truly new rows.
    // We can't use ON CONFLICT here because the uniqueness guarantee in
    // the schema is a *partial* unique index (WHERE portal_stable_key IS
    // NOT NULL), which Postgres won't let us target in ON CONFLICT.
    //
    // Done one row at a time so that an occasional 23505 (unique violation
    // on source_url or portal_stable_key) doesn't nuke the whole batch —
    // we just log and move on. This is robust against crawler noise like
    // the LLM hallucinating an identical URL for two different calls.
    const { url, key } = creds();
    for (const row of grantInserts) {
      try {
        const res = await fetch(`${url}/rest/v1/grants`, {
          method: "POST",
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify([row]),
        });
        if (res.ok) {
          const inserted = (await res.json()) as Array<{
            id: string;
            portal_stable_key: string;
          }>;
          for (const r of inserted) {
            events.push({
              grant_id: r.id,
              event_type: "opened",
              detected_at: now.toISOString(),
              new_status: "active",
              crawl_run_id: runId,
            });
            newlyInsertedForEmbedding.push({ id: r.id, row });
          }
        } else {
          const errText = await res.text().catch(() => "");
          // Expected: 23505 duplicate when two calls share a landing URL
          // and the fragment-suffix trick couldn't fully de-dupe them.
          if (errText.includes("23505")) {
            console.warn(
              `[reconciler] grant insert skipped (duplicate): ${String(
                row.title
              ).slice(0, 80)}`
            );
          } else {
            console.error("[reconciler] grant insert failed", errText);
          }
        }
      } catch (e) {
        console.error("[reconciler] grant insert exception", e);
      }
    }
  }

  // Batched updates (sequential to keep error surface clear)
  for (const u of grantUpdates) {
    await restUpdate(`grants?id=eq.${u.id}`, u.patch);
  }

  if (events.length > 0) {
    await restInsert("grant_lifecycle_events", events);
  }

  // When an AAP reopens, wipe its alert history so the regular
  // /api/alerts/new-match and /api/alerts/send crons re-notify users
  // (otherwise the dedup would suppress them).
  const reopenedGrantIds = events
    .filter((e) => e.event_type === "reopened")
    .map((e) => e.grant_id as string);
  if (reopenedGrantIds.length > 0) {
    const { url, key } = creds();
    const idList = reopenedGrantIds
      .map((id) => encodeURIComponent(id))
      .join(",");
    try {
      await Promise.all([
        fetch(
          `${url}/rest/v1/new_match_alert_history?grant_id=in.(${idList})`,
          {
            method: "DELETE",
            headers: { apikey: key, Authorization: `Bearer ${key}` },
          }
        ),
        fetch(
          `${url}/rest/v1/deadline_alert_history?grant_id=in.(${idList})`,
          {
            method: "DELETE",
            headers: { apikey: key, Authorization: `Bearer ${key}` },
          }
        ),
      ]);
    } catch (e) {
      console.warn("[reconciler] failed to reset alert history on reopen:", e);
    }
  }

  if (healthRows.length > 0) {
    await restUpsert("foundation_portal_health", healthRows, "funder");
  }

  // Embed newly opened AAPs. Best-effort — match pipeline falls back to
  // the heuristic for grants without an embedding.
  if (newlyInsertedForEmbedding.length > 0 && isEmbeddingsAvailable()) {
    try {
      const texts = newlyInsertedForEmbedding.map(({ row }) =>
        buildGrantEmbeddingText({
          title: row.title as string,
          summary: row.summary as string,
          funder: row.funder as string,
          thematic_areas: row.thematic_areas as string[],
          eligible_entities: row.eligible_entities as string[],
          eligible_countries: row.eligible_countries as string[],
          grant_type: row.grant_type as string,
        })
      );
      const vecs = await generateEmbeddingsBatch(texts, { kind: "grant" });
      const { url, key } = creds();
      const nowIso = new Date().toISOString();
      await Promise.all(
        newlyInsertedForEmbedding.map(async ({ id }, idx) => {
          const v = vecs[idx];
          if (!v) return;
          try {
            await fetch(`${url}/rest/v1/grants?id=eq.${id}`, {
              method: "PATCH",
              headers: {
                apikey: key,
                Authorization: `Bearer ${key}`,
                "Content-Type": "application/json",
                Prefer: "return=minimal",
              },
              body: JSON.stringify({
                embedding: toPgVector(v),
                embedding_updated_at: nowIso,
              }),
            });
          } catch {
            // best-effort
          }
        })
      );
      console.log(
        `[reconciler] embedded ${vecs.filter(Boolean).length}/${newlyInsertedForEmbedding.length} new AAPs`
      );
    } catch (e) {
      console.warn("[reconciler] embedding new AAPs failed:", e);
    }
  }

  console.log(
    `[reconciler] run=${runId}`,
    result,
    `(events=${events.length}, updates=${grantUpdates.length}, inserts=${grantInserts.length})`
  );

  return result;
}
