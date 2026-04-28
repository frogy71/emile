-- Audience-mismatch gate for the match prefilter
--
-- A grant can pass the entity / theme / geo gates and still be structurally
-- ineligible because it targets a *different audience* (e.g. Erasmus+ funds
-- "inclusion numérique" only for young people; a project about digital
-- inclusion for seniors should never appear there). The heuristic in
-- scoring.ts has the same check, but adding it to the prefilter means we
-- never spend embedding/Claude tokens on these obvious mismatches.
--
-- Logic mirrors detectAudienceMismatch in scoring.ts:
--   - Detect 'youth' / 'senior' markers on each side.
--   - Exclude only when the project is strictly one audience and the grant
--     is strictly the OTHER audience. Mixed signals → keep (no evidence).

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
  v_project_blob text;
  v_project_youth boolean;
  v_project_senior boolean;
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
    END,
    -- One concatenated, lowercased blob of every project text source for
    -- the audience detection step. unaccent isn't installed by default,
    -- so we rely on lowercased substring matches; keywords below cover
    -- the most common French + English variants.
    lower(
      coalesce(p.name, '') || ' ' ||
      coalesce(p.summary, '') || ' ' ||
      coalesce(array_to_string(p.objectives, ' '), '') || ' ' ||
      coalesce(array_to_string(p.target_beneficiaries, ' '), '') || ' ' ||
      coalesce(o.mission, '') || ' ' ||
      coalesce(array_to_string(o.beneficiaries, ' '), '')
    )
  INTO v_geo, v_legal_status, v_requested, v_logframe_themes, v_project_blob
  FROM projects p
  JOIN organizations o ON o.id = p.organization_id
  WHERE p.id = p_project_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Audience flags for the project. Match accent-insensitively by listing
  -- both forms (with and without diacritics) so we don't depend on the
  -- unaccent extension.
  v_project_youth := v_project_blob ~
    '\m(jeunes?|jeunesse|adolescent|mineurs?|etudiant|étudiant|lyceens?|lycéens?|collegiens?|collégiens?|youth|young|erasmus)\M';
  v_project_senior := v_project_blob ~
    '\m(seniors?|personnes? agees?|personnes? âgées?|retraites?|retraités?|aines?|aînés?|aidants?|elderly|gerontolog|gérontolog|ehpad|cnsa|silver economie|silver économie|troisieme age|troisième age)\M'
    OR v_project_blob ~ '\m(plus de 6[05]\s*ans?|6[05]\s*ans? et plus|perte d.?autonomie)\M';

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

    -- ─── Audience gate ──────────────────────────────────────
    -- Drop the grant only when project audience is one-sided (youth XOR
    -- senior) AND grant audience is the *other* side, also one-sided.
    -- Mixed projects (both audiences detected) are not gated. Projects
    -- with neither audience marker are not gated either — no evidence to
    -- act on.
    AND NOT (
      v_project_senior AND NOT v_project_youth
      AND (
        -- Grant strongly signals youth (either by structured theme or
        -- by mentioning a youth marker in title/summary).
        (
          EXISTS (
            SELECT 1 FROM unnest(coalesce(g.thematic_areas, '{}'::text[])) ga
            WHERE lower(ga) ~ '\m(jeune|jeunesse|youth|young|erasmus)\M'
          )
          OR lower(coalesce(g.title, '')) ~
            '\m(jeunes?|jeunesse|adolescent|mineurs?|etudiant|étudiant|youth|young|erasmus)\M'
          OR lower(coalesce(g.summary, '')) ~
            '\m(jeunes?|jeunesse|adolescent|mineurs?|etudiant|étudiant|youth|young|erasmus)\M'
        )
        -- ...and the grant doesn't ALSO mention seniors (mixed grants
        -- pass through — they could fund either audience).
        AND NOT (
          lower(coalesce(g.title, '')) ~
            '\m(seniors?|agees?|âgées?|retraites?|retraités?|aines?|aînés?|elderly|ehpad|cnsa)\M'
          OR lower(coalesce(g.summary, '')) ~
            '\m(seniors?|agees?|âgées?|retraites?|retraités?|aines?|aînés?|elderly|ehpad|cnsa)\M'
          OR EXISTS (
            SELECT 1 FROM unnest(coalesce(g.thematic_areas, '{}'::text[])) ga
            WHERE lower(ga) ~ '\m(senior|age|retrait|aine|aîné|elderly)\M'
          )
        )
      )
    )
    AND NOT (
      v_project_youth AND NOT v_project_senior
      AND (
        (
          EXISTS (
            SELECT 1 FROM unnest(coalesce(g.thematic_areas, '{}'::text[])) ga
            WHERE lower(ga) ~ '\m(senior|age|retrait|aine|aîné|elderly)\M'
          )
          OR lower(coalesce(g.title, '')) ~
            '\m(seniors?|agees?|âgées?|retraites?|retraités?|aines?|aînés?|elderly|ehpad|cnsa)\M'
          OR lower(coalesce(g.summary, '')) ~
            '\m(seniors?|agees?|âgées?|retraites?|retraités?|aines?|aînés?|elderly|ehpad|cnsa)\M'
        )
        AND NOT (
          lower(coalesce(g.title, '')) ~
            '\m(jeunes?|jeunesse|adolescent|mineurs?|etudiant|étudiant|youth|young|erasmus)\M'
          OR lower(coalesce(g.summary, '')) ~
            '\m(jeunes?|jeunesse|adolescent|mineurs?|etudiant|étudiant|youth|young|erasmus)\M'
          OR EXISTS (
            SELECT 1 FROM unnest(coalesce(g.thematic_areas, '{}'::text[])) ga
            WHERE lower(ga) ~ '\m(jeune|jeunesse|youth|young|erasmus)\M'
          )
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

GRANT EXECUTE ON FUNCTION prefilter_grants_for_project(uuid) TO authenticated, service_role;
