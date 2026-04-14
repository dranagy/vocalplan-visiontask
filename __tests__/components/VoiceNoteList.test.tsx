import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import VoiceNoteList from "../../components/VoiceNoteList";
import { VoiceNote } from "../../types";

const mockNotes: VoiceNote[] = [
  {
    id: "1",
    audioData: "data:audio/webm;base64,dGVzdA==",
    timestamp: "2:30 PM",
    date: "2026-04-13",
    duration: "0:15",
  },
];

describe("VoiceNoteList", () => {
  it("renders nothing when notes array is empty", () => {
    const { container } = render(<VoiceNoteList voiceNotes={[]} onDeleteNote={vi.fn()} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders voice notes with audio elements", () => {
    render(<VoiceNoteList voiceNotes={mockNotes} onDeleteNote={vi.fn()} />);
    expect(screen.getByText("2:30 PM")).toBeInTheDocument();
    expect(screen.getByText("0:15")).toBeInTheDocument();
    expect(document.querySelector("audio")).toBeInTheDocument();
  });

  it("renders correct count badge", () => {
    render(<VoiceNoteList voiceNotes={mockNotes} onDeleteNote={vi.fn()} />);
    expect(screen.getByText("1")).toBeInTheDocument();
  });
});
