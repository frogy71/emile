import { describe, it, expect } from "vitest";
import { transformEUToGrant, type EUTopic } from "./eu-funding";

const baseTopic: EUTopic = {
  identifier: "HORIZON-2026-CL5-01",
  title: "Climate research and innovation",
  summary: "Programme to fund climate-related research projects.",
  url: "https://ec.europa.eu/...",
  callTitle: "Horizon Climate 2026",
  status: "open",
  frameworkProgramme: "Horizon Europe",
  programmePeriod: "2021-2027",
  deadline: "2026-12-31",
  startDate: "2026-01-01",
  typesOfAction: ["RIA"],
  destinationDetails: ["Climate, energy and mobility"],
  keywords: ["climate", "renewable", "carbon"],
  focusArea: ["Green Deal"],
  description: "<p>Long description of the topic.</p>",
  budgetEur: 7_000_000,
};

describe("transformEUToGrant", () => {
  it("emits country=EU", () => {
    const g = transformEUToGrant(baseTopic);
    expect(g.country).toBe("EU");
  });

  it("uses frameworkProgramme as funder when set", () => {
    const g = transformEUToGrant(baseTopic);
    expect(g.funder).toBe("Horizon Europe");
  });

  it("falls back to 'Commission européenne' funder when no framework", () => {
    const g = transformEUToGrant({ ...baseTopic, frameworkProgramme: null });
    expect(g.funder).toBe("Commission européenne");
  });

  it("sets coFinancingRequired=true (EU programmes typically require it)", () => {
    expect(transformEUToGrant(baseTopic).coFinancingRequired).toBe(true);
  });

  it("converts deadline string to Date", () => {
    const g = transformEUToGrant(baseTopic);
    expect(g.deadline).toBeInstanceOf(Date);
    expect(g.deadline?.toISOString().startsWith("2026-12-31")).toBe(true);
  });

  it("returns null deadline when not set", () => {
    const g = transformEUToGrant({ ...baseTopic, deadline: null });
    expect(g.deadline).toBeNull();
  });

  it("uses budgetEur as maxAmountEur", () => {
    expect(transformEUToGrant(baseTopic).maxAmountEur).toBe(7_000_000);
  });

  it("detects climate/environment theme from keywords", () => {
    const g = transformEUToGrant(baseTopic);
    expect(g.thematicAreas).toContain("Environnement");
  });

  it("detects humanitarian theme from identifier patterns", () => {
    const t: EUTopic = {
      ...baseTopic,
      identifier: "INTPA-HUMA-2026-01",
      frameworkProgramme: "NDICI",
      callTitle: "Humanitarian aid",
    };
    const g = transformEUToGrant(t);
    expect(g.sourceName).toBe("EuropeAid / INTPA");
  });

  it("uses 'EU Funding & Tenders' source for non-humanitarian", () => {
    expect(transformEUToGrant(baseTopic).sourceName).toBe("EU Funding & Tenders");
  });

  it("always tags grantType=appel_a_projets", () => {
    expect(transformEUToGrant(baseTopic).grantType).toBe("appel_a_projets");
  });

  it("falls back to 'Europe' theme when nothing else matches", () => {
    const t: EUTopic = {
      ...baseTopic,
      title: "Generic call",
      callTitle: null,
      frameworkProgramme: null,
      keywords: [],
      focusArea: [],
      destinationDetails: [],
      summary: null,
    };
    expect(transformEUToGrant(t).thematicAreas).toEqual(["Europe"]);
  });

  it("includes both EU and FR in eligibleCountries (FR-friendly default)", () => {
    const g = transformEUToGrant(baseTopic);
    expect(g.eligibleCountries).toContain("EU");
    expect(g.eligibleCountries).toContain("FR");
  });

  it("includes association in eligibleEntities", () => {
    expect(transformEUToGrant(baseTopic).eligibleEntities).toContain("association");
  });
});
