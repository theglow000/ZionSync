import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ServiceSongSelector from "./ServiceSongSelector";

jest.mock("../../lib/api-utils", () => ({
  fetchWithTimeout: jest.fn(),
  apiPost: jest.fn(),
}));
import { fetchWithTimeout } from "../../lib/api-utils";

const ok = (data) => ({
  ok: true,
  json: async () => data,
  text: async () => JSON.stringify(data),
});

const elements = [
  { type: "song_hymn", content: "Opening Hymn:" },
  { type: "liturgy", content: "Greeting" },
  { type: "song_hymn", content: "Hymn of the Day:" },
  { type: "song_hymn", content: "Sending Song:" },
];

const hymn = (title, number) => ({
  type: "hymn",
  title,
  number,
  hymnal: "cranberry",
  sheetMusic: "https://hymnary.org/x",
  youtube: "https://youtube.com/x",
});

describe("ServiceSongSelector save", () => {
  beforeEach(() => {
    fetchWithTimeout.mockReset();
    fetchWithTimeout.mockImplementation(async (url) => {
      if (url.startsWith("/api/service-songs?date=")) {
        // Song 2 still blank: the stored map has only song_0 and song_2
        return ok({
          date: "10/18/26",
          selections: {
            song_0: hymn("Amazing Grace", "123"),
            song_2: hymn("How Great Thou Art", "789"),
          },
        });
      }
      if (url.startsWith("/api/song-usage")) return ok([]);
      return ok({ success: true });
    });
  });

  test("REGRESSION X1: saving with a blank middle slot keeps each song on its own line", async () => {
    render(
      <ServiceSongSelector
        date="10/18/26"
        currentUser={{ name: "Ben" }}
        serviceDetails={{ date: "10/18/26", elements }}
        setServiceDetails={jest.fn()}
        expanded={true}
        onToggleExpand={jest.fn()}
        availableSongs={{ hymn: [], contemporary: [] }}
        customServices={[]}
        isMobile={true}
      />,
    );

    await waitFor(() =>
      expect(fetchWithTimeout).toHaveBeenCalledWith(
        "/api/service-songs?date=10/18/26",
      ),
    );
    fireEvent.click(await screen.findByText("Save Songs"));

    let saved;
    await waitFor(() => {
      const call = fetchWithTimeout.mock.calls.find(
        ([url]) => url === "/api/service-details",
      );
      expect(call).toBeDefined();
      saved = JSON.parse(call[1].body).elements;
    });

    expect(saved[0].content).toBe(
      "Opening Hymn: Amazing Grace #123 (Cranberry)",
    );
    expect(saved[2].content).toBe("Hymn of the Day: <Awaiting Song Selection>");
    expect(saved[3].content).toBe(
      "Sending Song: How Great Thou Art #789 (Cranberry)",
    );
  });

  const renderPicker = (props) =>
    render(
      <ServiceSongSelector
        currentUser={{ name: "Ben" }}
        setServiceDetails={jest.fn()}
        expanded={true}
        onToggleExpand={jest.fn()}
        availableSongs={{ hymn: [], contemporary: [] }}
        customServices={[]}
        {...props}
      />,
    );

  test("Task 11: season label comes from the date when the service carries none", async () => {
    // 12/6/26 is the second Sunday of Advent
    renderPicker({
      date: "12/6/26",
      serviceDetails: { date: "12/6/26", elements },
      isMobile: true,
    });
    expect(await screen.findByText(/Advent/)).toBeInTheDocument();
    expect(screen.queryByText(/Ordinary Time/)).not.toBeInTheDocument();
  });

  test("Task 11: the default title bar renders when no header is passed", async () => {
    renderPicker({
      date: "10/18/26",
      serviceDetails: { date: "10/18/26", elements, title: "Pentecost 21" },
      isMobile: false,
    });
    expect(await screen.findByText("Pentecost 21")).toBeInTheDocument();
  });
});
