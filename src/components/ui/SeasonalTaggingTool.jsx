import React, { useState, useEffect } from "react";
import {
  Check,
  Filter,
  Tag,
  RefreshCw,
  Search,
  X as XIcon,
} from "lucide-react";
import { LoadingSpinner, EmptyState } from "../shared";
import { fetchWithTimeout } from "../../lib/api-utils";

// Use the same liturgical seasons from SongDatabase.jsx
const liturgicalSeasons = [
  { id: "advent", name: "Advent", color: "#4b0082" },
  { id: "christmas", name: "Christmas", color: "#ffffff" },
  { id: "epiphany", name: "Epiphany", color: "#006400" },
  { id: "lent", name: "Lent", color: "#800080" },
  { id: "holyWeek", name: "Holy Week", color: "#8b0000" },
  { id: "easter", name: "Easter", color: "#ffd700" },
  { id: "pentecost", name: "Pentecost", color: "#ff0000" },
  { id: "ordinaryTime", name: "Ordinary Time", color: "#008000" },
  { id: "reformation", name: "Reformation", color: "#ff0000" },
  { id: "allSaints", name: "All Saints", color: "#ffffff" },
  { id: "thanksgiving", name: "Thanksgiving", color: "#a0522d" },
];

const SeasonalTaggingTool = () => {
  // State for songs and selection
  const [songs, setSongs] = useState([]);
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [selectedSongs, setSelectedSongs] = useState({});
  const [selectedSeasons, setSelectedSeasons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showTagged, setShowTagged] = useState(false);
  const [updateStatus, setUpdateStatus] = useState(null);

  // Fetch songs when component mounts
  useEffect(() => {
    const fetchSongs = async () => {
      try {
        setIsLoading(true);
        const response = await fetchWithTimeout("/api/songs");

        if (!response.ok) {
          throw new Error("Failed to fetch songs");
        }

        const data = await response.json();
        setSongs(data);
        applyFilters(data, searchTerm, filterType, showTagged);
        setIsLoading(false);
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    };

    fetchSongs();
  }, []);

  // Apply filters when search/filter criteria change
  useEffect(() => {
    applyFilters(songs, searchTerm, filterType, showTagged);
  }, [songs, searchTerm, filterType, showTagged]);

  // Filter songs based on search term, type, and season tag status
  const applyFilters = (songs, search, type, showTagged) => {
    let filtered = [...songs];

    // Filter by search term
    if (search) {
      filtered = filtered.filter((song) =>
        song.title.toLowerCase().includes(search.toLowerCase()),
      );
    }

    // Filter by song type
    if (type !== "all") {
      filtered = filtered.filter((song) => song.type === type);
    }

    // Filter by season tag status
    if (!showTagged) {
      filtered = filtered.filter(
        (song) => !song.seasonalTags || song.seasonalTags.length === 0,
      );
    }

    setFilteredSongs(filtered);
  };

  // Select/deselect all songs
  const handleSelectAll = () => {
    const newSelected = {};
    if (Object.keys(selectedSongs).length < filteredSongs.length) {
      // Select all if not all are selected
      filteredSongs.forEach((song) => {
        newSelected[song._id] = song;
      });
    }
    setSelectedSongs(newSelected);
  };

  // Toggle selection of a single song
  const handleSelectSong = (song) => {
    setSelectedSongs((prev) => {
      const newSelected = { ...prev };
      if (newSelected[song._id]) {
        delete newSelected[song._id];
      } else {
        newSelected[song._id] = song;
      }
      return newSelected;
    });
  };

  // Toggle selection of a season
  const handleSelectSeason = (seasonId) => {
    setSelectedSeasons((prev) => {
      if (prev.includes(seasonId)) {
        return prev.filter((id) => id !== seasonId);
      } else {
        return [...prev, seasonId];
      }
    });
  };

  // Apply selected seasons to selected songs
  const handleApplySeasons = async () => {
    if (
      selectedSeasons.length === 0 ||
      Object.keys(selectedSongs).length === 0
    ) {
      setUpdateStatus({
        type: "error",
        message: "Please select both songs and seasons",
      });
      return;
    }

    setIsLoading(true);
    setUpdateStatus(null);

    try {
      // Process selected songs in batches
      const selectedSongArray = Object.values(selectedSongs);
      const updatePromises = selectedSongArray.map((song) => {
        // Create a new set of seasonal tags (existing + selected)
        const existingTags = song.seasonalTags || [];
        const newTags = [...new Set([...existingTags, ...selectedSeasons])];

        // Update song with new tags
        return fetchWithTimeout("/api/songs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...song,
            seasonalTags: newTags,
          }),
        });
      });

      await Promise.all(updatePromises);

      // Refresh song list
      const response = await fetchWithTimeout("/api/songs");
      const updatedSongs = await response.json();
      setSongs(updatedSongs);

      // Clear selections
      setSelectedSongs({});
      setUpdateStatus({
        type: "success",
        message: `Updated ${selectedSongArray.length} songs with ${selectedSeasons.length} seasonal tags`,
      });
    } catch (err) {
      setUpdateStatus({
        type: "error",
        message: `Error updating songs: ${err.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Remove selected seasons from selected songs
  const handleRemoveSeasons = async () => {
    if (
      selectedSeasons.length === 0 ||
      Object.keys(selectedSongs).length === 0
    ) {
      setUpdateStatus({
        type: "error",
        message: "Please select both songs and seasons",
      });
      return;
    }

    setIsLoading(true);
    setUpdateStatus(null);

    try {
      // Process selected songs in batches
      const selectedSongArray = Object.values(selectedSongs);
      const updatePromises = selectedSongArray.map((song) => {
        // Filter out selected seasons from existing tags
        const existingTags = song.seasonalTags || [];
        const newTags = existingTags.filter(
          (tag) => !selectedSeasons.includes(tag),
        );

        // Update song with new tags
        return fetchWithTimeout("/api/songs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...song,
            seasonalTags: newTags,
          }),
        });
      });

      await Promise.all(updatePromises);

      // Refresh song list
      const response = await fetchWithTimeout("/api/songs");
      const updatedSongs = await response.json();
      setSongs(updatedSongs);

      // Clear selections
      setSelectedSongs({});
      setUpdateStatus({
        type: "success",
        message: `Removed ${selectedSeasons.length} seasonal tags from ${selectedSongArray.length} songs`,
      });
    } catch (err) {
      setUpdateStatus({
        type: "error",
        message: `Error updating songs: ${err.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Seasonal Tagging Tool</h2>

      {/* Status message */}
      {updateStatus && (
        <div
          className={`mb-4 p-2 rounded text-sm ${
            updateStatus.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {updateStatus.message}
        </div>
      )}

      {/* Filter controls */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search songs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 p-2 w-full border rounded-md"
            />
          </div>
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="p-2 border rounded-md"
        >
          <option value="all">All Types</option>
          <option value="hymn">Hymns Only</option>
          <option value="contemporary">Contemporary Only</option>
        </select>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={showTagged}
            onChange={() => setShowTagged(!showTagged)}
            className="mr-2"
          />
          Show already tagged
        </label>
      </div>

      {/* Season selection */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Select Seasons to Apply/Remove:
        </h3>
        <div className="flex flex-wrap gap-2">
          {liturgicalSeasons.map((season) => (
            <button
              key={season.id}
              onClick={() => handleSelectSeason(season.id)}
              className={`flex items-center justify-between px-3 py-1.5 rounded-md text-sm ${
                selectedSeasons.includes(season.id)
                  ? "bg-purple-100 border-purple-500 text-purple-800 border"
                  : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100 border"
              }`}
            >
              <span>{season.name}</span>
              {selectedSeasons.includes(season.id) && (
                <Check className="ml-1.5 w-3 h-3 text-purple-600" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={handleApplySeasons}
          disabled={
            isLoading ||
            selectedSeasons.length === 0 ||
            Object.keys(selectedSongs).length === 0
          }
          className={`px-3 py-2 rounded-md text-sm flex items-center ${
            isLoading
              ? "bg-gray-300 text-gray-500"
              : "bg-green-600 text-white hover:bg-green-700"
          }`}
        >
          <Tag className="mr-1.5 w-4 h-4" />
          Apply Selected Seasons
        </button>

        <button
          onClick={handleRemoveSeasons}
          disabled={
            isLoading ||
            selectedSeasons.length === 0 ||
            Object.keys(selectedSongs).length === 0
          }
          className={`px-3 py-2 rounded-md text-sm flex items-center ${
            isLoading
              ? "bg-gray-300 text-gray-500"
              : "bg-red-600 text-white hover:bg-red-700"
          }`}
        >
          <XIcon className="mr-1.5 w-4 h-4" />
          Remove Selected Seasons
        </button>

        <button
          onClick={handleSelectAll}
          disabled={isLoading || filteredSongs.length === 0}
          className={`px-3 py-2 rounded-md text-sm flex items-center ${
            isLoading
              ? "bg-gray-300 text-gray-500"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {Object.keys(selectedSongs).length === filteredSongs.length &&
          filteredSongs.length > 0 ? (
            <>
              <XIcon className="mr-1.5 w-4 h-4" />
              Deselect All
            </>
          ) : (
            <>
              <Check className="mr-1.5 w-4 h-4" />
              Select All ({filteredSongs.length})
            </>
          )}
        </button>
      </div>

      {/* Song list with checkboxes */}
      <div className="border rounded-md overflow-hidden">
        <div className="flex bg-gray-100 p-2 font-medium text-sm text-gray-700">
          <div className="w-12 text-center">Select</div>
          <div className="flex-1">Song Title</div>
          <div className="w-24 text-center">Type</div>
          <div className="w-64">Current Seasons</div>
        </div>

        {isLoading ? (
          <div className="p-4 text-center text-gray-500">
            <LoadingSpinner size="md" className="mx-auto mb-2" />
            Loading songs...
          </div>
        ) : filteredSongs.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No Songs Match"
            message="Try adjusting your search or filter criteria."
            size="sm"
          />
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            {filteredSongs.map((song) => (
              <div
                key={song._id}
                className={`flex items-center p-2 hover:bg-gray-50 border-t ${
                  selectedSongs[song._id] ? "bg-purple-50" : ""
                }`}
              >
                <div className="w-12 text-center">
                  <input
                    type="checkbox"
                    checked={!!selectedSongs[song._id]}
                    onChange={() => handleSelectSong(song)}
                    className="h-4 w-4"
                  />
                </div>
                <div className="flex-1 font-medium">{song.title}</div>
                <div className="w-24 text-center text-sm">
                  {song.type === "hymn" ? (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      Hymn
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                      Contemporary
                    </span>
                  )}
                </div>
                <div className="w-64 flex flex-wrap gap-1">
                  {song.seasonalTags && song.seasonalTags.length > 0 ? (
                    song.seasonalTags.map((tag) => {
                      const season = liturgicalSeasons.find(
                        (s) => s.id === tag,
                      );
                      return (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-xs rounded-md bg-gray-100 text-gray-800"
                          style={{
                            borderLeft: `3px solid ${season?.color || "#888"}`,
                          }}
                        >
                          {season?.name || tag}
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-gray-400 text-sm">No seasons</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selection summary */}
      <div className="mt-4 text-sm text-gray-600">
        Selected {Object.keys(selectedSongs).length} songs and{" "}
        {selectedSeasons.length} seasons
      </div>
    </div>
  );
};

export default SeasonalTaggingTool;
