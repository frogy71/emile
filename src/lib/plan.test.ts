import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Supabase mock harness ───────────────────────────────────────
//
// The plan module reads from three tables:
//   - organizations (.select.eq.single)
//   - match_runs    (.select.eq.eq.maybeSingle)
//   - proposals     (.select.eq.gte) with { count: "exact", head: true }
//
// We dispatch on table name and the chain returns whatever the test scenario
// configured for that table.

interface TableScenario {
  organizations?: { plan: string | null; plan_status: string | null } | null;
  matchRow?: { count: number } | null;
  proposalsCount?: number;
}

let scenario: TableScenario = {};

function makeQueryFor(table: string) {
  // Single chainable that dispatches based on the terminal method.
  const proxy: Record<string, (...args: unknown[]) => unknown> = {};
  proxy.select = () => proxy;
  proxy.eq = () => proxy;
  proxy.gte = async () => ({
    data: null,
    error: null,
    count: scenario.proposalsCount ?? 0,
  });
  proxy.single = async () => ({
    data: scenario.organizations ?? null,
    error: null,
  });
  proxy.maybeSingle = async () => {
    if (table === "match_runs") {
      return { data: scenario.matchRow ?? null, error: null };
    }
    return { data: null, error: null };
  };
  return proxy;
}

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: (table: string) => makeQueryFor(table),
  }),
}));

// Set required env so admin() doesn't blow up (the mocked createClient ignores them).
process.env.NEXT_PUBLIC_SUPABASE_URL = "http://test.local";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";

import { getPlan, resolveTier, PLAN_LIMITS } from "./plan";

describe("resolveTier", () => {
  it("returns 'free' when plan_status is not active", () => {
    expect(resolveTier("pro", "cancelled")).toBe("free");
    expect(resolveTier("expert", "inactive")).toBe("free");
    expect(resolveTier("pro", null)).toBe("free");
  });

  it("returns 'pro' for plan='pro' when active", () => {
    expect(resolveTier("pro", "active")).toBe("pro");
  });

  it("returns 'expert' for plan='expert' when active", () => {
    expect(resolveTier("expert", "active")).toBe("expert");
  });

  it("returns 'free' for unknown plan", () => {
    expect(resolveTier("custom", "active")).toBe("free");
    expect(resolveTier(null, "active")).toBe("free");
  });

  it("is case-insensitive", () => {
    expect(resolveTier("PRO", "ACTIVE")).toBe("pro");
    expect(resolveTier("Expert", "Active")).toBe("expert");
  });
});

describe("PLAN_LIMITS", () => {
  it("free tier: 3 matches/mo, 0 proposals, no feedback learning", () => {
    expect(PLAN_LIMITS.free.matchesPerMonth).toBe(3);
    expect(PLAN_LIMITS.free.proposalsPerMonth).toBe(0);
    expect(PLAN_LIMITS.free.feedbackLearning).toBe(false);
  });

  it("pro tier: unlimited matches, 5 proposals, feedback enabled", () => {
    expect(PLAN_LIMITS.pro.matchesPerMonth).toBeNull();
    expect(PLAN_LIMITS.pro.proposalsPerMonth).toBe(5);
    expect(PLAN_LIMITS.pro.feedbackLearning).toBe(true);
  });

  it("expert tier: everything unlimited", () => {
    expect(PLAN_LIMITS.expert.matchesPerMonth).toBeNull();
    expect(PLAN_LIMITS.expert.proposalsPerMonth).toBeNull();
    expect(PLAN_LIMITS.expert.prioritySupport).toBe(true);
    expect(PLAN_LIMITS.expert.analytics).toBe(true);
  });
});

describe("getPlan (free tier)", () => {
  beforeEach(() => {
    scenario = {
      organizations: { plan: null, plan_status: "free" },
      matchRow: null,
      proposalsCount: 0,
    };
  });

  it("returns tier=free with 3 matches remaining", async () => {
    const p = await getPlan("org-1");
    expect(p.tier).toBe("free");
    expect(p.matchesUsed).toBe(0);
    expect(p.matchesRemaining).toBe(3);
    expect(p.canMatch).toBe(true);
  });

  it("zero proposals allowed on free", async () => {
    const p = await getPlan("org-1");
    expect(p.proposalsRemaining).toBe(0);
    expect(p.canGenerateProposal).toBe(false);
  });

  it("no feedback learning on free", async () => {
    const p = await getPlan("org-1");
    expect(p.canUseFeedback).toBe(false);
  });

  it("blocks matching after 3 used", async () => {
    scenario.matchRow = { count: 3 };
    const p = await getPlan("org-1");
    expect(p.matchesUsed).toBe(3);
    expect(p.matchesRemaining).toBe(0);
    expect(p.canMatch).toBe(false);
  });

  it("clamps matchesRemaining at 0 even when over limit", async () => {
    scenario.matchRow = { count: 10 };
    const p = await getPlan("org-1");
    expect(p.matchesRemaining).toBe(0);
  });
});

describe("getPlan (pro tier)", () => {
  beforeEach(() => {
    scenario = {
      organizations: { plan: "pro", plan_status: "active" },
      matchRow: { count: 50 },
      proposalsCount: 0,
    };
  });

  it("returns tier=pro with unlimited matches", async () => {
    const p = await getPlan("org-1");
    expect(p.tier).toBe("pro");
    expect(p.matchesRemaining).toBeNull();
    expect(p.canMatch).toBe(true);
  });

  it("allows 5 proposals per month", async () => {
    const p = await getPlan("org-1");
    expect(p.proposalsRemaining).toBe(5);
    expect(p.canGenerateProposal).toBe(true);
  });

  it("blocks proposals after 5 used", async () => {
    scenario.proposalsCount = 5;
    const p = await getPlan("org-1");
    expect(p.proposalsRemaining).toBe(0);
    expect(p.canGenerateProposal).toBe(false);
  });

  it("enables feedback learning on pro", async () => {
    const p = await getPlan("org-1");
    expect(p.canUseFeedback).toBe(true);
  });

  it("falls back to free if plan_status not active", async () => {
    scenario.organizations = { plan: "pro", plan_status: "cancelled" };
    const p = await getPlan("org-1");
    expect(p.tier).toBe("free");
  });
});

describe("getPlan (expert tier)", () => {
  beforeEach(() => {
    scenario = {
      organizations: { plan: "expert", plan_status: "active" },
      matchRow: { count: 999 },
      proposalsCount: 999,
    };
  });

  it("returns tier=expert with unlimited matches and proposals", async () => {
    const p = await getPlan("org-1");
    expect(p.tier).toBe("expert");
    expect(p.matchesRemaining).toBeNull();
    expect(p.proposalsRemaining).toBeNull();
    expect(p.canMatch).toBe(true);
    expect(p.canGenerateProposal).toBe(true);
  });

  it("enables feedback learning on expert", async () => {
    const p = await getPlan("org-1");
    expect(p.canUseFeedback).toBe(true);
  });
});
