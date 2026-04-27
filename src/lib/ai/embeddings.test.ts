import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  buildGrantEmbeddingText,
  buildProjectEmbeddingText,
  isEmbeddingsAvailable,
  embeddingProviderName,
  generateEmbedding,
  toPgVector,
  EMBEDDING_DIMENSIONS,
} from "./embeddings";

describe("buildGrantEmbeddingText", () => {
  it("produces a multi-line representation including title", () => {
    const text = buildGrantEmbeddingText({
      title: "Aide humanitaire",
      summary: "Soutien aux ONG",
      funder: "Fondation X",
      thematic_areas: ["humanitaire", "migration"],
      grant_type: "subvention",
    });
    expect(text).toContain("Titre: Aide humanitaire");
    expect(text).toContain("Bailleur: Fondation X");
    expect(text).toContain("Thématiques: humanitaire, migration");
    expect(text).toContain("Type: subvention");
    expect(text).toContain("Description: Soutien aux ONG");
  });

  it("doubles the title and themes for weight boosting", () => {
    const text = buildGrantEmbeddingText({
      title: "Aide humanitaire",
      thematic_areas: ["humanitaire"],
    });
    // "Aide humanitaire" appears twice (once labeled, once raw).
    const titleMatches = text.match(/Aide humanitaire/g);
    expect(titleMatches?.length).toBeGreaterThanOrEqual(2);
  });

  it("returns a non-empty string even when only the title is set", () => {
    const text = buildGrantEmbeddingText({ title: "Some grant" });
    expect(text).toContain("Titre: Some grant");
    expect(text.length).toBeGreaterThan(0);
  });

  it("handles camelCase aliases (thematicAreas)", () => {
    const text = buildGrantEmbeddingText({
      title: "x",
      thematicAreas: ["env"],
    });
    expect(text).toContain("Thématiques: env");
  });

  it("returns the bare 'Titre:' label when nothing is set (always-included field)", () => {
    // The builder always includes the title slot; empty input produces a tiny
    // string rather than throwing.
    expect(buildGrantEmbeddingText({})).toBe("Titre:");
  });

  it("trims overly long input below 3000 chars", () => {
    const longSummary = "x".repeat(10_000);
    const text = buildGrantEmbeddingText({
      title: "x",
      summary: longSummary,
    });
    expect(text.length).toBeLessThanOrEqual(3000);
  });
});

describe("buildProjectEmbeddingText", () => {
  it("includes project + org context", () => {
    const text = buildProjectEmbeddingText(
      {
        name: "Projet X",
        summary: "Action humanitaire",
        objectives: ["Aider 100 familles"],
        themes: ["humanitaire"],
      },
      {
        name: "ONG Y",
        mission: "Mission humanitaire",
      }
    );
    expect(text).toContain("Projet: Projet X");
    expect(text).toContain("Organisation: ONG Y");
    expect(text).toContain("Mission: Mission humanitaire");
    expect(text).toContain("Résumé: Action humanitaire");
    expect(text).toContain("Objectifs spécifiques: Aider 100 familles");
  });

  it("merges project + org themes", () => {
    const text = buildProjectEmbeddingText(
      { name: "P", themes: ["humanitaire"] },
      { name: "O", thematic_areas: ["migration"] }
    );
    expect(text).toContain("humanitaire");
    expect(text).toContain("migration");
  });

  it("works without an org argument", () => {
    const text = buildProjectEmbeddingText({
      name: "Projet seul",
      summary: "Pas d'org",
    });
    expect(text).toContain("Projet: Projet seul");
    expect(text).not.toContain("Organisation:");
  });

  it("flattens activities (objects with title+description)", () => {
    const text = buildProjectEmbeddingText({
      name: "P",
      activities: [
        { title: "Atelier", description: "Formation hebdomadaire" },
        { title: "Distribution", description: "Repas chauds" },
      ],
    });
    expect(text).toMatch(/Atelier.*Formation/);
    expect(text).toMatch(/Distribution.*Repas/);
  });

  it("flattens activities (string entries)", () => {
    const text = buildProjectEmbeddingText({
      name: "P",
      activities: ["Atelier hebdomadaire", "Distribution"],
    });
    expect(text).toContain("Atelier hebdomadaire");
    expect(text).toContain("Distribution");
  });
});

describe("toPgVector", () => {
  it("formats a number array as the pgvector literal", () => {
    expect(toPgVector([0.1, 0.2, 0.3])).toBe("[0.1,0.2,0.3]");
  });

  it("preserves negative values", () => {
    expect(toPgVector([-1, 0, 1])).toBe("[-1,0,1]");
  });

  it("handles an empty array", () => {
    expect(toPgVector([])).toBe("[]");
  });
});

describe("provider detection (no key)", () => {
  const savedVoyage = process.env.VOYAGE_API_KEY;
  const savedOpenAI = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    delete process.env.VOYAGE_API_KEY;
    delete process.env.OPENAI_API_KEY;
  });

  afterEach(() => {
    if (savedVoyage !== undefined) process.env.VOYAGE_API_KEY = savedVoyage;
    if (savedOpenAI !== undefined) process.env.OPENAI_API_KEY = savedOpenAI;
  });

  it("returns false from isEmbeddingsAvailable when no key is set", () => {
    expect(isEmbeddingsAvailable()).toBe(false);
  });

  it("returns 'none' as provider name", () => {
    expect(embeddingProviderName()).toBe("none");
  });

  it("generateEmbedding returns null without a key (no network call)", async () => {
    const v = await generateEmbedding("test text");
    expect(v).toBeNull();
  });
});

describe("EMBEDDING_DIMENSIONS", () => {
  it("exports 1536", () => {
    expect(EMBEDDING_DIMENSIONS).toBe(1536);
  });
});
