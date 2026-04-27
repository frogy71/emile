import { describe, it, expect } from "vitest";
import {
  buildFeedbackSignals,
  computeFeedbackAdjustment,
  type FeedbackSignals,
} from "./feedback";

const emptySignals = (): FeedbackSignals => ({
  likedFunders: new Set(),
  dislikedFunders: new Set(),
  likedThemes: new Set(),
  dislikedThemes: new Set(),
  likedGrantTypes: new Set(),
});

describe("buildFeedbackSignals", () => {
  it("aggregates likes into the positive sets", () => {
    const signals = buildFeedbackSignals([
      {
        interaction_type: "like",
        grants: {
          funder: "Fondation X",
          thematic_areas: ["humanitaire"],
          grant_type: "subvention",
        },
      },
    ]);
    expect(signals.likedFunders.has("fondation x")).toBe(true);
    expect(signals.likedThemes.has("humanitaire")).toBe(true);
    expect(signals.likedGrantTypes.has("subvention")).toBe(true);
  });

  it("aggregates dismissals into the negative sets", () => {
    const signals = buildFeedbackSignals([
      {
        interaction_type: "dismiss",
        grants: { funder: "Bad funder", thematic_areas: ["culture"], grant_type: "appel" },
      },
    ]);
    expect(signals.dislikedFunders.has("bad funder")).toBe(true);
    expect(signals.dislikedThemes.has("culture")).toBe(true);
  });

  it("normalizes funder names (lowercase + accent strip)", () => {
    const signals = buildFeedbackSignals([
      {
        interaction_type: "save",
        grants: { funder: "Fondation Éducation", thematic_areas: [], grant_type: null },
      },
    ]);
    expect(signals.likedFunders.has("fondation education")).toBe(true);
  });

  it("ignores rows without a grant", () => {
    const signals = buildFeedbackSignals([
      { interaction_type: "like", grants: null },
    ]);
    expect(signals.likedFunders.size).toBe(0);
  });

  it("ignores unknown interaction types", () => {
    const signals = buildFeedbackSignals([
      {
        interaction_type: "view",
        grants: { funder: "X", thematic_areas: [], grant_type: null },
      },
    ]);
    expect(signals.likedFunders.size).toBe(0);
    expect(signals.dislikedFunders.size).toBe(0);
  });
});

describe("computeFeedbackAdjustment", () => {
  it("returns multiplier=1.0 when no signals match", () => {
    const adj = computeFeedbackAdjustment(emptySignals(), {
      funder: "Fondation Y",
      thematicAreas: ["culture"],
    });
    expect(adj.multiplier).toBe(1);
    expect(adj.positiveBoost).toBe(0);
    expect(adj.negativePenalty).toBe(0);
  });

  it("liked funders boost the score", () => {
    const signals = emptySignals();
    signals.likedFunders.add("fondation x");
    const adj = computeFeedbackAdjustment(signals, {
      funder: "Fondation X",
      thematicAreas: [],
    });
    expect(adj.multiplier).toBeGreaterThan(1);
    expect(adj.positiveBoost).toBeGreaterThan(0);
  });

  it("disliked themes penalize the score", () => {
    const signals = emptySignals();
    signals.dislikedThemes.add("culture");
    const adj = computeFeedbackAdjustment(signals, {
      funder: null,
      thematicAreas: ["culture"],
    });
    expect(adj.multiplier).toBeLessThan(1);
    expect(adj.negativePenalty).toBeGreaterThan(0);
  });

  it("popularity boost grows with popularityScore", () => {
    const lowPop = computeFeedbackAdjustment(emptySignals(), {
      popularityScore: 1,
    });
    const highPop = computeFeedbackAdjustment(emptySignals(), {
      popularityScore: 20,
    });
    expect(highPop.popularityBoost).toBeGreaterThan(lowPop.popularityBoost);
  });

  it("popularity boost saturates near +5%", () => {
    const huge = computeFeedbackAdjustment(emptySignals(), {
      popularityScore: 1000,
    });
    expect(huge.popularityBoost).toBeLessThanOrEqual(0.05);
    expect(huge.popularityBoost).toBeGreaterThan(0.04);
  });

  it("zero popularityScore yields zero popularity boost", () => {
    const adj = computeFeedbackAdjustment(emptySignals(), { popularityScore: 0 });
    expect(adj.popularityBoost).toBe(0);
  });

  it("negative popularityScore is treated as zero", () => {
    const adj = computeFeedbackAdjustment(emptySignals(), {
      popularityScore: -10,
    });
    expect(adj.popularityBoost).toBe(0);
  });

  it("caps positive boost at 15% even when many signals match", () => {
    const signals = emptySignals();
    signals.likedFunders.add("fondation x");
    signals.likedThemes.add("humanitaire");
    signals.likedThemes.add("migration");
    signals.likedGrantTypes.add("subvention");

    const adj = computeFeedbackAdjustment(signals, {
      funder: "Fondation X",
      thematicAreas: ["humanitaire", "migration"],
      grantType: "subvention",
    });
    expect(adj.positiveBoost).toBeLessThanOrEqual(0.15);
  });

  it("caps negative penalty at 10%", () => {
    const signals = emptySignals();
    signals.dislikedFunders.add("bad");
    signals.dislikedThemes.add("culture");

    const adj = computeFeedbackAdjustment(signals, {
      funder: "Bad",
      thematicAreas: ["culture"],
    });
    expect(adj.negativePenalty).toBeLessThanOrEqual(0.1);
  });

  it("multiplier stays within reasonable bounds", () => {
    const signals = emptySignals();
    signals.likedFunders.add("fondation x");
    signals.dislikedThemes.add("culture");

    const adj = computeFeedbackAdjustment(signals, {
      funder: "Fondation X",
      thematicAreas: ["culture"],
      popularityScore: 5,
    });
    // boost up to +15%, penalty up to -10%, popularity up to +5%
    // → multiplier in [0.9, 1.2] in the worst case
    expect(adj.multiplier).toBeGreaterThan(0.85);
    expect(adj.multiplier).toBeLessThan(1.25);
  });

  it("multiple liked themes don't compound (caps to single hit)", () => {
    const signals = emptySignals();
    signals.likedThemes.add("humanitaire");
    signals.likedThemes.add("migration");

    const oneTheme = computeFeedbackAdjustment(signals, {
      thematicAreas: ["humanitaire"],
    });
    const twoThemes = computeFeedbackAdjustment(signals, {
      thematicAreas: ["humanitaire", "migration"],
    });
    // Per the spec: themes contribute the strongest hit per side, not cumulative.
    expect(twoThemes.positiveBoost).toBe(oneTheme.positiveBoost);
  });
});
