import { describe, expect, it } from "vitest";

import { isDeliveryArea } from "@/lib/delivery-area";

describe("isDeliveryArea", () => {
  it("accepts postcodes inside the delivery area", () => {
    expect(isDeliveryArea("Storgatan 1, 114 55 Stockholm")).toBe(true);
    expect(isDeliveryArea("Storgatan 1, 11455 Stockholm")).toBe(true);
    expect(isDeliveryArea("Hamngatan 3, 761 30 Norrtälje")).toBe(true);
  });

  it("rejects postcodes outside the delivery area", () => {
    expect(isDeliveryArea("Kungsgatan 5, 411 01 Göteborg")).toBe(false);
    expect(isDeliveryArea("Dragarbrunnsgatan 2, 753 20 Uppsala")).toBe(false);
  });

  it("rejects an address without a postcode", () => {
    expect(isDeliveryArea("Storgatan 1, Stockholm")).toBe(false);
  });

  it("does not mistake a house number for the postcode", () => {
    expect(isDeliveryArea("Storgatan 150 41101 Göteborg")).toBe(false);
    expect(isDeliveryArea("Storgatan 450 11455 Stockholm")).toBe(true);
  });
});
