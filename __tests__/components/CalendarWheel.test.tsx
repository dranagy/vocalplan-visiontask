import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CalendarWheel from "../../components/CalendarWheel";

describe("CalendarWheel", () => {
  it("renders 30 date buttons", () => {
    render(<CalendarWheel selectedDate={new Date()} onDateChange={vi.fn()} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(60);
  });

  it("calls onDateChange when a date is clicked", async () => {
    const onChange = vi.fn();
    render(<CalendarWheel selectedDate={new Date()} onDateChange={onChange} />);
    const buttons = screen.getAllByRole("button");
    await userEvent.click(buttons[1]);
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
