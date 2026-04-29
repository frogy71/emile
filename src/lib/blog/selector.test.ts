import { describe, it, expect } from "vitest";
import { scoreBlogCandidate } from "./selector";
import type { BlogGrantInput } from "./types";

function grant(overrides: Partial<BlogGrantInput>): BlogGrantInput {
  return {
    id: "grant-x",
    title: "Test grant",
    summary: null,
    funder: null,
    country: "FR",
    thematic_areas: null,
    eligible_entities: null,
    eligible_countries: null,
    min_amount_eur: null,
    max_amount_eur: null,
    co_financing_required: null,
    deadline: null,
    grant_type: null,
    language: "fr",
    eligibility_conditions: null,
    ai_summary: null,
    ...overrides,
  };
}

const NOW = new Date("2026-04-29T00:00:00Z");

function inDays(n: number): string {
  const d = new Date(NOW);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString();
}

describe("scoreBlogCandidate", () => {
  it("favours grants with deadline in the 30-90 day priority window", () => {
    const sweet = grant({ id: "a", deadline: inDays(45) });
    const tooEarly = grant({ id: "b", deadline: inDays(7) });
    const tooLate = grant({ id: "c", deadline: inDays(200) });

    expect(scoreBlogCandidate(sweet, [], [], NOW)).toBeGreaterThan(
      scoreBlogCandidate(tooEarly, [], [], NOW)
    );
    expect(scoreBlogCandidate(sweet, [], [], NOW)).toBeGreaterThan(
      scoreBlogCandidate(tooLate, [], [], NOW)
    );
  });

  it("rewards known funders", () => {
    const known = grant({
      id: "a",
      deadline: inDays(45),
      funder: "ADEME",
    });
    const unknown = grant({
      id: "b",
      deadline: inDays(45),
      funder: "Some random local committee",
    });
    expect(scoreBlogCandidate(known, [], [], NOW)).toBeGreaterThan(
      scoreBlogCandidate(unknown, [], [], NOW)
    );
  });

  it("penalises grants whose theme was published in the last week", () => {
    const fresh = grant({
      id: "a",
      deadline: inDays(45),
      thematic_areas: ["transition écologique"],
    });
    const repeat = grant({
      id: "b",
      deadline: inDays(45),
      thematic_areas: ["transition écologique"],
    });
    const recent = ["transition écologique"];
    expect(scoreBlogCandidate(fresh, [], [], NOW)).toBeGreaterThan(
      scoreBlogCandidate(repeat, recent, [], NOW)
    );
  });

  it("penalises grants used in carousel within the lookback window", () => {
    const reused = grant({ id: "x", deadline: inDays(45) });
    const fresh = grant({ id: "y", deadline: inDays(45) });
    expect(scoreBlogCandidate(fresh, [], [], NOW)).toBeGreaterThan(
      scoreBlogCandidate(reused, [], ["x"], NOW)
    );
  });

  it("rewards higher amounts via log-scaling", () => {
    const big = grant({
      id: "a",
      deadline: inDays(45),
      max_amount_eur: 1_000_000,
    });
    const small = grant({
      id: "b",
      deadline: inDays(45),
      max_amount_eur: 5_000,
    });
    expect(scoreBlogCandidate(big, [], [], NOW)).toBeGreaterThan(
      scoreBlogCandidate(small, [], [], NOW)
    );
  });

  it("rewards content depth", () => {
    const rich = grant({
      id: "a",
      deadline: inDays(45),
      summary: "x".repeat(250),
      eligibility_conditions: "y".repeat(150),
      thematic_areas: ["santé"],
    });
    const sparse = grant({
      id: "b",
      deadline: inDays(45),
    });
    expect(scoreBlogCandidate(rich, [], [], NOW)).toBeGreaterThan(
      scoreBlogCandidate(sparse, [], [], NOW)
    );
  });
});
