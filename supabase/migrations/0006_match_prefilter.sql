-- Stage-1 pre-filter for the match funnel
--
-- Goal: cheaply eliminate 80–90% of grants before any in-process scoring runs.
-- Mirrors the heuristic's hard gates (status, deadline, geography, entity)
-- and adds a loose thematic + budget filter so we feed Stage 2 only the
-- candidates that have a realistic chance of scoring above 0.
--
-- The function lives in Postgres (not the app) for two reasons:
--   1) Round-trip cost: scoring 3 000+ rows through the JS process is
--      dominated by network + JSON parsing.
--   2) Index use: GIN on the array columns + the partial (status, deadline)
--      index turn the gate into an index scan instead of a full table scan.

-- ─── Indexes ─────────────────────────────────────────────────────

-- GIN on text[] columns powers && (overlap) and @> (contains) operators
CREATE INDEX IF NOT EXISTS "grants_eligible_countries_gin_idx"
  ON "grants" USING GIN ("eligible_countries");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "grants_thematic_areas_gin_idx"
  ON "grants" USING GIN ("thematic_areas");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "grants_eligible_entities_gin_idx"
  ON "grants" USING GIN ("eligible_entities");
--> statement-breakpoint

-- Partial index — almost every match query is "active + future deadline"
CREATE INDEX IF NOT EXISTS "grants_active_deadline_idx"
  ON "grants" ("deadline")
  WHERE "status" = 'active';
--> statement-breakpoint

-- ─── Pre-filter function ────────────────────────────────────────

-- Drop first so we can change the signature (RETURNS TABLE) without errors.
DROP FUNCTION IF EXISTS prefilter_grants_for_project(uuid);
--> statement-breakpoint

