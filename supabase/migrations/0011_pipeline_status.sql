-- Pipeline / Kanban tracking on user_grant_interactions
--
-- Once a user expresses interest in a grant (like / save), we want to track
-- where the application sits in their workflow: discovered → en préparation →
-- candidaté → en attente → accepté / refusé. This is what powers the
-- /pipeline Kanban board.
--
-- Implementation notes:
--   - We piggy-back on user_grant_interactions rather than spinning up a new
--     table because every Kanban card is already an interaction. This keeps
--     the source of truth single and avoids a join + sync problem.
--   - A trigger forces pipeline_status = 'discovered' when an interaction
--     of type 'like' or 'save' is inserted, so the front-end doesn't have
--     to remember to set it on every interaction call.

ALTER TABLE "user_grant_interactions"
  ADD COLUMN IF NOT EXISTS "pipeline_status" text DEFAULT 'discovered'
  CHECK ("pipeline_status" IN (
    'discovered', 'preparing', 'applied', 'waiting', 'accepted', 'rejected'
  ));
--> statement-breakpoint

-- Read path for the Kanban: list every grant in the user's pipeline grouped
-- by column. The board only cares about the org and the column, so this is
-- the smallest useful index.
CREATE INDEX IF NOT EXISTS "idx_interactions_pipeline"
  ON "user_grant_interactions"("organization_id", "pipeline_status");
--> statement-breakpoint

-- Auto-seed the column when a positive interaction is recorded.
-- Only stamps 'discovered' on insert and only if pipeline_status is still
-- the default — a manual move (e.g. user dragged the card to "applied")
-- shouldn't be overwritten by a later like/save on the same row.
CREATE OR REPLACE FUNCTION set_pipeline_status_on_positive_interaction()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.interaction_type IN ('like', 'save')
     AND (NEW.pipeline_status IS NULL OR NEW.pipeline_status = 'discovered') THEN
    NEW.pipeline_status := 'discovered';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint

DROP TRIGGER IF EXISTS trg_set_pipeline_status ON "user_grant_interactions";
--> statement-breakpoint

CREATE TRIGGER trg_set_pipeline_status
  BEFORE INSERT ON "user_grant_interactions"
  FOR EACH ROW
  EXECUTE FUNCTION set_pipeline_status_on_positive_interaction();
