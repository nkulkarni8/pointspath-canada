import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAlliance, getCuratedSweetSpots, getPointsValuation, getStopovers } from "./api";

const ok = (body) => Promise.resolve({ ok: true, json: async () => body });
const bad = () => Promise.resolve({ ok: false, json: async () => ({}) });

describe("reference-data helpers", () => {
  const orig = global.fetch;
  beforeEach(() => { global.fetch = vi.fn(); });
  afterEach(() => { global.fetch = orig; });

  it("getPointsValuation returns the valuation and encodes the program", async () => {
    global.fetch.mockReturnValue(ok({ name: "Aeroplan", floor: 1.5, ceiling: 2.1 }));
    const v = await getPointsValuation("Air Canada Aeroplan");
    expect(v.floor).toBe(1.5);
    expect(global.fetch.mock.calls[0][0]).toContain("/points-valuations?program=Air+Canada+Aeroplan");
  });

  it("returns null on null body, HTTP error, or network failure", async () => {
    global.fetch.mockReturnValue(ok(null));
    expect(await getPointsValuation("X")).toBeNull();
    expect(await getAlliance("X")).toBeNull();
    global.fetch.mockReturnValue(bad());
    expect(await getPointsValuation("X")).toBeNull();
    expect(await getAlliance("X")).toBeNull();
    expect(await getStopovers("X")).toBeNull();
    global.fetch.mockRejectedValue(new Error("offline"));
    expect(await getPointsValuation("X")).toBeNull();
    expect(await getAlliance("X")).toBeNull();
    expect(await getStopovers("X")).toBeNull();
  });

  it("skips the network when no program is given", async () => {
    expect(await getPointsValuation("")).toBeNull();
    expect(await getAlliance(undefined)).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("getStopovers only returns the policy when allowed is true", async () => {
    global.fetch.mockReturnValue(ok({ allowed: null, note: "unknown" }));
    expect(await getStopovers("X")).toBeNull();
    global.fetch.mockReturnValue(ok({ allowed: true, max_stopovers_one_way: 1 }));
    expect((await getStopovers("Aeroplan")).max_stopovers_one_way).toBe(1);
  });

  it("getCuratedSweetSpots passes filters and returns [] on failure", async () => {
    global.fetch.mockReturnValue(ok([{ name: "A", tier: "good" }]));
    expect(await getCuratedSweetSpots({ program: "Aeroplan", kind: "flight" })).toHaveLength(1);
    expect(global.fetch.mock.calls[0][0]).toMatch(/program=Aeroplan&kind=flight/);
    global.fetch.mockReturnValue(bad());
    expect(await getCuratedSweetSpots()).toEqual([]);
    global.fetch.mockRejectedValue(new Error("x"));
    expect(await getCuratedSweetSpots()).toEqual([]);
    global.fetch.mockReturnValue(ok({ not: "an array" }));
    expect(await getCuratedSweetSpots()).toEqual([]);
  });
});
