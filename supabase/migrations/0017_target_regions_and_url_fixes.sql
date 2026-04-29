-- target_regions column + URL repair + strict regional gate in the prefilter
--
-- Three problems addressed in one migration so the column add, the data
-- repair and the SQL function rewrite stay consistent:
--
-- 1. `eligible_countries = ['FR']` collapses every regional grant onto the
--    same bucket, so a Bretagne project gets matched to IDF/PACA/Occitanie
--    aids. We add `target_regions text[]` and require strict overlap when
--    the project specifies a French region.
--
-- 2. ~205 Aides-Territoires rows have relative source_url paths
--    (`/aides/...`) because the transform fell through to raw.url when
--    origin_url was null. The transform is now fixed; this migration
--    repairs the existing rows.
--
-- 3. data.gouv FRUP / Fondations entreprises rows pointed at a fabricated
--    `data.gouv.fr/frup/{NAME}` URL that never existed. We rewrite them to
--    the real dataset page with a `?fondation={NAME}` disambiguator so the
--    unique constraint still holds and the link actually opens.

-- ─── 1. New column + index ───────────────────────────────────────

ALTER TABLE "grants"
  ADD COLUMN IF NOT EXISTS "target_regions" text[];
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "grants_target_regions_gin_idx"
  ON "grants" USING GIN ("target_regions");
--> statement-breakpoint

-- ─── 2. Backfill target_regions for the curated regional sources ─

-- regions.ts (Conseils Régionaux): the title prefixes the region name.
UPDATE "grants" SET "target_regions" = ARRAY['Île-de-France']
  WHERE "source_name" = 'Conseils Régionaux'
    AND ("title" ILIKE 'Île-de-France%' OR "title" ILIKE 'IDF%')
    AND "target_regions" IS NULL;
--> statement-breakpoint
UPDATE "grants" SET "target_regions" = ARRAY['Auvergne-Rhône-Alpes']
  WHERE "source_name" = 'Conseils Régionaux'
    AND ("title" ILIKE 'Auvergne-Rhône-Alpes%' OR "title" ILIKE 'AURA%')
    AND "target_regions" IS NULL;
--> statement-breakpoint
UPDATE "grants" SET "target_regions" = ARRAY['Nouvelle-Aquitaine']
  WHERE "source_name" = 'Conseils Régionaux'
    AND "title" ILIKE 'Nouvelle-Aquitaine%'
    AND "target_regions" IS NULL;
--> statement-breakpoint
UPDATE "grants" SET "target_regions" = ARRAY['Occitanie']
  WHERE "source_name" = 'Conseils Régionaux'
    AND "title" ILIKE 'Occitanie%'
    AND "target_regions" IS NULL;
--> statement-breakpoint
UPDATE "grants" SET "target_regions" = ARRAY['Grand Est']
  WHERE "source_name" = 'Conseils Régionaux'
    AND "title" ILIKE 'Grand Est%'
    AND "target_regions" IS NULL;
--> statement-breakpoint
UPDATE "grants" SET "target_regions" = ARRAY['Hauts-de-France']
  WHERE "source_name" = 'Conseils Régionaux'
    AND "title" ILIKE 'Hauts-de-France%'
    AND "target_regions" IS NULL;
--> statement-breakpoint
UPDATE "grants" SET "target_regions" = ARRAY['Provence-Alpes-Côte d''Azur']
  WHERE "source_name" = 'Conseils Régionaux'
    AND ("title" ILIKE 'PACA%' OR "title" ILIKE 'Provence-Alpes-Côte%')
    AND "target_regions" IS NULL;
--> statement-breakpoint
UPDATE "grants" SET "target_regions" = ARRAY['Bretagne']
  WHERE "source_name" = 'Conseils Régionaux'
    AND "title" ILIKE 'Bretagne%'
    AND "target_regions" IS NULL;
--> statement-breakpoint
UPDATE "grants" SET "target_regions" = ARRAY['Pays de la Loire']
  WHERE "source_name" = 'Conseils Régionaux'
    AND "title" ILIKE 'Pays de la Loire%'
    AND "target_regions" IS NULL;
--> statement-breakpoint
UPDATE "grants" SET "target_regions" = ARRAY['Normandie']
  WHERE "source_name" = 'Conseils Régionaux'
    AND "title" ILIKE 'Normandie%'
    AND "target_regions" IS NULL;
