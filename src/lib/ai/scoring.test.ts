import { describe, it, expect } from "vitest";
import {
  computeHeuristicScore,
  type GrantProfile,
  type OrgProfile,
  type ProjectProfile,
} from "./scoring";

// Test fixtures
const baseOrg: OrgProfile = {
  name: "Action Solidaire FR",
  mission: "Aide humanitaire et urgence pour réfugiés et populations en crise",
  legalStatus: "association",
  thematicAreas: ["humanitaire", "migration"],
  beneficiaries: ["réfugiés", "migrants"],
  geographicFocus: ["France"],
  annualBudgetEur: 250_000,
  teamSize: 5,
  languages: ["fr"],
};

const baseProject: ProjectProfile = {
  name: "Accueil d'urgence",
  summary: "Hébergement et accompagnement social pour familles migrantes",
  objectives: ["Loger 200 familles", "Accompagnement social"],
  targetBeneficiaries: ["familles migrantes"],
  targetGeography: ["France"],
  requestedAmountEur: 50_000,
  durationMonths: 12,
};

// Compute a future deadline (90 days from now)
const futureDate = (days: number): string =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

describe("computeHeuristicScore", () => {
  describe("hard gates", () => {
    it("zeroes the score when the deadline has passed", () => {
      const grant: GrantProfile = {
        title: "Subvention urgence",
        thematicAreas: ["humanitaire"],
        eligibleEntities: ["association"],
        eligibleCountries: ["FR"],
        deadline: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      };
      const r = computeHeuristicScore(baseOrg, grant, baseProject);
      expect(r.score).toBe(0);
      expect(r.recommendation).toBe("skip");
      expect(r.gatedBy).toBe("deadline_passed");
    });

    it("zeroes the score when the entity type is mismatched", () => {
      const grant: GrantProfile = {
        title: "Aide aux entreprises",
        thematicAreas: ["humanitaire"],
        eligibleEntities: ["entreprise"],
        eligibleCountries: ["FR"],
        deadline: futureDate(90),
      };
      const r = computeHeuristicScore(baseOrg, grant, baseProject);
      expect(r.score).toBe(0);
      expect(r.gatedBy).toBe("entity_mismatch");
    });

    it("zeroes the score when geography does not overlap", () => {
      const grant: GrantProfile = {
        title: "Aide pour l'Asie",
        thematicAreas: ["humanitaire"],
        eligibleEntities: ["association"],
        eligibleCountries: ["Japon"],
        deadline: futureDate(90),
      };
      const orgAsia: OrgProfile = {
        ...baseOrg,
        geographicFocus: ["France"],
      };
      const r = computeHeuristicScore(orgAsia, grant, {
        ...baseProject,
        targetGeography: ["France"],
      });
      expect(r.score).toBe(0);
      expect(r.gatedBy).toBe("geo_mismatch");
    });

    it("does NOT gate when grant geography is unspecified", () => {
      const grant: GrantProfile = {
        title: "Aide nationale",
        thematicAreas: ["humanitaire"],
        eligibleEntities: ["association"],
        deadline: futureDate(90),
      };
      const r = computeHeuristicScore(baseOrg, grant, baseProject);
      expect(r.score).toBeGreaterThan(0);
      expect(r.gatedBy).toBeUndefined();
    });

    it("does NOT gate when grant covers world/international", () => {
      const grant: GrantProfile = {
        title: "International humanitarian aid",
        thematicAreas: ["humanitaire"],
        eligibleEntities: ["association"],
        eligibleCountries: ["world"],
        deadline: futureDate(90),
      };
      const r = computeHeuristicScore(baseOrg, grant, baseProject);
      expect(r.score).toBeGreaterThan(0);
    });
  });

  describe("geographic matching", () => {
    it("scores exact match at least as high as unknown geography", () => {
      const baseGrant: GrantProfile = {
        title: "Aide associations",
        thematicAreas: ["humanitaire"],
        eligibleEntities: ["association"],
        deadline: futureDate(90),
      };
      const exactGrant = { ...baseGrant, eligibleCountries: ["France"] };
      const unknownGrant = { ...baseGrant }; // no eligibleCountries

      const exact = computeHeuristicScore(baseOrg, exactGrant, baseProject);
      const unknown = computeHeuristicScore(baseOrg, unknownGrant, baseProject);

      expect(exact.score).toBeGreaterThan(unknown.score);
    });

    it("treats Europe as a parent of France (partial overlap)", () => {
      const grant: GrantProfile = {
        title: "Programme européen",
        thematicAreas: ["humanitaire"],
        eligibleEntities: ["association"],
        eligibleCountries: ["Europe"],
        deadline: futureDate(90),
      };
      const r = computeHeuristicScore(baseOrg, grant, baseProject);
      expect(r.gatedBy).toBeUndefined();
      expect(r.score).toBeGreaterThan(0);
    });
  });

  describe("thematic overlap", () => {
    it("rewards strong thematic alignment with high score", () => {
      const grant: GrantProfile = {
        title: "Aide humanitaire d'urgence pour migrants",
        summary:
          "Soutien aux associations qui accompagnent les réfugiés et migrants",
        thematicAreas: ["humanitaire", "migration"],
        eligibleEntities: ["association"],
        eligibleCountries: ["France"],
        deadline: futureDate(90),
      };
      const r = computeHeuristicScore(baseOrg, grant, baseProject);
      expect(r.score).toBeGreaterThanOrEqual(70);
      expect(r.recommendation).toBe("pursue");
    });

    it("scores poorly when thematic areas don't overlap", () => {
      const sportOrg: OrgProfile = {
        ...baseOrg,
        mission: "Promotion du sport amateur",
        thematicAreas: ["sport"],
      };
      const grant: GrantProfile = {
        title: "Recherche scientifique en agriculture",
        summary: "Innovation pour l'agriculture rurale",
        thematicAreas: ["agriculture"],
        eligibleEntities: ["association"],
        eligibleCountries: ["France"],
        deadline: futureDate(90),
      };
      const r = computeHeuristicScore(
        sportOrg,
        grant,
        {
          ...baseProject,
          summary: "Tournois locaux",
          objectives: [],
        }
      );
      // Themes don't overlap → score should be substantially lower than a
      // strong-overlap grant. Asserting upper bound rather than exact value.
      expect(r.score).toBeLessThan(70);
    });

    it("ranks aligned humanitarian project HIGHER than unrelated education grant", () => {
      const humanitarianGrant: GrantProfile = {
        title: "Aide humanitaire pour réfugiés",
        summary: "Programme d'urgence pour migrants et réfugiés",
        thematicAreas: ["humanitaire", "migration"],
        eligibleEntities: ["association"],
        eligibleCountries: ["France"],
        deadline: futureDate(90),
      };
      const educationGrant: GrantProfile = {
        title: "Innovation pédagogique en école primaire",
        summary: "Nouveaux outils d'apprentissage scolaire",
        thematicAreas: ["education"],
        eligibleEntities: ["association"],
        eligibleCountries: ["France"],
        deadline: futureDate(90),
      };

      const humanitarianScore = computeHeuristicScore(
        baseOrg,
        humanitarianGrant,
        baseProject
      ).score;
      const educationScore = computeHeuristicScore(
        baseOrg,
        educationGrant,
        baseProject
      ).score;

      expect(humanitarianScore).toBeGreaterThan(educationScore);
    });
  });

  describe("entity eligibility", () => {
    it("matches an association org with association-eligible grant", () => {
      const grant: GrantProfile = {
        title: "Aide aux associations",
        eligibleEntities: ["association"],
        eligibleCountries: ["France"],
        deadline: futureDate(90),
      };
      const r = computeHeuristicScore(baseOrg, grant, baseProject);
      expect(r.gatedBy).toBeUndefined();
      expect(r.strengths.some((s) => /Associat/i.test(s))).toBe(true);
    });

    it("treats 'tous publics' as a generic match", () => {
      const grant: GrantProfile = {
        title: "Aide ouverte à tous",
        eligibleEntities: ["tous publics"],
        eligibleCountries: ["France"],
        deadline: futureDate(90),
      };
      const r = computeHeuristicScore(baseOrg, grant, baseProject);
      expect(r.gatedBy).toBeUndefined();
      expect(r.score).toBeGreaterThan(0);
    });

    it("gates a fondation org when only entreprise is eligible", () => {
      const fondationOrg: OrgProfile = {
        ...baseOrg,
        legalStatus: "fondation",
      };
      const grant: GrantProfile = {
        title: "Aide aux entreprises",
        eligibleEntities: ["entreprise"],
        eligibleCountries: ["France"],
        deadline: futureDate(90),
      };
      const r = computeHeuristicScore(fondationOrg, grant, baseProject);
      expect(r.gatedBy).toBe("entity_mismatch");
    });
  });

  describe("budget range scoring", () => {
    it("applies a fit bonus when requested amount is within range", () => {
      const grant: GrantProfile = {
        title: "Subvention",
        thematicAreas: ["humanitaire"],
        eligibleEntities: ["association"],
        eligibleCountries: ["France"],
        minAmountEur: 10_000,
        maxAmountEur: 100_000,
        deadline: futureDate(90),
      };
      const r = computeHeuristicScore(baseOrg, grant, baseProject); // requesting 50k
      expect(r.gatedBy).toBeUndefined();
      expect(r.strengths.some((s) => /Budget adapté/.test(s))).toBe(true);
    });

    it("flags when grant max is below requested amount", () => {
      const grant: GrantProfile = {
        title: "Petite subvention",
        thematicAreas: ["humanitaire"],
        eligibleEntities: ["association"],
        eligibleCountries: ["France"],
        maxAmountEur: 5_000, // way below 50k requested
        deadline: futureDate(90),
      };
      const r = computeHeuristicScore(baseOrg, grant, baseProject);
      expect(r.weaknesses.some((w) => /Plafond/.test(w))).toBe(true);
    });

    it("scores fit > grant_too_small in the budget axis", () => {
      const fitGrant: GrantProfile = {
        title: "Match",
        thematicAreas: ["humanitaire"],
        eligibleEntities: ["association"],
        eligibleCountries: ["France"],
        minAmountEur: 10_000,
        maxAmountEur: 100_000,
        deadline: futureDate(90),
      };
      const tooSmall: GrantProfile = {
        ...fitGrant,
        title: "Too small",
        maxAmountEur: 5_000,
      };

      const fit = computeHeuristicScore(baseOrg, fitGrant, baseProject);
      const small = computeHeuristicScore(baseOrg, tooSmall, baseProject);
      expect(fit.score).toBeGreaterThan(small.score);
    });
  });

  describe("relative ordering", () => {
    it("excellent match scores higher than partial", () => {
      const excellentGrant: GrantProfile = {
        title: "Aide humanitaire urgence migrants associations France",
        summary: "Soutien d'urgence pour réfugiés et migrants en France",
        funder: "Fondation Solidarité",
        thematicAreas: ["humanitaire", "migration", "social"],
        eligibleEntities: ["association"],
        eligibleCountries: ["France"],
        minAmountEur: 10_000,
        maxAmountEur: 100_000,
        deadline: futureDate(90),
        grantType: "fondation",
      };
      const partialGrant: GrantProfile = {
        title: "Aide associations",
        summary: "Soutien général",
        thematicAreas: ["culture"], // mismatched theme
        eligibleEntities: ["association"],
        eligibleCountries: ["France"],
        deadline: futureDate(90),
      };

      const excellent = computeHeuristicScore(baseOrg, excellentGrant, baseProject);
      const partial = computeHeuristicScore(baseOrg, partialGrant, baseProject);

      expect(excellent.score).toBeGreaterThan(partial.score + 10);
    });
  });

  describe("deadline runway", () => {
    it("flags an urgent deadline as a risk", () => {
      const grant: GrantProfile = {
        title: "Urgent",
        thematicAreas: ["humanitaire"],
        eligibleEntities: ["association"],
        eligibleCountries: ["France"],
        deadline: futureDate(5),
      };
      const r = computeHeuristicScore(baseOrg, grant, baseProject);
      expect(r.risks.some((r) => /urgente|Deadline/.test(r))).toBe(true);
    });
  });

  describe("recommendation thresholds", () => {
    it("returns 'pursue' for scores >= 70", () => {
      const grant: GrantProfile = {
        title: "Aide humanitaire urgence migrants",
        summary: "Soutien aux associations humanitaires",
        thematicAreas: ["humanitaire", "migration"],
        eligibleEntities: ["association"],
        eligibleCountries: ["France"],
        minAmountEur: 10_000,
        maxAmountEur: 100_000,
        deadline: futureDate(90),
      };
      const r = computeHeuristicScore(baseOrg, grant, baseProject);
      expect(r.score).toBeGreaterThanOrEqual(70);
      expect(r.recommendation).toBe("pursue");
    });
  });

  describe("output shape", () => {
    it("always returns a difficulty + recommendation + summary", () => {
      const grant: GrantProfile = {
        title: "Aide générique",
        eligibleCountries: ["France"],
        deadline: futureDate(60),
      };
      const r = computeHeuristicScore(baseOrg, grant, baseProject);
      expect(r.difficulty).toMatch(/^(easy|medium|hard|very_hard)$/);
      expect(r.recommendation).toMatch(/^(pursue|maybe|skip)$/);
      expect(typeof r.summary).toBe("string");
      expect(r.summary.length).toBeGreaterThan(0);
    });

    it("clamps score to 0..100", () => {
      const grant: GrantProfile = {
        title: "Aide humanitaire urgence migrants associations France",
        summary: "Soutien d'urgence pour réfugiés et migrants en France",
        thematicAreas: ["humanitaire", "migration", "social", "education", "sante"],
        eligibleEntities: ["association"],
        eligibleCountries: ["France"],
        minAmountEur: 10_000,
        maxAmountEur: 100_000,
        deadline: futureDate(90),
      };
      const r = computeHeuristicScore(baseOrg, grant, baseProject);
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(100);
    });
  });
});
