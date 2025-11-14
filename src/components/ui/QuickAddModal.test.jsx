import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { act } from "react";
import QuickAddModal from "./QuickAddModal";

// Mock api-utils module
jest.mock("../../lib/api-utils", () => ({
  fetchWithTimeout: jest.fn(),
}));

// Import the mocked function after mocking
import { fetchWithTimeout } from "../../lib/api-utils";

// Mock confirm function
global.confirm = jest.fn(() => true);

// Mock data for tests - matching actual API structure
const mockUpcomingServices = [
  {
    date: "5/5/25",
    title: "Sunday Service - 5/5/25",
    type: "communion",
    liturgical: {
      season: "Easter",
      seasonName: "Easter",
      color: "#ffffff",
    },
    elements: [
      {
        type: "song_hymn",
        content: "Opening Hymn: ",
        selection: {
          title: "Amazing Grace",
          type: "hymn",
          number: "123",
          hymnal: "Cranberry",
        },
      },
      {
        type: "song_hymn",
        content: "Hymn of the Day: ",
        selection: null,
      },
      {
        type: "song_hymn",
        content: "Communion Hymn: ",
        selection: null,
      },
      {
        type: "song_hymn",
        content: "Closing Hymn: ",
        selection: {
          title: "How Great Thou Art",
          type: "hymn",
          number: "456",
          hymnal: "Cranberry",
        },
      },
    ],
  },
  {
    date: "5/12/25",
    title: "Sunday Service - 5/12/25",
    type: "communion",
    liturgical: {
      season: "Easter",
      seasonName: "Easter",
      color: "#ffffff",
    },
    elements: [
      {
        type: "song_hymn",
        content: "Opening Hymn: ",
        selection: null,
      },
      {
        type: "song_hymn",
        content: "Hymn of the Day: ",
        selection: null,
      },
      {
        type: "song_hymn",
        content: "Communion Hymn: ",
        selection: null,
      },
      {
        type: "song_hymn",
        content: "Closing Hymn: ",
        selection: null,
      },
    ],
  },
];