--> statement-breakpoint
UPDATE "grants" SET "target_regions" = ARRAY['Bourgogne-Franche-Comté']
  WHERE "source_name" = 'Conseils Régionaux'
    AND ("title" ILIKE 'BFC%' OR "title" ILIKE 'Bourgogne-Franche-Comté%')
    AND "target_regions" IS NULL;
--> statement-breakpoint
UPDATE "grants" SET "target_regions" = ARRAY['Centre-Val de Loire']
  WHERE "source_name" = 'Conseils Régionaux'
    AND "title" ILIKE 'Centre-Val de Loire%'
    AND "target_regions" IS NULL;
--> statement-breakpoint
UPDATE "grants" SET "target_regions" = ARRAY['Corse']
  WHERE "source_name" = 'Conseils Régionaux'
    AND "title" ILIKE 'Corse%'
    AND "target_regions" IS NULL;
--> statement-breakpoint
UPDATE "grants" SET "target_regions" = ARRAY['Guadeloupe']
  WHERE "source_name" = 'Conseils Régionaux'
    AND "title" ILIKE 'Guadeloupe%'
    AND "target_regions" IS NULL;
--> statement-breakpoint
UPDATE "grants" SET "target_regions" = ARRAY['Martinique']
  WHERE "source_name" = 'Conseils Régionaux'
    AND "title" ILIKE 'Martinique%'
    AND "target_regions" IS NULL;
--> statement-breakpoint
UPDATE "grants" SET "target_regions" = ARRAY['Guyane']
  WHERE "source_name" = 'Conseils Régionaux'
    AND "title" ILIKE 'Guyane%'
    AND "target_regions" IS NULL;
--> statement-breakpoint
UPDATE "grants" SET "target_regions" = ARRAY['La Réunion']
  WHERE "source_name" = 'Conseils Régionaux'
    AND ("title" ILIKE 'La Réunion%' OR "title" ILIKE 'Réunion%')
    AND "target_regions" IS NULL;
--> statement-breakpoint
UPDATE "grants" SET "target_regions" = ARRAY['Mayotte']
  WHERE "source_name" = 'Conseils Régionaux'
    AND "title" ILIKE 'Mayotte%'
    AND "target_regions" IS NULL;
--> statement-breakpoint

-- IDF + Occitanie regional ingestion sources
UPDATE "grants" SET "target_regions" = ARRAY['Île-de-France']
  WHERE "source_name" = 'Île-de-France — Aides régionales'
    AND "target_regions" IS NULL;
--> statement-breakpoint
UPDATE "grants" SET "target_regions" = ARRAY['Occitanie']
  WHERE "source_name" = 'Occitanie — Aides régionales'
    AND "target_regions" IS NULL;
--> statement-breakpoint

-- DRAC + ARS — region inferred from the funder string ("DRAC Bretagne", etc.)
UPDATE "grants" SET "target_regions" = ARRAY['Auvergne-Rhône-Alpes']
  WHERE ("source_name" = 'DRAC — Directions Régionales des Affaires Culturelles' OR "source_name" = 'ARS — Agences Régionales de Santé')
    AND "funder" ILIKE '%Auvergne-Rhône-Alpes%' AND "target_regions" IS NULL;
--> statement-breakpoint
UPDATE "grants" SET "target_regions" = ARRAY['Bourgogne-Franche-Comté']
  WHERE ("source_name" = 'DRAC — Directions Régionales des Affaires Culturelles' OR "source_name" = 'ARS — Agences Régionales de Santé')
    AND "funder" ILIKE '%Bourgogne-Franche-Comté%' AND "target_regions" IS NULL;
--> statement-breakpoint
UPDATE "grants" SET "target_regions" = ARRAY['Bretagne']
  WHERE ("source_name" = 'DRAC — Directions Régionales des Affaires Culturelles' OR "source_name" = 'ARS — Agences Régionales de Santé')
    AND "funder" ILIKE '%Bretagne%' AND "target_regions" IS NULL;
