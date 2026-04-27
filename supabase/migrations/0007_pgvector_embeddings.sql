-- Semantic matching: pgvector embeddings on grants + projects.
--
-- Goal: replace the keyword-based heuristic (Stage 2 of the match funnel)
-- with cosine-similarity ranking against a dense embedding. This handles
-- typos, synonyms and cross-lingual queries (FR/EN/UK) that the keyword
-- table can't cover.
--
-- Vector dimension is 1536 — chosen so the column accepts BOTH:
--   • OpenAI text-embedding-3-small (native 1536)
--   • Voyage AI voyage-3-large with output_dimension=1536
-- so we can switch providers without migrating the column.

CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint

-- ─── Columns ─────────────────────────────────────────────────────

ALTER TABLE "grants"
  ADD COLUMN IF NOT EXISTS "embedding" vector(1536);
--> statement-breakpoint

ALTER TABLE "grants"
  ADD COLUMN IF NOT EXISTS "embedding_updated_at" timestamptz;
--> statement-breakpoint

ALTER TABLE "projects"
  ADD COLUMN IF NOT EXISTS "embedding" vector(1536);
--> statement-breakpoint

ALTER TABLE "projects"
  ADD COLUMN IF NOT EXISTS "embedding_updated_at" timestamptz;
--> statement-breakpoint

-- ─── ANN indexes ─────────────────────────────────────────────────
--
-- HNSW gives better recall/latency than IVFFlat on small/medium tables
-- and doesn't require a training step, which makes incremental ingest
-- friendlier. m=16 / ef_construction=64 are pgvector's documented
-- defaults — fine for ≤100k rows. Bump ef_search at query time if recall
-- is the bottleneck.
--
-- vector_cosine_ops because we always query with cosine similarity.

CREATE INDEX IF NOT EXISTS "grants_embedding_hnsw_idx"
  ON "grants" USING hnsw ("embedding" vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "projects_embedding_hnsw_idx"
  ON "projects" USING hnsw ("embedding" vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
--> statement-breakpoint

-- ─── Stage-2 RPC: rank prefiltered grants by cosine similarity ──
--
-- Takes the project's embedding + the set of grant ids that survived
-- Stage 1 (the SQL prefilter) and returns the top N by similarity. Doing
-- this in Postgres avoids shipping ~hundreds of 1536-dim vectors over
-- the wire just to compute dot products in JS.
--
-- Returns similarity in [0, 1] (1 - cosine_distance). Any grant without
-- an embedding is excluded — the caller falls back to the heuristic
-- ranking for those, so backfill-in-progress isn't a hard failure.

DROP FUNCTION IF EXISTS rank_grants_by_embedding(vector, uuid[], int);
--> statement-breakpoint

CREATE OR REPLACE FUNCTION rank_grants_by_embedding(
  p_query_embedding vector(1536),
  p_grant_ids uuid[],
  p_match_count int DEFAULT 50
)
RETURNS TABLE (
  grant_id uuid,
  similarity float
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    g.id AS grant_id,
    1 - (g.embedding <=> p_query_embedding) AS similarity
  FROM grants g
  WHERE g.id = ANY (p_grant_ids)
    AND g.embedding IS NOT NULL
  ORDER BY g.embedding <=> p_query_embedding
  LIMIT p_match_count;
$$;
--> statement-breakpoint

GRANT EXECUTE ON FUNCTION rank_grants_by_embedding(vector, uuid[], int)
  TO authenticated, service_role;
--> statement-breakpoint

-- ─── Convenience RPC: full-corpus semantic search ───────────────
--
-- Searches the entire grants table (not just prefiltered ids). Useful
-- for ad-hoc semantic search UIs and the backfill verification CLI.
-- Includes a similarity floor so we don't return obviously bad matches.

DROP FUNCTION IF EXISTS match_grants_by_embedding(vector, float, int);
--> statement-breakpoint

CREATE OR REPLACE FUNCTION match_grants_by_embedding(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.0,
  match_count int DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  title text,
  funder text,
  similarity float
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    g.id,
    g.title,
    g.funder,
    1 - (g.embedding <=> query_embedding) AS similarity
  FROM grants g
  WHERE g.embedding IS NOT NULL
    AND g.status = 'active'
    AND (g.deadline IS NULL OR g.deadline > now())
    AND (1 - (g.embedding <=> query_embedding)) >= match_threshold
  ORDER BY g.embedding <=> query_embedding
  LIMIT match_count;
$$;
--> statement-breakpoint

GRANT EXECUTE ON FUNCTION match_grants_by_embedding(vector, float, int)
  TO authenticated, service_role;
