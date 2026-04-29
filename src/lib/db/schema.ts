import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ─── Organizations (NGO profiles) ────────────────────────────────
export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  country: text("country").notNull().default("FR"),
  legalStatus: text("legal_status"),
  mission: text("mission"),
  thematicAreas: text("thematic_areas").array(),
  beneficiaries: text("beneficiaries").array(),
  geographicFocus: text("geographic_focus").array(),
  annualBudgetEur: integer("annual_budget_eur"),
  teamSize: integer("team_size"),
  languages: text("languages").array(),
  priorGrants: text("prior_grants"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── Projects ────────────────────────────────────────────────────
export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .references(() => organizations.id)
    .notNull(),
  name: text("name").notNull(),
  summary: text("summary"),
  objectives: text("objectives").array(),
  targetBeneficiaries: text("target_beneficiaries").array(),
  targetGeography: text("target_geography").array(),
  requestedAmountEur: integer("requested_amount_eur"),
  durationMonths: integer("duration_months"),
  indicators: text("indicators").array(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── Grants (opportunity database) ───────────────────────────────
export const grants = pgTable("grants", {
  id: uuid("id").defaultRandom().primaryKey(),
  sourceUrl: text("source_url").notNull().unique(),
  sourceName: text("source_name"),
  title: text("title").notNull(),
  summary: text("summary"),
  rawContent: text("raw_content"),
  funder: text("funder"),
  country: text("country"),
  thematicAreas: text("thematic_areas").array(),
  eligibleEntities: text("eligible_entities").array(),
  eligibleCountries: text("eligible_countries").array(),
  minAmountEur: integer("min_amount_eur"),
  maxAmountEur: integer("max_amount_eur"),
  coFinancingRequired: boolean("co_financing_required"),
  deadline: timestamp("deadline", { withTimezone: true }),
  grantType: text("grant_type"),
  language: text("language"),
  status: text("status").default("active"),
  aiSummary: text("ai_summary"),
  popularityScore: integer("popularity_score").default(0).notNull(),
  // Enrichment columns (migration 0012). The enricher fills these from the
  // source page when the ingest transform can't — so detail pages render the
  // same template regardless of where the grant came from.
  openDate: timestamp("open_date", { withTimezone: true }),
  difficultyLevel: text("difficulty_level"),
  eligibilityConditions: text("eligibility_conditions"),
  requiredDocuments: text("required_documents").array(),
  applicationUrl: text("application_url"),
  contactInfo: text("contact_info"),
  coFinancingPct: integer("co_financing_pct"),
  enrichedAt: timestamp("enriched_at", { withTimezone: true }),
  // jsonb for the raw LLM output (or error trace). Drizzle's $type generic
  // gives us typed reads in callers without erasing the column type.
  enrichmentData: jsonb("enrichment_data").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── Match Scores ────────────────────────────────────────────────
export const matchScores = pgTable(
  "match_scores",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id)
      .notNull(),
    projectId: uuid("project_id").references(() => projects.id),
    grantId: uuid("grant_id")
      .references(() => grants.id)
      .notNull(),
    score: integer("score").notNull(),
    explanation: jsonb("explanation"),
    recommendation: text("recommendation"),
    computedAt: timestamp("computed_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("match_scores_unique_idx").on(
      table.organizationId,
      table.projectId,
      table.grantId
    ),
  ]
);

// ─── Proposals ───────────────────────────────────────────────────
export const proposals = pgTable("proposals", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .references(() => organizations.id)
    .notNull(),
  projectId: uuid("project_id").references(() => projects.id),
  grantId: uuid("grant_id")
    .references(() => grants.id)
    .notNull(),
  content: jsonb("content"),
  status: text("status").default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── Alert Preferences ──────────────────────────────────────────
export const alertPreferences = pgTable("alert_preferences", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .references(() => organizations.id)
    .notNull(),
  email: text("email").notNull(),
  frequency: text("frequency").default("weekly"),
  minScore: integer("min_score").default(60),
  enabled: boolean("enabled").default(true),
  lastSentAt: timestamp("last_sent_at", { withTimezone: true }),
});

// ─── Ingestion Logs (source run telemetry) ──────────────────────
export const ingestionLogs = pgTable("ingestion_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  runId: uuid("run_id").notNull(),
  sourceName: text("source_name").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  status: text("status").default("running").notNull(), // running | success | partial | failed
  fetched: integer("fetched").default(0),
  transformed: integer("transformed").default(0),
  inserted: integer("inserted").default(0),
  skipped: integer("skipped").default(0),
  errors: integer("errors").default(0),
  durationMs: integer("duration_ms").default(0),
  errorMessage: text("error_message"),
  errorDetails: jsonb("error_details"),
  trigger: text("trigger").default("manual"), // manual | cron-daily | cron-weekly | admin
});

// ─── User × Grant Interactions (feedback / learning signal) ─────
//
// Tinder-inspired: every gesture (like, dislike, save, dismiss, view,
// apply) becomes a row, and the matching pipeline boosts/penalises
// based on these signals over time. The unique index makes the API a
// clean upsert — re-clicking a button doesn't inflate the table.
export const userGrantInteractions = pgTable(
  "user_grant_interactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id)
      .notNull(),
    projectId: uuid("project_id").references(() => projects.id),
    grantId: uuid("grant_id")
      .references(() => grants.id)
      .notNull(),
    interactionType: text("interaction_type").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_interactions_unique").on(
      table.organizationId,
      table.grantId,
      table.interactionType
    ),
  ]
);