describe("QuickAddModal Component", () => {
  beforeEach(() => {
    fetchWithTimeout.mockClear();
    confirm.mockClear();

    // Mock successful responses for API calls
    fetchWithTimeout.mockImplementation((url, options) => {
      if (url.includes("/api/upcoming-services")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockUpcomingServices),
        });
      } else if (url.includes("/api/reference-songs/import")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              message: "Song added successfully!",
            }),
        });
      }
      return Promise.reject(new Error("Not found"));
    });
  });

  test("renders modal when isOpen is true", async () => {
    const mockSong = {
      _id: "song1",
      title: "Test Song",
      type: "hymn",
      number: "123",
      hymnal: "Cranberry",
    };

    await act(async () => {
      render(
        <QuickAddModal isOpen={true} onClose={() => {}} song={mockSong} />,
      );
    });

    expect(
      screen.getByText(/Add "Test Song" to a Service/i),
    ).toBeInTheDocument();
  });

  test("loads upcoming services on open", async () => {
    const mockSong = {
      _id: "song1",
      title: "Test Song",
      type: "hymn",
    };

    await act(async () => {
      render(
        <QuickAddModal isOpen={true} onClose={() => {}} song={mockSong} />,
      );
    });

    await waitFor(() => {
      expect(fetchWithTimeout).toHaveBeenCalledWith(
        "/api/upcoming-services?limit=8",
      );
    });

    // After services load, we should see them in the list
    const serviceElements = await screen.findAllByText(/Sunday Service/i);
    expect(serviceElements.length).toBeGreaterThan(0);

    // Check for the formatted date text using a function matcher to handle split text
    expect(
      await screen.findByText((content, element) => {
        return (
          element?.textContent === "5/5/2025" || content.includes("5/5/2025")
        );
      }),
    ).toBeInTheDocument();
  });

  test("shows song slots when a service is selected", async () => {
    const mockSong = {
      _id: "song1",
      title: "Test Song",
      type: "hymn",
    };

    await act(async () => {
      render(
        <QuickAddModal isOpen={true} onClose={() => {}} song={mockSong} />,
      );
    });

    // Wait for services to load
    await waitFor(() => {
      expect(fetchWithTimeout).toHaveBeenCalledWith(
        "/api/upcoming-services?limit=8",
      );
    });

    // Select the first service - find "Select" button
    const selectButtons = await screen.findAllByText("Select");

    await act(async () => {
      fireEvent.click(selectButtons[0]);
    });

    // Check if slots are displayed - these come from the elements array
    await waitFor(() => {
      expect(screen.getByText(/Opening Hymn/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Hymn of the Day/i)).toBeInTheDocument();
    expect(screen.getByText(/Communion Hymn/i)).toBeInTheDocument();
    expect(screen.getByText(/Closing Hymn/i)).toBeInTheDocument();
  });

  test("adds song to selected slot", async () => {
    const mockSong = {
      _id: "song1",
      title: "Test Song",
      type: "hymn",
      number: "789",
      hymnal: "Cranberry",
    };

    await act(async () => {
      render(
        <QuickAddModal isOpen={true} onClose={() => {}} song={mockSong} />,
      );
    });

    // Wait for services to load and select first service
    await waitFor(() => {
      expect(fetchWithTimeout).toHaveBeenCalledWith(
        "/api/upcoming-services?limit=8",
      );
    });

    const selectButtons = await screen.findAllByText("Select");

    await act(async () => {
      fireEvent.click(selectButtons[0]);
    });

    // Wait for slots to appear
    await waitFor(() => {
      expect(screen.getByText(/Hymn of the Day/i)).toBeInTheDocument();
    });

    // Find an empty slot button (Hymn of the Day is empty)
    const emptySlotText = screen.getByText(/Hymn of the Day/i);
    const emptySlotButton = emptySlotText.closest("button");

    await act(async () => {
      fireEvent.click(emptySlotButton);
    });

    // Check if add song API is called with correct endpoint
    await waitFor(() => {
      expect(fetchWithTimeout).toHaveBeenCalledWith(
        "/api/reference-songs/import",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
          body: expect.any(String),
        }),
      );
    });

    // Should show success message - matches actual message format
    expect(
      await screen.findByText((content) =>
        content.includes("successfully added to"),
      ),
    ).toBeInTheDocument();
  });

  test("shows warning when replacing existing song", async () => {
    const mockSong = {
      _id: "song1",
      title: "Test Song",
      type: "hymn",
      number: "999",
      hymnal: "Cranberry",
    };

    await act(async () => {
      render(
        <QuickAddModal isOpen={true} onClose={() => {}} song={mockSong} />,
      );
    });

    // Wait for services to load and select first service
    await waitFor(() => {
      expect(fetchWithTimeout).toHaveBeenCalledWith(
        "/api/upcoming-services?limit=8",
      );
    });

    const selectButtons = await screen.findAllByText("Select");

    await act(async () => {
      fireEvent.click(selectButtons[0]);
    });

    // Wait for slots to appear
    await waitFor(() => {
      expect(screen.getByText(/Opening Hymn/i)).toBeInTheDocument();
    });

    // Check for the "Will replace existing" warning on filled slots (there are 2)
    const replaceWarnings = screen.getAllByText("Will replace existing");
    expect(replaceWarnings.length).toBeGreaterThan(0);

    // Check for "Current: Amazing Grace" text showing what will be replaced
    expect(screen.getByText(/Current.*Amazing Grace/i)).toBeInTheDocument();

    // Find a filled slot (Opening Hymn has "Amazing Grace")
    const filledSlotText = screen.getByText(/Opening Hymn/i);
    const filledSlotButton = filledSlotText.closest("button");

    await act(async () => {
      fireEvent.click(filledSlotButton);
    });

    // Check if add song API is called (no confirm needed, just direct replacement)
    await waitFor(() => {
      expect(fetchWithTimeout).toHaveBeenCalledWith(
        "/api/reference-songs/import",
        expect.any(Object),
      );
    });
  });
});
