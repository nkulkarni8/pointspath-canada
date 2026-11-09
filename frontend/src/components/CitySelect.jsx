import { groupByRegion, REGION_ORDER } from "../lib/format";

export default function CitySelect({ id, value, onChange, cities, placeholder, style, "aria-label": ariaLabel }) {
  const grouped = groupByRegion(cities);
  return (
    <select id={id} value={value} onChange={onChange} style={style} aria-label={ariaLabel}>
      <option value="">{placeholder}</option>
      {REGION_ORDER.filter(r => grouped[r]?.length).map(region => (
        <optgroup key={region} label={`── ${region} ──`}>
          {grouped[region].map(c => <option key={c} value={c}>{c}</option>)}
        </optgroup>
      ))}
    </select>
  );
}
