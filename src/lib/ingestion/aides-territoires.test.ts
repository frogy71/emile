import { describe, it, expect } from "vitest";
import { transformToGrant, type AideTerritoireRaw } from "./aides-territoires";

const baseRaw: AideTerritoireRaw = {
  id: 1,
  url: "https://aides-territoires.beta.gouv.fr/api/aids/1/",
  name: "Aide aux associations",
  name_initial: "Aide aux associations",
  short_title: "AAA",
  description: "<p>Soutien aux associations humanitaires françaises.</p>",
  eligibility: "Associations loi 1901",
  perimeter: "France",
  financers: ["Ministère de l'Intérieur"],
  instructors: ["DDCS"],
  categories: ["Solidarité", "Humanitaire"],
  targeted_audiences: ["Associations"],
  aid_types: ["Subvention"],
  destinations: ["Fonctionnement"],
  start_date: "2026-01-01",
  predeposit_date: null,
  submission_deadline: "2026-12-31",
  subvention_rate_lower_bound: null,
  subvention_rate_upper_bound: null,
  subvention_comment: "jusqu'à 50 000 €",
  loan_amount: null,
  recoverable_advance_amount: null,
  contact: "contact@example.gouv.fr",
  origin_url: "https://example.gouv.fr/aide/1",
  application_url: "https://example.gouv.fr/aide/1/postuler",
  is_call_for_project: false,
  programs: [],
  date_created: "2026-01-01",
  date_updated: "2026-01-15",
};

describe("transformToGrant (Aides-Territoires)", () => {
  it("emits source_name = 'Aides-Territoires'", () => {
    const g = transformToGrant(baseRaw);
    expect(g.sourceName).toBe("Aides-Territoires");
  });

  it("uses origin_url first, falls back to application_url then api url", () => {
    const g = transformToGrant(baseRaw);
    expect(g.sourceUrl).toBe("https://example.gouv.fr/aide/1");

    const noOrigin = { ...baseRaw, origin_url: "" };
    expect(transformToGrant(noOrigin).sourceUrl).toBe(
      "https://example.gouv.fr/aide/1/postuler"
    );
  });

  it("strips HTML from summary", () => {
    const g = transformToGrant(baseRaw);
    expect(g.summary).not.toContain("<p>");
    expect(g.summary).toContain("Soutien aux associations humanitaires");
  });

  it("extracts deadline from submission_deadline", () => {
    const g = transformToGrant(baseRaw);
    expect(g.deadline).toBeInstanceOf(Date);
    expect(g.deadline?.toISOString().startsWith("2026-12-31")).toBe(true);
  });

  it("falls back to predeposit_date when submission_deadline is null", () => {
    const r = {
      ...baseRaw,
      submission_deadline: null,
      predeposit_date: "2026-06-30",
    };
    const g = transformToGrant(r);
    expect(g.deadline?.toISOString().startsWith("2026-06-30")).toBe(true);
  });

  it("extracts amount from subvention_comment", () => {
    const g = transformToGrant(baseRaw);
    expect(g.maxAmountEur).toBe(50_000);
  });

  it("prefers loan_amount over parsed text", () => {
    const r = { ...baseRaw, loan_amount: 100_000 };
    expect(transformToGrant(r).maxAmountEur).toBe(100_000);
  });

  it("sets country=EU when programs include europe-related strings", () => {
    const r = { ...baseRaw, programs: ["Erasmus+"] };
    expect(transformToGrant(r).country).toBe("EU");
  });

  it("sets country=FR by default", () => {
    expect(transformToGrant(baseRaw).country).toBe("FR");
  });

  it("uses financers as funder when present", () => {
    const g = transformToGrant(baseRaw);
    expect(g.funder).toBe("Ministère de l'Intérieur");
  });

  it("falls back to instructors when no financers", () => {
    const r = { ...baseRaw, financers: [] };
    expect(transformToGrant(r).funder).toBe("DDCS");
  });

  it("returns null funder when neither financers nor instructors are set", () => {
    const r = { ...baseRaw, financers: [], instructors: [] };
    expect(transformToGrant(r).funder).toBeNull();
  });

  it("infers grantType=appel_a_projets when is_call_for_project is true", () => {
    const r = { ...baseRaw, is_call_for_project: true };
    expect(transformToGrant(r).grantType).toBe("appel_a_projets");
  });

  it("detects 'pret' when aid_types contains a loan", () => {
    const r = { ...baseRaw, aid_types: ["Prêt à taux zéro"] };
    expect(transformToGrant(r).grantType).toBe("pret");
  });

  it("flags coFinancingRequired when subvention_rate_upper_bound < 100", () => {
    const r = { ...baseRaw, subvention_rate_upper_bound: 80 };
    expect(transformToGrant(r).coFinancingRequired).toBe(true);
  });

  it("does NOT flag coFinancing when bound is null or 100", () => {
    expect(transformToGrant(baseRaw).coFinancingRequired).toBe(false);
    const r = { ...baseRaw, subvention_rate_upper_bound: 100 };
    expect(transformToGrant(r).coFinancingRequired).toBe(false);
  });

  it("handles object-shaped financers via *_full", () => {
    const r = {
      ...baseRaw,
      financers: [],
      financers_full: [{ id: 1, name: "Fondation X" }],
    };
    expect(transformToGrant(r).funder).toBe("Fondation X");
  });
});
