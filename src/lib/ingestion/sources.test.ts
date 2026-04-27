import { describe, it, expect } from "vitest";
import {
  SOURCES,
  getEnabledSources,
  getSourcesByFrequency,
} from "./sources";

describe("source registry", () => {
  it("has no duplicate ids", () => {
    const ids = SOURCES.map((s) => s.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("has no duplicate names", () => {
    const names = SOURCES.map((s) => s.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });

  it("every source has required fields", () => {
    for (const s of SOURCES) {
      expect(s.id).toBeTruthy();
      expect(s.name).toBeTruthy();
      expect(s.method).toMatch(/^(api|api_download|scraping|curated)$/);
      expect(s.reliability).toMatch(/^(high|medium|low)$/);
      expect(s.frequency).toMatch(/^(daily|weekly|monthly|quarterly)$/);
      expect(typeof s.enabled).toBe("boolean");
      expect(typeof s.estimatedGrants).toBe("number");
      expect(s.estimatedGrants).toBeGreaterThan(0);
    }
  });
});

describe("getEnabledSources", () => {
  it("only returns enabled sources", () => {
    const enabled = getEnabledSources();
    expect(enabled.every((s) => s.enabled)).toBe(true);
  });
});

describe("getSourcesByFrequency", () => {
  it("daily includes only daily-cadence sources", () => {
    const daily = getSourcesByFrequency("daily");
    expect(daily.every((s) => s.frequency === "daily")).toBe(true);
  });

  it("weekly includes daily + weekly sources", () => {
    const weekly = getSourcesByFrequency("weekly");
    expect(weekly.every((s) => s.frequency === "daily" || s.frequency === "weekly")).toBe(true);
  });

  it("monthly includes daily + weekly + monthly sources", () => {
    const monthly = getSourcesByFrequency("monthly");
    expect(
      monthly.every(
        (s) =>
          s.frequency === "daily" ||
          s.frequency === "weekly" ||
          s.frequency === "monthly"
      )
    ).toBe(true);
  });
});
