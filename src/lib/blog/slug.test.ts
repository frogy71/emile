import { describe, it, expect } from "vitest";
import { slugify, ensureUniqueSlug, countWords } from "./slug";

describe("slugify", () => {
  it("ASCII-folds, lowercases, hyphenates", () => {
    expect(slugify("Subvention « Économie sociale » 2026")).toBe(
      "subvention-economie-sociale-2026"
    );
  });

  it("trims to 80 chars without trailing hyphens", () => {
    const long = "a".repeat(120);
    const out = slugify(long);
    expect(out.length).toBeLessThanOrEqual(80);
    expect(out.endsWith("-")).toBe(false);
  });

  it("collapses repeated separators", () => {
    expect(slugify("Hello — World!! Foo, bar")).toBe("hello-world-foo-bar");
  });

  it("strips quotes that are common in grant titles", () => {
    expect(slugify("L'« appel à projets » 2026")).toBe("l-appel-a-projets-2026");
  });
});

describe("ensureUniqueSlug", () => {
  it("returns the base when no collision", () => {
    expect(ensureUniqueSlug("foo", new Set())).toBe("foo");
  });

  it("appends -2 on first collision", () => {
    expect(ensureUniqueSlug("foo", new Set(["foo"]))).toBe("foo-2");
  });

  it("walks until a free slot is found", () => {
    expect(
      ensureUniqueSlug("foo", new Set(["foo", "foo-2", "foo-3"]))
    ).toBe("foo-4");
  });
});

describe("countWords", () => {
  it("strips HTML tags", () => {
    expect(countWords("<p>hello <strong>world</strong></p>")).toBe(2);
  });

  it("treats entities as separators", () => {
    expect(countWords("hello&nbsp;world")).toBe(2);
  });
});
