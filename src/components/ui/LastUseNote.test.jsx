import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import LastUseNote from "./LastUseNote";

const serviceSongs = [
  {
    date: "2/8/26",
    selections: {
      song_0: {
        title: "This Little Light of Mine",
        notes:
          "Last sung January 18, 2026.\nVerses 1 and 2\nSing through twice.",
      },
    },
  },
  { date: "11/15/26", selections: { song_1: { title: "Holy Spirit" } } },
];

const renderNote = (props) =>
  render(
    <LastUseNote
      title="This Little Light of Mine"
      serviceSongs={serviceSongs}
      serviceDate="10/18/26"
      today="10/13/26"
      notesEmpty
      onCopyNotes={() => {}}
      {...props}
    />,
  );

describe("LastUseNote", () => {
  test("shows when it was last sung, with the church-day name and verses", () => {
    renderNote();
    expect(
      screen.getByText(/Last sung February 8, 2026 · 5th Sunday of Epiphany/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Last time: Verses 1 and 2/)).toBeInTheDocument();
  });

  test("a use still ahead of today reads Scheduled", () => {
    renderNote({ title: "Holy Spirit", serviceDate: "12/20/26" });
    expect(
      screen.getByText(/^Scheduled November 15, 2026/),
    ).toBeInTheDocument();
  });

  test("a song with no history says so without claiming 'never'", () => {
    renderNote({ title: "Brand New Song" });
    expect(screen.getByText("No earlier record")).toBeInTheDocument();
  });

  test("renders nothing until the history has loaded, or with no title", () => {
    const { container } = renderNote({ serviceSongs: null });
    expect(container).toBeEmptyDOMElement();
    const { container: c2 } = renderNote({ title: "  " });
    expect(c2).toBeEmptyDOMElement();
  });

  test("copies last time's notes without the old last-sung line", () => {
    const onCopyNotes = jest.fn();
    renderNote({ onCopyNotes });
    fireEvent.click(
      screen.getByRole("button", { name: /copy last time's notes/i }),
    );
    expect(onCopyNotes).toHaveBeenCalledWith(
      "Verses 1 and 2\nSing through twice.",
    );
  });

  test("no copy button once she has typed notes", () => {
    renderNote({ notesEmpty: false });
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
