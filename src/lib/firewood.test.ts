import { describe, expect, it } from "vitest";

import { BLOCKS_PER_M3, KWH_PER_M3, SEASON_WEEKS, delivery, litersPerWeek } from "@/lib/firewood";

describe("firewood calculator", () => {
  it("fits about 390 blocks in a loosely filled cubic metre", () => {
    expect(BLOCKS_PER_M3).toBe(393);
    // Published figure for loose birch at 20 % moisture is about 1 400 kWh per m³
    expect(KWH_PER_M3).toBeGreaterThan(1300);
    expect(KWH_PER_M3).toBeLessThan(1500);
  });

  it("turns firing habits into litres per week", () => {
    expect(litersPerWeek(6, 20)).toBeCloseTo(305.3, 1);
  });

  it("rounds a whole-season delivery up to half a cubic metre that lasts the season", () => {
    const weekly = litersPerWeek(6, 20);
    const season = delivery(weekly, null);
    expect(season).toEqual({ liters: 11000, sacks: null, priceKr: 14245 });
    expect(season.liters).toBeGreaterThanOrEqual(weekly * SEASON_WEEKS);
  });

  it("delivers at least one cubic metre when everything comes at once", () => {
    expect(delivery(litersPerWeek(1, 5), null).liters).toBe(1000);
  });

  it("rounds recurring deliveries up to whole sacks that last until the next one", () => {
    const weekly = litersPerWeek(6, 20);
    expect(delivery(weekly, 1)).toEqual({ liters: 320, sacks: 8, priceKr: 414 });
    expect(delivery(weekly, 2)).toEqual({ liters: 640, sacks: 16, priceKr: 829 });
    expect(delivery(weekly, 4)).toEqual({ liters: 1240, sacks: 31, priceKr: 1606 });
  });

  it("delivers at least one sack", () => {
    expect(delivery(litersPerWeek(1, 5), 1).sacks).toBe(1);
  });
});
