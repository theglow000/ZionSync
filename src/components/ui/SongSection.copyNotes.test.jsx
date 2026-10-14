import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import SongSection from "./SongSection";

test("on a phone, copying last time's notes opens the notes box to show them", () => {
  const onSongStateUpdate = jest.fn();
  render(
    <SongSection
      slot="song_0"
      label="Opening Hymn"
      songState={{
        type: "hymn",
        title: "A",
        number: "",
        hymnal: "",
        author: "",
        sheetMusic: "",
        youtube: "",
        notes: "",
      }}
      onSongStateUpdate={onSongStateUpdate}
      availableSongs={[]}
      hymnalVersions={[]}
      isMobile
      serviceSongs={[
        {
          date: "2/8/26",
          selections: { song_0: { title: "A", notes: "Verses 1 and 2" } },
        },
      ]}
      serviceDate="10/18/26"
      today="10/13/26"
    />,
  );
  expect(
    screen.queryByPlaceholderText("Notes (optional)"),
  ).not.toBeInTheDocument();
  fireEvent.click(
    screen.getByRole("button", { name: /copy last time's notes/i }),
  );
  expect(screen.getByPlaceholderText("Notes (optional)")).toBeInTheDocument();
});
