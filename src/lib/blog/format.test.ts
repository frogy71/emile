import { describe, it, expect } from "vitest";
import {
  formatAmount,
  formatAmountRange,
  formatDeadline,
  pickThematicTag,
  buildGrantBriefForPrompt,
} from "./format";
import type { BlogGrantInput } from "./types";

function emptyGrant(overrides: Partial<BlogGrantInput> = {}): BlogGrantInput {
  return {
    id: "x",
    title: "Test",
    summary: null,
    funder: null,
    country: null,
    thematic_areas: null,
    eligible_entities: null,
    eligible_countries: null,
    min_amount_eur: null,
    max_amount_eur: null,
    co_financing_required: null,
    deadline: null,
    grant_type: null,
    language: null,
    eligibility_conditions: null,
    ai_summary: null,
    ...overrides,
  };
}

describe("formatAmount", () => {
  it("renders millions with comma decimal", () => {
    expect(formatAmount(1_500_000)).toBe("1,5 M€");
  });
  it("renders thousands as k€", () => {
    expect(formatAmount(50_000)).toBe("50 k€");
  });
  it("rounds millions to integer above 10M", () => {
    expect(formatAmount(15_400_000)).toBe("15 M€");
  });
});

describe("formatAmountRange", () => {
  it("returns variable when both null", () => {
    expect(formatAmountRange(null, null)).toMatch(/variable/i);
  });
  it("returns 'Jusqu'à' when only max", () => {
    expect(formatAmountRange(null, 100_000)).toBe("Jusqu'à 100 k€");
  });
  it("returns range when both present", () => {
    expect(formatAmountRange(10_000, 50_000)).toBe("Entre 10 k€ et 50 k€");
  });
  it("collapses when min equals max", () => {
    expect(formatAmountRange(50_000, 50_000)).toBe("50 k€");
  });
});

describe("formatDeadline", () => {
  it("returns variable when null", () => {
    expect(formatDeadline(null)).toMatch(/variable/i);
  });
  it("formats French long-form dates", () => {
    const out = formatDeadline("2026-09-15T00:00:00Z");
    expect(out).toMatch(/septembre/);
    expect(out).toMatch(/2026/);
  });
});

describe("pickThematicTag", () => {
  it("uses first thematic_area when present", () => {
    expect(
      pickThematicTag(emptyGrant({ thematic_areas: ["santé", "social"] }))
    ).toBe("santé");
  });
  it("falls back to grant_type then to default", () => {
    expect(pickThematicTag(emptyGrant({ grant_type: "subvention" }))).toBe(
      "subvention"
    );
    expect(pickThematicTag(emptyGrant())).toBe("subvention");
  });
});

describe("buildGrantBriefForPrompt", () => {
  it("includes only fields that are populated", () => {
    const brief = buildGrantBriefForPrompt(
      emptyGrant({
        title: "Subvention test",
        funder: "ADEME",
        max_amount_eur: 100_000,
      })
    );
    expect(brief).toContain("Subvention test");
    expect(brief).toContain("ADEME");
    expect(brief).toContain("100 k€");
    expect(brief).not.toContain("Cofinancement requis");
    expect(brief).not.toContain("Pays:");
  });

  it("includes coFinancing line when boolean is set", () => {
    const brief = buildGrantBriefForPrompt(
      emptyGrant({ co_financing_required: true })
    );
    expect(brief).toContain("Cofinancement requis: oui");
  });
});
