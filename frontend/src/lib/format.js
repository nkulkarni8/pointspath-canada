import { CITY_REGION, PEAK, REGION_ORDER, SHOULDER } from "../constants";

export function fmt(n) {
  return n ? Number(n).toLocaleString() : "—";
}

export function seasonBadge(m) {
  if (!m || m === 0) return null;
  if (PEAK.has(m)) return { l: "Peak", c: "#B91C1C", tip: "Expect higher points. Book early." };
  if (SHOULDER.has(m)) return { l: "Shoulder", c: "#B45309", tip: "Slight premium over base rates." };
  return { l: "Off-Peak", c: "#15803D", tip: "Best time to book — lowest points rates." };
}

export function groupByRegion(cities) {
  const map = {};
  cities.forEach(c => {
    const r = CITY_REGION[c] || "Other";
    (map[r] = map[r] || []).push(c);
  });
  Object.values(map).forEach(arr => arr.sort());
  return map;
}

export { REGION_ORDER };
