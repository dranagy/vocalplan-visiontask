import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TeamSelector from "../../components/TeamSelector";
import { Team, TeamRole } from "../../types";

const makeTeam = (id: string, name: string): Team => ({
  id,
  name,
  inviteCode: `CODE${id}`,
  createdAt: "2026-01-01T00:00:00Z",
  members: [],
  _count: { tasks: 0, members: 1 },
});

const teams: Team[] = [makeTeam("t1", "Alpha"), makeTeam("t2", "Beta")];

describe("TeamSelector — no teams", () => {
  it("renders a link to /teams with Personal label when there are no teams", () => {
    render(
      <TeamSelector teams={[]} selectedTeamId={null} onTeamChange={vi.fn()} />
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/teams");
    expect(screen.getByText("Personal")).toBeInTheDocument();
  });
});

describe("TeamSelector — with teams", () => {
  it("renders Personal button and one button per team", () => {
    render(
      <TeamSelector teams={teams} selectedTeamId={null} onTeamChange={vi.fn()} />
    );
    expect(screen.getByText("Personal")).toBeInTheDocument();
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
  });

  it("highlights Personal button when selectedTeamId is null", () => {
    render(
      <TeamSelector teams={teams} selectedTeamId={null} onTeamChange={vi.fn()} />
    );
    const personalBtn = screen.getByText("Personal").closest("button")!;
    expect(personalBtn.className).toMatch(/bg-white/);
  });

  it("highlights the selected team button", () => {
    render(
      <TeamSelector teams={teams} selectedTeamId="t1" onTeamChange={vi.fn()} />
    );
    const alphaBtn = screen.getByText("Alpha").closest("button")!;
    expect(alphaBtn.className).toMatch(/bg-white/);
    const personalBtn = screen.getByText("Personal").closest("button")!;
    expect(personalBtn.className).not.toMatch(/bg-white/);
  });

  it("calls onTeamChange(null) when Personal is clicked", async () => {
    const onChange = vi.fn();
    render(
      <TeamSelector teams={teams} selectedTeamId="t1" onTeamChange={onChange} />
    );
    await userEvent.click(screen.getByText("Personal"));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("calls onTeamChange with team id when a team is clicked", async () => {
    const onChange = vi.fn();
    render(
      <TeamSelector teams={teams} selectedTeamId={null} onTeamChange={onChange} />
    );
    await userEvent.click(screen.getByText("Alpha"));
    expect(onChange).toHaveBeenCalledWith("t1");
  });

  it("does not call onTeamChange when disabled", async () => {
    const onChange = vi.fn();
    render(
      <TeamSelector teams={teams} selectedTeamId={null} onTeamChange={onChange} disabled />
    );
    await userEvent.click(screen.getByText("Personal"));
    expect(onChange).not.toHaveBeenCalled();
  });
});
