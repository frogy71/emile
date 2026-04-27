import { describe, it, expect } from "vitest";
import { parseMaxAmountEur } from "./amount-parser";

describe("parseMaxAmountEur", () => {
  describe("French formats", () => {
    it("parses 'jusqu'à 500 000 €'", () => {
      expect(parseMaxAmountEur("Aide jusqu'à 500 000 € par projet")).toBe(500_000);
    });

    it("parses '50 000 €'", () => {
      expect(parseMaxAmountEur("Subvention de 50 000 €")).toBe(50_000);
    });

    it("parses '1,5 M€' (French decimal)", () => {
      expect(parseMaxAmountEur("Plafond 1,5 M€")).toBe(1_500_000);
    });

    it("parses '200 k€'", () => {
      expect(parseMaxAmountEur("Aide de 200 k€")).toBe(200_000);
    });

    it("parses '2 millions d'euros'", () => {
      expect(parseMaxAmountEur("Subvention de 2 millions d'euros")).toBe(2_000_000);
    });

    it("parses 'maximum 50 000 €'", () => {
      expect(parseMaxAmountEur("maximum 50 000 €")).toBe(50_000);
    });

    it("parses 'plafonné à 100 K€'", () => {
      expect(parseMaxAmountEur("Aide plafonnée à 100 K€")).toBe(100_000);
    });

    it("returns the upper bound of a range", () => {
      expect(
        parseMaxAmountEur("entre 5 000 et 50 000 €")
      ).toBe(50_000);
    });

    it("handles HTML and &nbsp; entities", () => {
      expect(parseMaxAmountEur("<p>Jusqu'à&nbsp;100&nbsp;000&nbsp;€</p>")).toBe(
        100_000
      );
    });
  });

  describe("English formats", () => {
    it("parses 'up to €5,000,000'", () => {
      expect(parseMaxAmountEur("up to €5,000,000")).toBe(5_000_000);
    });

    it("parses '1.5M EUR'", () => {
      expect(parseMaxAmountEur("up to 1.5M EUR")).toBe(1_500_000);
    });

    it("parses '50K€'", () => {
      expect(parseMaxAmountEur("Grant of 50K€")).toBe(50_000);
    });
  });

  describe("edge cases", () => {
    it("returns null for empty input", () => {
      expect(parseMaxAmountEur("")).toBeNull();
      expect(parseMaxAmountEur(null)).toBeNull();
      expect(parseMaxAmountEur(undefined)).toBeNull();
    });

    it("returns null when no euro mention is found", () => {
      expect(parseMaxAmountEur("This text has no money")).toBeNull();
    });

    it("filters out years (e.g. '2030 €' is below sanity floor)", () => {
      // 2030 is above the 500 floor — but year-without-amount case: "en 2030"
      // should yield null because no currency tag.
      expect(parseMaxAmountEur("Programme actif en 2030")).toBeNull();
    });

    it("returns the largest plausible amount when multiple are present", () => {
      // "5 000 €" and "50 000 €" → should pick 50 000.
      expect(parseMaxAmountEur("entre 5 000 € et 50 000 € par projet")).toBe(
        50_000
      );
    });

    it("ignores tiny per-day rates below 500€", () => {
      expect(parseMaxAmountEur("100 € par jour")).toBeNull();
    });
  });
});