// ─── Email sequence (conversion engine) ─────────────────────────
//
// Free → Pro nurture sequence. `email_sequence_templates` holds the editable
// copy; `email_sequence_queue` is the per-user enrollment log used by the
// hourly cron and the open/click/unsubscribe tracking routes.
export const emailSequenceTemplates = pgTable("email_sequence_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  stepNumber: integer("step_number").notNull().unique(),
  delayDays: integer("delay_days").notNull(),
  subject: text("subject").notNull(),
  bodyHtml: text("body_html").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const emailSequenceQueue = pgTable("email_sequence_queue", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  organizationId: uuid("organization_id"),
  stepNumber: integer("step_number").notNull(),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  openedAt: timestamp("opened_at", { withTimezone: true }),
  clickedAt: timestamp("clicked_at", { withTimezone: true }),
  status: text("status").default("pending").notNull(),
  trackingToken: uuid("tracking_token").defaultRandom().notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Blog engine (Grant du Jour SEO articles) ───────────────────
export const blogPosts = pgTable("blog_posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  grantId: uuid("grant_id"),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  bodyHtml: text("body_html").notNull(),
  ctaBlock: text("cta_block"),
  faqSchema: jsonb("faq_schema"),
  coverImageUrl: text("cover_image_url"),
  thematicTag: text("thematic_tag"),
  keywords: text("keywords").array(),
  status: text("status").default("draft").notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  viewCount: integer("view_count").default(0).notNull(),
  ctaClicks: integer("cta_clicks").default(0).notNull(),
  wordCount: integer("word_count"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const blogGenerationLogs = pgTable("blog_generation_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  grantId: uuid("grant_id"),
  status: text("status").notNull(),
  wordCount: integer("word_count"),
  generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow().notNull(),
  errorMessage: text("error_message"),
});

export const blogCtaTemplates = pgTable("blog_cta_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  titleTemplate: text("title_template").notNull(),
  bodyText: text("body_text").notNull(),
  ctaButtonLabel: text("cta_button_label").default("Trouver mes grants →").notNull(),
  logframeEmbedUrl: text("logframe_embed_url"),
  reassuranceLine: text("reassurance_line").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Type exports ────────────────────────────────────────────────
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Grant = typeof grants.$inferSelect;
export type NewGrant = typeof grants.$inferInsert;
export type MatchScore = typeof matchScores.$inferSelect;
export type Proposal = typeof proposals.$inferSelect;
export type IngestionLog = typeof ingestionLogs.$inferSelect;
export type NewIngestionLog = typeof ingestionLogs.$inferInsert;
export type UserGrantInteraction = typeof userGrantInteractions.$inferSelect;
export type NewUserGrantInteraction = typeof userGrantInteractions.$inferInsert;
export type EmailSequenceTemplate = typeof emailSequenceTemplates.$inferSelect;
export type NewEmailSequenceTemplate = typeof emailSequenceTemplates.$inferInsert;
export type EmailSequenceQueueItem = typeof emailSequenceQueue.$inferSelect;
export type NewEmailSequenceQueueItem = typeof emailSequenceQueue.$inferInsert;
export type BlogPost = typeof blogPosts.$inferSelect;
export type NewBlogPost = typeof blogPosts.$inferInsert;
export type BlogGenerationLog = typeof blogGenerationLogs.$inferSelect;
export type NewBlogGenerationLog = typeof blogGenerationLogs.$inferInsert;
export type BlogCtaTemplate = typeof blogCtaTemplates.$inferSelect;
export type NewBlogCtaTemplate = typeof blogCtaTemplates.$inferInsert;
