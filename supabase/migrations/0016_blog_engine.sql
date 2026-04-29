-- Blog engine — automated SEO content for "Grant du Jour" articles.
--
-- Three tables:
--   blog_posts             : the article itself (HTML body, SEO meta, status)
--   blog_generation_logs   : audit of every generation run (success/failure)
--   blog_cta_templates     : editable conversion CTAs injected at the bottom
--
-- Plus `blog_published_at` on grants so the selector never reuses the same
-- grant twice and we can monitor the writable pool.

CREATE TABLE IF NOT EXISTS "blog_posts" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "grant_id" uuid REFERENCES grants(id) ON DELETE SET NULL,
  "title" text NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "meta_title" text,
  "meta_description" text,
  "body_html" text NOT NULL,
  "cta_block" text,
  "faq_schema" jsonb,
  "cover_image_url" text,
  "thematic_tag" text,
  "keywords" text[],
  "status" text DEFAULT 'draft' NOT NULL CHECK (status IN ('draft','published','scheduled')),
  "published_at" timestamptz,
  "scheduled_at" timestamptz,
  "view_count" integer DEFAULT 0 NOT NULL,
  "cta_clicks" integer DEFAULT 0 NOT NULL,
  "word_count" integer,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "blog_generation_logs" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "grant_id" uuid REFERENCES grants(id) ON DELETE SET NULL,
  "status" text NOT NULL,
  "word_count" integer,
  "generated_at" timestamptz DEFAULT now() NOT NULL,
  "error_message" text
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "blog_cta_templates" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "title_template" text NOT NULL,
  "body_text" text NOT NULL,
  "cta_button_label" text DEFAULT 'Trouver mes grants →' NOT NULL,
  "logframe_embed_url" text,
  "reassurance_line" text DEFAULT 'Gratuit · Sans carte bancaire · 6 000 grants indexés' NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint

ALTER TABLE "grants"
  ADD COLUMN IF NOT EXISTS "blog_published_at" timestamptz;
--> statement-breakpoint

ALTER TABLE "grants"
  ADD COLUMN IF NOT EXISTS "blog_blacklisted" boolean DEFAULT false NOT NULL;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_blog_posts_slug"
  ON "blog_posts"("slug");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_blog_posts_published"
  ON "blog_posts"("published_at" DESC)
  WHERE "status" = 'published';
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_blog_posts_thematic_tag"
  ON "blog_posts"("thematic_tag")
  WHERE "status" = 'published';
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_blog_logs_generated_at"
  ON "blog_generation_logs"("generated_at" DESC);
--> statement-breakpoint

-- RLS: blog_posts are public-readable when published, admin-writable.
-- Public access goes through anon role on the published rows; everything
-- else (drafts, generation logs, CTA edits) lives behind service role.
ALTER TABLE "blog_posts" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

ALTER TABLE "blog_generation_logs" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

ALTER TABLE "blog_cta_templates" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

CREATE POLICY "blog_posts_public_read"
  ON "blog_posts"
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');
--> statement-breakpoint

-- Seed a default CTA template so the engine has something to inject on day 1.
INSERT INTO "blog_cta_templates" (
  title_template,
  body_text,
  cta_button_label,
  reassurance_line,
  is_active
) VALUES (
  'Vous cherchez des financements pour {{thematic_tag}} ?',
  'Émile indexe plus de 6 000 subventions actives en France et en Europe. Décrivez votre projet en 2 minutes — notre IA matche les appels qui collent à votre association et génère vos dossiers en un clic.',
  'Trouver mes grants →',
  'Gratuit · Sans carte bancaire · 6 000 grants indexés',
  true
) ON CONFLICT DO NOTHING;