--> statement-breakpoint
UPDATE "grants" SET "target_regions" = ARRAY['Centre-Val de Loire']
  WHERE ("source_name" = 'DRAC — Directions Régionales des Affaires Culturelles' OR "source_name" = 'ARS — Agences Régionales de Santé')
    AND "funder" ILIKE '%Centre-Val de Loire%' AND "target_regions" IS NULL;
--> statement-breakpoint
UPDATE "grants" SET "target_regions" = ARRAY['Corse']
  WHERE ("source_name" = 'DRAC — Directions Régionales des Affaires Culturelles' OR "source_name" = 'ARS — Agences Régionales de Santé')
    AND "funder" ILIKE '%Corse%' AND "target_regions" IS NULL;
--> statement-breakpoint
UPDATE "grants" SET "target_regions" = ARRAY['Grand Est']
  WHERE ("source_name" = 'DRAC — Directions Régionales des Affaires Culturelles' OR "source_name" = 'ARS — Agences Régionales de Santé')
    AND "funder" ILIKE '%Grand Est%' AND "target_regions" IS NULL;
--> statement-breakpoint
UPDATE "grants" SET "target_regions" = ARRAY['Hauts-de-France']
  WHERE ("source_name" = 'DRAC — Directions Régionales des Affaires Culturelles' OR "source_name" = 'ARS — Agences Régionales de Santé')
    AND "funder" ILIKE '%Hauts-de-France%' AND "target_regions" IS NULL;
--> statement-breakpoint
UPDATE "grants" SET "target_regions" = ARRAY['Île-de-France']
  WHERE ("source_name" = 'DRAC — Directions Régionales des Affaires Culturelles' OR "source_name" = 'ARS — Agences Régionales de Santé')
    AND "funder" ILIKE '%Île-de-France%' AND "target_regions" IS NULL;
--> statement-breakpoint
UPDATE "grants" SET "target_regions" = ARRAY['Normandie']
  WHERE ("source_name" = 'DRAC — Directions Régionales des Affaires Culturelles' OR "source_name" = 'ARS — Agences Régionales de Santé')
    AND "funder" ILIKE '%Normandie%' AND "target_regions" IS NULL;
--> statement-breakpoint
UPDATE "grants" SET "target_regions" = ARRAY['Nouvelle-Aquitaine']
  WHERE ("source_name" = 'DRAC — Directions Régionales des Affaires Culturelles' OR "source_name" = 'ARS — Agences Régionales de Santé')
    AND "funder" ILIKE '%Nouvelle-Aquitaine%' AND "target_regions" IS NULL;
--> statement-breakpoint
UPDATE "grants" SET "target_regions" = ARRAY['Occitanie']
  WHERE ("source_name" = 'DRAC — Directions Régionales des Affaires Culturelles' OR "source_name" = 'ARS — Agences Régionales de Santé')
    AND "funder" ILIKE '%Occitanie%' AND "target_regions" IS NULL;
--> statement-breakpoint
UPDATE "grants" SET "target_regions" = ARRAY['Pays de la Loire']
  WHERE ("source_name" = 'DRAC — Directions Régionales des Affaires Culturelles' OR "source_name" = 'ARS — Agences Régionales de Santé')
    AND "funder" ILIKE '%Pays de la Loire%' AND "target_regions" IS NULL;
--> statement-breakpoint
UPDATE "grants" SET "target_regions" = ARRAY['Provence-Alpes-Côte d''Azur']
  WHERE ("source_name" = 'DRAC — Directions Régionales des Affaires Culturelles' OR "source_name" = 'ARS — Agences Régionales de Santé')
    AND ("funder" ILIKE '%Provence-Alpes-Côte%' OR "funder" ILIKE '%PACA%')
    AND "target_regions" IS NULL;
--> statement-breakpoint
UPDATE "grants" SET "target_regions" = ARRAY['Guadeloupe']
  WHERE ("source_name" = 'DRAC — Directions Régionales des Affaires Culturelles' OR "source_name" = 'ARS — Agences Régionales de Santé')
    AND "funder" ILIKE '%Guadeloupe%' AND "target_regions" IS NULL;
--> statement-breakpoint
UPDATE "grants" SET "target_regions" = ARRAY['Martinique']
  WHERE ("source_name" = 'DRAC — Directions Régionales des Affaires Culturelles' OR "source_name" = 'ARS — Agences Régionales de Santé')
    AND "funder" ILIKE '%Martinique%' AND "target_regions" IS NULL;
