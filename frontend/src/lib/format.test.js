import { describe, expect, it } from "vitest";
import { fmt, groupByRegion, seasonBadge } from "./format";

describe("fmt", () => {
  it("formats a number with locale separators", () => {
    expect(fmt(80000)).toBe("80,000");
  });
  it("returns an em dash for 0 / falsy values", () => {
    expect(fmt(0)).toBe("—");
    expect(fmt(null)).toBe("—");
    expect(fmt(undefined)).toBe("—");
  });
});

describe("seasonBadge", () => {
  it("returns null when no month or month is 0", () => {
    expect(seasonBadge(0)).toBeNull();
    expect(seasonBadge(undefined)).toBeNull();
  });
  it("flags peak months", () => {
    expect(seasonBadge(7)).toMatchObject({ l: "Peak" });
    expect(seasonBadge(12)).toMatchObject({ l: "Peak" });
  });
  it("flags shoulder months", () => {
    expect(seasonBadge(4)).toMatchObject({ l: "Shoulder" });
  });
  it("defaults to off-peak otherwise", () => {
    expect(seasonBadge(2)).toMatchObject({ l: "Off-Peak" });
  });
});

describe("groupByRegion", () => {
  it("groups known cities under their region and sorts within group", () => {
    const grouped = groupByRegion(["Vancouver", "Toronto", "Montreal"]);
    expect(grouped.Canada).toEqual(["Montreal", "Toronto", "Vancouver"]);
  });
  it("buckets unknown cities under Other", () => {
    const grouped = groupByRegion(["Atlantis"]);
    expect(grouped.Other).toEqual(["Atlantis"]);
  });
});
