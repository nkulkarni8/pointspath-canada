import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CitySelect from "./CitySelect";

describe("CitySelect", () => {
  const cities = ["Toronto", "Vancouver", "Tokyo"];

  it("renders options grouped into optgroups by region", () => {
    render(<CitySelect value="" onChange={() => {}} cities={cities} placeholder="Select a city" />);
    // Canada cities grouped together
    const canadaGroup = screen.getByRole("group", { name: /canada/i });
    expect(canadaGroup).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Toronto" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Tokyo" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Select a city" })).toBeInTheDocument();
  });

  it("fires onChange with the selected city", () => {
    const onChange = vi.fn();
    render(<CitySelect value="" onChange={onChange} cities={cities} placeholder="Select a city" />);
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "Toronto" } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