--> statement-breakpoint
UPDATE "grants" SET "target_regions" = ARRAY['Guyane']
  WHERE ("source_name" = 'DRAC — Directions Régionales des Affaires Culturelles' OR "source_name" = 'ARS — Agences Régionales de Santé')
    AND "funder" ILIKE '%Guyane%' AND "target_regions" IS NULL;
--> statement-breakpoint
UPDATE "grants" SET "target_regions" = ARRAY['La Réunion']
  WHERE ("source_name" = 'DRAC — Directions Régionales des Affaires Culturelles' OR "source_name" = 'ARS — Agences Régionales de Santé')
    AND "funder" ILIKE '%Réunion%' AND "target_regions" IS NULL;
--> statement-breakpoint
UPDATE "grants" SET "target_regions" = ARRAY['Mayotte']
  WHERE ("source_name" = 'DRAC — Directions Régionales des Affaires Culturelles' OR "source_name" = 'ARS — Agences Régionales de Santé')
    AND "funder" ILIKE '%Mayotte%' AND "target_regions" IS NULL;
--> statement-breakpoint

-- ─── 3. Repair broken Aides-Territoires URLs ─────────────────────

-- Some rows landed with relative paths like "/aides/abc/" because origin_url
-- was null and the transform fell back to raw.url. Two-step: first try to
-- prepend the AT base, but skip rows whose target URL already exists for
-- another grant (rare but possible because of historic reingest with different
-- transforms).
UPDATE "grants"
   SET "source_url" = 'https://aides-territoires.beta.gouv.fr' || "source_url"
 WHERE "source_name" = 'Aides-Territoires'
   AND "source_url" LIKE '/%'
   AND NOT EXISTS (
     SELECT 1 FROM "grants" g2
     WHERE g2."source_url" = 'https://aides-territoires.beta.gouv.fr' || "grants"."source_url"
   );
--> statement-breakpoint

-- Anything still relative is a duplicate of an already-correct row — drop it
-- so we don't keep dead links in the catalog.
DELETE FROM "grants"
 WHERE "source_name" = 'Aides-Territoires'
   AND "source_url" LIKE '/%';
--> statement-breakpoint

-- ─── 4. Repair fabricated data.gouv FRUP / FE URLs ───────────────

-- Old URL: https://data.gouv.fr/frup/{NAME}            → fabricated, 404s
-- New URL: https://www.data.gouv.fr/fr/datasets/fondations-reconnues-d-utilite-publique/?fondation={NAME}
--
-- We extract the name segment after "frup/" or "fe/" and rebuild against the
-- real dataset slug. The unique constraint on source_url is preserved because
-- the foundation name is unique within each list.

UPDATE "grants"
   SET "source_url" =
     'https://www.data.gouv.fr/fr/datasets/fondations-reconnues-d-utilite-publique/?fondation='
     || substring("source_url" from 'frup/(.*)$')
 WHERE "source_name" = 'data.gouv.fr — FRUP'
   AND "source_url" LIKE 'https://data.gouv.fr/frup/%';
--> statement-breakpoint

UPDATE "grants"
   SET "source_url" =
     'https://www.data.gouv.fr/fr/datasets/fondations-d-entreprises/?fondation='
     || substring("source_url" from 'fe/(.*)$')
 WHERE "source_name" = 'data.gouv.fr — Fondations entreprises'
   AND "source_url" LIKE 'https://data.gouv.fr/fe/%';
--> statement-breakpoint

-- ─── 5. Rebuild the prefilter with a strict regional gate ────────
--
-- The old gate used fuzzy substring matching on eligible_countries, so a
-- grant tagged ['FR'] for IDF would still match a project tagged "Bretagne"
-- because "France" is a substring of "Île-de-France". The new gate uses the
-- target_regions column we just added: when the project specifies any
-- French region, grants bound to a *different* region are rejected.

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
  v_project_regions text[];
  v_project_has_world boolean;
