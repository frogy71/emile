/**
 * Shared types for the blog engine.
 *
 * Blocks 1–5 are the structured pieces Claude returns; we glue them into a
 * single body_html before saving. Keeping them separate at generation time
 * lets us re-render the article server-side with consistent markup and
 * makes it easy for the admin UI to surface field-level edits later.
 */

export interface BlogGrantInput {
  id: string;
  title: string;
  summary: string | null;
  funder: string | null;
  country: string | null;
  thematic_areas: string[] | null;
  eligible_entities: string[] | null;
  eligible_countries: string[] | null;
  min_amount_eur: number | null;
  max_amount_eur: number | null;
  co_financing_required: boolean | null;
  deadline: string | null;
  grant_type: string | null;
  language: string | null;
  eligibility_conditions: string | null;
  ai_summary: string | null;
}

export interface FaqEntry {
  question: string;
  answer: string;
}

export interface GeneratedArticle {
  title: string;
  metaTitle: string;
  metaDescription: string;
  slug: string;
  keywords: string[];
  thematicTag: string;
  chapeau: string;
  ficheRapide: string;
  presentation: string;
  applyGuide: string;
  similarGrants: string;
  faqs: FaqEntry[];
  wordCount: number;
}

export interface SimilarPost {
  slug: string;
  title: string;
  thematicTag: string | null;
}
