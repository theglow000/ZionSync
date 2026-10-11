import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import SongDatabase from "./SongDatabase";

// Any icon this screen (or its tabs) imports renders as nothing
jest.mock(
  "lucide-react",
  () =>
    new Proxy(
      { __esModule: true },
      { get: (target, key) => (key in target ? target[key] : () => null) },
    ),
);

jest.mock("../../lib/api-utils", () => ({
  fetchWithTimeout: jest.fn(),
  apiPost: jest.fn(),
  apiDelete: jest.fn(),
}));
import { fetchWithTimeout } from "../../lib/api-utils";

const ok = (data) => ({ ok: true, json: async () => data });

const songs = [
  {
    _id: "a",
    title: "Amazing Grace",
    type: "hymn",
    number: "1",
    hymnal: "cranberry",
  },
  {
    _id: "b",
    title: "Amazing Grace (dup)",
    type: "hymn",
    number: "1",
    hymnal: "cranberry",
  },
];

describe("SongDatabase merge", () => {
  beforeEach(() => {
    fetchWithTimeout.mockReset();
    fetchWithTimeout.mockImplementation(async (url) => {
      if (url === "/api/songs") return ok(songs.map((s) => ({ ...s })));
      return ok({ success: true });
    });
  });

  test("Task 11: a successful merge reports success and refreshes the list", async () => {
    render(<SongDatabase />);

    // Radix tabs switch on mouse down; the list lives on the library tab
    fireEvent.mouseDown(await screen.findByRole("tab", { name: /library/i }));

    fireEvent.click(await screen.findByText("Amazing Grace (dup)"));
    fireEvent.click(await screen.findByText("Merge"));
    fireEvent.change(screen.getByPlaceholderText("Type to search..."), {
      target: { value: "Amazing" },
    });
    const modal = screen.getByText("Merge Song").closest("div");
    fireEvent.click(await within(modal).findByText("Amazing Grace"));
    fireEvent.click(within(modal).getByText("Merge Songs"));

    await waitFor(() =>
      expect(
        fetchWithTimeout.mock.calls.filter(([url]) => url === "/api/songs"),
      ).toHaveLength(2),
    );
    expect(screen.getByText("Songs merged successfully")).toBeInTheDocument();
    expect(screen.queryByText(/is not defined/)).not.toBeInTheDocument();
  });
});
