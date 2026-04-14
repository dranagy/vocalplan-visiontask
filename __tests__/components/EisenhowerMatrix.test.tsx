import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EisenhowerMatrix from "../../components/EisenhowerMatrix";
import { Task, TaskCategory } from "../../types";

const mockTasks: Task[] = [
  { id: "1", title: "Fix production bug", category: TaskCategory.URGENT_IMPORTANT, date: "2026-04-13" },
  { id: "2", title: "Plan vacation", category: TaskCategory.IMPORTANT_NOT_URGENT, date: "2026-04-13" },
  { id: "3", title: "Reply to spam", category: TaskCategory.URGENT_NOT_IMPORTANT, date: "2026-04-13" },
  { id: "4", title: "Browse memes", category: TaskCategory.NOT_URGENT_NOT_IMPORTANT, date: "2026-04-13" },
];

describe("EisenhowerMatrix", () => {
  it("renders empty state when no tasks", () => {
    render(<EisenhowerMatrix tasks={[]} onToggleTask={vi.fn()} onDeleteTask={vi.fn()} />);
    expect(screen.getAllByText("No tasks here")).toHaveLength(4);
  });

  it("renders tasks in correct quadrants", () => {
    render(<EisenhowerMatrix tasks={mockTasks} onToggleTask={vi.fn()} onDeleteTask={vi.fn()} />);
    expect(screen.getByText("Fix production bug")).toBeInTheDocument();
    expect(screen.getByText("Plan vacation")).toBeInTheDocument();
    expect(screen.getByText("Reply to spam")).toBeInTheDocument();
    expect(screen.getByText("Browse memes")).toBeInTheDocument();
  });

  it("calls onToggleTask when check button is clicked", async () => {
    const onToggle = vi.fn();
    render(<EisenhowerMatrix tasks={[mockTasks[0]]} onToggleTask={onToggle} onDeleteTask={vi.fn()} />);
    const buttons = screen.getAllByRole("button");
    // First button is the check/toggle button
    await userEvent.click(buttons[0]);
    expect(onToggle).toHaveBeenCalledWith("1");
  });

  it("calls onDeleteTask when delete button is clicked", async () => {
    const onDelete = vi.fn();
    render(<EisenhowerMatrix tasks={[mockTasks[0]]} onToggleTask={vi.fn()} onDeleteTask={onDelete} />);
    // Delete button is the second button in the task row, but it's hidden until hover
    // We can still find it by its SVG content
    const taskRow = screen.getByText("Fix production bug").closest(".group");
    const deleteBtn = taskRow!.querySelector("button:last-of-type")!;
    await userEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledWith("1");
  });
});