CREATE OR REPLACE FUNCTION prefilter_grants_for_project(p_project_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  summary text,
  funder text,
  country text,
  thematic_areas text[],
  eligible_entities text[],
  eligible_countries text[],
  min_amount_eur integer,
  max_amount_eur integer,
  co_financing_required boolean,
  deadline timestamptz,
  grant_type text
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_geo text[];
  v_themes text[];
  v_legal_status text;
  v_requested int;
  v_logframe_themes text[];
BEGIN
  -- Pull project + org context. logframe_data.themes is the user-curated
  -- theme list from the wizard; merge it with org/project arrays so the
  -- filter sees the union.
  SELECT
    array_remove(
      coalesce(o.geographic_focus, '{}'::text[])
        || coalesce(p.target_geography, '{}'::text[]),
      NULL
    ),
    o.legal_status,
    p.requested_amount_eur,
    -- Extract logframe themes (text[]) from JSONB array, NULL-safe.
    CASE
      WHEN p.logframe_data IS NULL
        OR jsonb_typeof(p.logframe_data->'themes') <> 'array'
      THEN '{}'::text[]
      ELSE ARRAY(
        SELECT jsonb_array_elements_text(p.logframe_data->'themes')
      )
    END
  INTO v_geo, v_legal_status, v_requested, v_logframe_themes
  FROM projects p
  JOIN organizations o ON o.id = p.organization_id
  WHERE p.id = p_project_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Combine org thematic_areas + logframe themes + project beneficiaries.
  -- We'll use the same combined set the heuristic builds in JS.
  SELECT array_remove(
    coalesce(o.thematic_areas, '{}'::text[])
      || v_logframe_themes
      || coalesce(p.target_beneficiaries, '{}'::text[]),
    NULL
  )
  INTO v_themes
  FROM projects p
  JOIN organizations o ON o.id = p.organization_id
  WHERE p.id = p_project_id;

  RETURN QUERY
  SELECT
    g.id, g.title, g.summary, g.funder, g.country,
    g.thematic_areas, g.eligible_entities, g.eligible_countries,
    g.min_amount_eur, g.max_amount_eur, g.co_financing_required,
    g.deadline, g.grant_type
  FROM grants g
  WHERE g.status = 'active'
    AND (g.deadline IS NULL OR g.deadline > now())

    -- ─── Geographic gate ─────────────────────────────────────
    AND (
      g.eligible_countries IS NULL
      OR cardinality(g.eligible_countries) = 0
      OR g.eligible_countries && ARRAY[
        'world','international','World','International',
        'monde','Monde','MONDE','WORLD','INTERNATIONAL'
      ]::text[]
      OR g.eligible_countries && v_geo
      -- Fuzzy: substring match (e.g. "France" matches "fr", "Europe" matches "EU")
      OR EXISTS (
        SELECT 1
        FROM unnest(g.eligible_countries) gc, unnest(v_geo) og
        WHERE og <> ''
          AND (
            lower(gc) LIKE '%' || lower(og) || '%'
            OR lower(og) LIKE '%' || lower(gc) || '%'
          )
      )
    )

    -- ─── Entity eligibility gate ─────────────────────────────
    AND (
      g.eligible_entities IS NULL
      OR cardinality(g.eligible_entities) = 0
      OR EXISTS (
        SELECT 1 FROM unnest(g.eligible_entities) e
        WHERE lower(e) ~ 'tous|tout type|ouvert|any'
      )
      OR EXISTS (
        SELECT 1 FROM unnest(g.eligible_entities) e
        WHERE
          (coalesce(lower(v_legal_status), 'association') ~ 'associat|ong'
            AND lower(e) ~ 'associat|ong|nonprofit|non lucratif|a but non lucratif')
          OR (coalesce(lower(v_legal_status), '') ~ 'fondation'
            AND lower(e) ~ 'fondation|foundation')
          OR (coalesce(lower(v_legal_status), '') ~ 'collectivit'
            AND lower(e) ~ 'collectivit|commune|region|departement|epci|intercommunal')
          OR (coalesce(lower(v_legal_status), '') ~ 'entreprise|ess'
            AND lower(e) ~ 'entreprise|societe|ess|economie sociale')
      )
    )

    -- ─── Thematic gate (loose) ──────────────────────────────
    -- Pass when: org/project have no themes (don't know),
    -- grant has no themes (don't know), arrays overlap, fuzzy substring
    -- overlap, or any project theme appears in the grant title/summary.
    AND (
      coalesce(cardinality(v_themes), 0) = 0
      OR g.thematic_areas IS NULL
      OR cardinality(g.thematic_areas) = 0
      OR g.thematic_areas && v_themes
      OR EXISTS (
        SELECT 1
        FROM unnest(g.thematic_areas) ga, unnest(v_themes) ot
        WHERE ot <> ''
          AND (
            lower(ga) LIKE '%' || lower(ot) || '%'
            OR lower(ot) LIKE '%' || lower(ga) || '%'
          )
      )
      OR EXISTS (
        SELECT 1 FROM unnest(v_themes) ot
        WHERE ot <> ''
          AND (
            lower(g.title) LIKE '%' || lower(ot) || '%'
            OR lower(coalesce(g.summary, '')) LIKE '%' || lower(ot) || '%'
          )
      )
    )

    -- ─── Budget gate (loose) ────────────────────────────────
    -- Drop only obvious mismatches: grant requires 5x+ more than the
    -- project asks (way too big), or caps below 10% of the ask (way too
    -- small). The heuristic itself does finer-grained scoring; this is
    -- just an outlier filter.
    AND (
      v_requested IS NULL
      OR (
        (g.min_amount_eur IS NULL OR g.min_amount_eur <= v_requested * 5)
        AND (g.max_amount_eur IS NULL OR g.max_amount_eur >= (v_requested * 0.1)::int)
      )
    );
END;
$$;
--> statement-breakpoint

-- Allow the service role + authenticated users to call the RPC.
GRANT EXECUTE ON FUNCTION prefilter_grants_for_project(uuid) TO authenticated, service_role;