BEGIN
  SELECT
    array_remove(
      coalesce(o.geographic_focus, '{}'::text[])
        || coalesce(p.target_geography, '{}'::text[]),
      NULL
    ),
    o.legal_status,
    p.requested_amount_eur,
    CASE
      WHEN p.logframe_data IS NULL
        OR jsonb_typeof(p.logframe_data->'themes') <> 'array'
      THEN '{}'::text[]
      ELSE ARRAY(
        SELECT jsonb_array_elements_text(p.logframe_data->'themes')
      )
    END,
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

  v_project_youth := v_project_blob ~
    '\m(jeunes?|jeunesse|adolescent|mineurs?|etudiant|étudiant|lyceens?|lycéens?|collegiens?|collégiens?|youth|young|erasmus)\M';
  v_project_senior := v_project_blob ~
    '\m(seniors?|personnes? agees?|personnes? âgées?|retraites?|retraités?|aines?|aînés?|aidants?|elderly|gerontolog|gérontolog|ehpad|cnsa|silver economie|silver économie|troisieme age|troisième age)\M'
    OR v_project_blob ~ '\m(plus de 6[05]\s*ans?|6[05]\s*ans? et plus|perte d.?autonomie)\M';

  -- Pull the specific French regions the project (or org) targets. We
  -- match each user-supplied geo token against a fixed list of French
  -- regions; everything that *isn't* a region (Local, National, Europe,
  -- World, Afrique…) is ignored here and handled by the world flag below.
  SELECT array_agg(DISTINCT region) FROM (
    SELECT region FROM (VALUES
      ('Île-de-France'), ('Auvergne-Rhône-Alpes'), ('Nouvelle-Aquitaine'),
      ('Occitanie'), ('Hauts-de-France'), ('Grand Est'),
      ('Provence-Alpes-Côte d''Azur'), ('Bretagne'), ('Pays de la Loire'),
      ('Normandie'), ('Bourgogne-Franche-Comté'), ('Centre-Val de Loire'),
      ('Corse'), ('Guadeloupe'), ('Martinique'), ('Guyane'),
      ('La Réunion'), ('Mayotte')
    ) AS r(region)
    WHERE EXISTS (
      SELECT 1 FROM unnest(coalesce(v_geo, '{}'::text[])) g
      WHERE lower(g) = lower(region)
        OR (lower(region) <> 'france' AND lower(g) LIKE '%' || lower(region) || '%')
    )
  ) regions
  INTO v_project_regions;

  v_project_has_world := EXISTS (
    SELECT 1 FROM unnest(coalesce(v_geo, '{}'::text[])) g
    WHERE lower(g) ~ '\m(world|international|monde|europe|eu\b|ue\b|afrique|africa|asie|asia|amerique|america|national|france|fr)\M'
  );

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

    -- ─── Geographic gate (country level) ─────────────────────
    AND (
      g.eligible_countries IS NULL
      OR cardinality(g.eligible_countries) = 0
      OR g.eligible_countries && ARRAY[
        'world','international','World','International',
        'monde','Monde','MONDE','WORLD','INTERNATIONAL'
      ]::text[]
      OR g.eligible_countries && v_geo
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

    -- ─── Strict regional gate ────────────────────────────────
    -- A grant scoped to a specific French region is only eligible
    -- when (a) the project doesn't specify any region (national /
    -- world only), or (b) the project's regions overlap the grant's.
    -- Grants without target_regions are treated as national and
    -- always pass this gate.
    AND (
      g.target_regions IS NULL
      OR cardinality(g.target_regions) = 0
      OR coalesce(cardinality(v_project_regions), 0) = 0
      OR g.target_regions && v_project_regions
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
    AND NOT (
      v_project_senior AND NOT v_project_youth
      AND (
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
--> statement-breakpoint

-- ─── 6. app_state singleton table ────────────────────────────────
--
-- Tiny key/value table for tiny pieces of cross-cron state. Used by the
-- enrichment cron to throttle backlog alerts (don't email every 6h once
-- the threshold is crossed). Service role only — never exposed to clients.
CREATE TABLE IF NOT EXISTS "app_state" (
  "key" text PRIMARY KEY,
  "value" text,
  "updated_at" timestamptz DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "app_state" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

-- Helpful index on enriched_at NULL — the cron pulls these by created_at asc
-- so a partial index on (enriched_at IS NULL) keeps the scan tight.
CREATE INDEX IF NOT EXISTS "grants_unenriched_idx"
  ON "grants" ("created_at" ASC)
  WHERE "enriched_at" IS NULL;
