import React, { useState, useEffect } from "react";
import {
  X as XIcon,
  Save,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Search,
} from "lucide-react";
import { LoadingSpinner, EmptyState } from "../shared";
import { fetchWithTimeout } from "../../lib/api-utils";

const ReferenceSongManageModal = ({
  isOpen,
  onClose,
  mode = "add",
  song = null,
  onComplete,
  liturgicalSeasons,
  hymnalVersions,
}) => {
  const [activeTab, setActiveTab] = useState("all");
  const [activeSeason, setActiveSeason] = useState(null);
  const [songList, setSongList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Simplified form state
  const [formData, setFormData] = useState({
    _id: "",
    title: "",
    type: "hymn",
    seasonalTags: [],
    // New simplified fields
    tempo: "",
    theme: "",
    arrangement: "",
    // Essential type-specific fields
    number: "",
    hymnal: "",
    author: "",
  });

  // UI state
  const [message, setMessage] = useState(null);
  const [expandedSongId, setExpandedSongId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [formMode, setFormMode] = useState(mode);

  // Initialize form with song data if provided
  useEffect(() => {
    if (song) {
      setFormData({
        _id: song._id || "",
        title: song.title || "",
        type: song.type || "hymn",
        seasonalTags: song.seasonalTags || [],
        tempo: song.tempo || "",
        theme: song.theme || "",
        arrangement: song.arrangement || "",
        number: song.number || "",
        hymnal: song.hymnal || "",
        author: song.author || "",
      });
    }
  }, [song]);

  // Load songs for the current season and type
  useEffect(() => {
    if (!isOpen) return;
    loadSongs();
  }, [activeSeason, activeTab, isOpen]);

  // Fetch songs filtered by season and type
  const loadSongs = async () => {
    setLoading(true);
    setError(null);

    try {
      let url = "/api/reference-songs";
      const params = new URLSearchParams();

      if (activeSeason) {
        params.append("season", activeSeason);
      }

      if (activeTab !== "all") {
        params.append("type", activeTab);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetchWithTimeout(url);

      if (!response.ok) {
        throw new Error("Failed to load reference songs");
      }

      const data = await response.json();
      setSongList(data);
    } catch (err) {
      console.error("Error loading songs:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Toggle a season tag
  const handleSeasonToggle = (seasonId) => {
    setFormData((prev) => {
      const seasonExists = prev.seasonalTags.includes(seasonId);

      return {
        ...prev,
        seasonalTags: seasonExists
          ? prev.seasonalTags.filter((id) => id !== seasonId)
          : [...prev.seasonalTags, seasonId],
      };
    });
  };

  // Save the song (create or update)
  const handleSaveSong = async () => {
    // Validate form
    if (!formData.title.trim()) {
      setMessage({ type: "error", text: "Title is required" });
      return;
    }

    if (!formData.seasonalTags.length) {
      setMessage({
        type: "error",
        text: "At least one season must be selected",
      });
      return;
    }

    if (formData.type === "hymn" && !formData.number) {
      setMessage({ type: "error", text: "Hymn number is required for hymns" });
      return;
    }

    if (formData.type === "contemporary" && !formData.author) {
      setMessage({
        type: "error",
        text: "Author/artist is required for contemporary songs",
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const isUpdate = formData._id;
      const endpoint = isUpdate
        ? `/api/reference-songs/${formData._id}`
        : "/api/reference-songs";

      const method = isUpdate ? "PUT" : "POST";

      const response = await fetchWithTimeout(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save song");
      }

      setMessage({
        type: "success",
        text: isUpdate
          ? "Song updated successfully"
          : "Song created successfully",
      });

      // Reset form if it's a new song
      if (!isUpdate) {
        setFormData({
          _id: "",
          title: "",
          type: formData.type, // Keep the current type
          seasonalTags: [],
          tempo: "",
          theme: "",
          arrangement: "",
          number: "",
          hymnal: "",
          author: "",
        });
      }

      // Refresh song list
      loadSongs();

      // Notify parent
      onComplete && onComplete();
    } catch (err) {
      console.error("Error saving song:", err);
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Delete a song
  const handleDeleteSong = async () => {
    if (!formData._id) return;

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetchWithTimeout(
        `/api/reference-songs/${formData._id}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete song");
      }

      setMessage({ type: "success", text: "Song deleted successfully" });
      setConfirmDelete(false);

      // Reset form
      setFormData({
        _id: "",
        title: "",
        type: "hymn",
        seasonalTags: [],
        tempo: "",
        theme: "",
        arrangement: "",
        number: "",
        hymnal: "",
        author: "",
      });

      // Refresh song list
      loadSongs();

      // Notify parent
      onComplete && onComplete();
    } catch (err) {
      console.error("Error deleting song:", err);
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
      setConfirmDelete(false);
    }
  };

  // Select a song to edit
  const handleEditSong = (song) => {
    setFormData({
      _id: song._id || "",
      title: song.title || "",
      type: song.type || "hymn",
      seasonalTags: song.seasonalTags || [],
      tempo: song.tempo || "",
      theme: song.theme || "",
      arrangement: song.arrangement || "",
      number: song.number || "",
      hymnal: song.hymnal || "",
      author: song.author || "",
    });

    setFormMode("edit");
    setExpandedSongId(null);
  };

  // Reset the form
  const handleResetForm = () => {
    setFormData({
      _id: "",
      title: "",
      type: "hymn",
      seasonalTags: [],
      tempo: "",
      theme: "",
      arrangement: "",
      number: "",
      hymnal: "",
      author: "",
    });

    setFormMode("add");
    setMessage(null);
    setConfirmDelete(false);
  };

  // Toggle song expansion in list
  const toggleSongExpansion = (songId) => {
    setExpandedSongId(expandedSongId === songId ? null : songId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-6xl my-8">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">Manage Reference Songs</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Main content */}
        <div className="flex flex-col md:flex-row h-[calc(100vh-10rem)] max-h-[800px]">
          {/* Song list panel - 1/3 width */}
          <div className="w-full md:w-1/3 border-r overflow-hidden flex flex-col h-full">
            <div className="p-3 border-b bg-gray-50">
              <h3 className="font-medium mb-2">Browse Reference Songs</h3>

              {/* Filter tabs */}
              <div className="flex border rounded overflow-hidden mb-2">
                <button
                  className={`flex-1 py-1.5 px-2 text-sm ${activeTab === "all" ? "bg-purple-100 text-purple-800" : "bg-white text-gray-700"}`}
                  onClick={() => setActiveTab("all")}
                >
                  All
                </button>
                <button
                  className={`flex-1 py-1.5 px-2 text-sm ${activeTab === "hymn" ? "bg-blue-100 text-blue-800" : "bg-white text-gray-700"}`}
                  onClick={() => setActiveTab("hymn")}
                >
                  Hymns
                </button>
                <button
                  className={`flex-1 py-1.5 px-2 text-sm ${activeTab === "contemporary" ? "bg-green-100 text-green-800" : "bg-white text-gray-700"}`}
                  onClick={() => setActiveTab("contemporary")}
                >
                  Contemporary
                </button>
              </div>

              {/* Season filter */}
              <select
                value={activeSeason || ""}
                onChange={(e) => setActiveSeason(e.target.value || null)}
                className="w-full p-2 border rounded text-sm"
              >
                <option value="">All Seasons</option>
                {liturgicalSeasons.map((season) => (
                  <option key={season.id} value={season.id}>
                    {season.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Song list */}
            <div className="flex-grow overflow-y-auto">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <LoadingSpinner size="lg" className="border-purple-600" />
                </div>
              ) : error ? (
                <div className="p-4 text-center text-red-500">{error}</div>
              ) : songList.length === 0 ? (
                <EmptyState
                  icon={Search}
                  title="No Songs Found"
                  message="No songs match the selected filters. Try adjusting your criteria."
                  size="sm"
                />
              ) : (
                <div className="divide-y">
                  {songList.map((song) => (
                    <div key={song._id} className="hover:bg-gray-50">
                      <div
                        className={`flex justify-between items-center p-3 cursor-pointer ${
                          expandedSongId === song._id ? "bg-gray-50" : ""
                        }`}
                        onClick={() => toggleSongExpansion(song._id)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate flex items-center">
                            {song.title}
                            {song.type === "hymn" && song.number && (
                              <span className="ml-1 text-blue-700">
                                #{song.number}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center">
                            <span
                              className={`inline-block w-2 h-2 rounded-full mr-1 ${
                                song.type === "hymn"
                                  ? "bg-blue-500"
                                  : "bg-green-500"
                              }`}
                            ></span>
                            {song.type === "hymn" ? "Hymn" : "Contemporary"}
                          </div>
                        </div>
                        <div>
                          {expandedSongId === song._id ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {/* Expanded song details */}
                      {expandedSongId === song._id && (
                        <div className="p-3 bg-gray-50 border-t text-sm">
                          {song.seasonalTags &&
                            song.seasonalTags.length > 0 && (
                              <div className="mb-2">
                                <div className="font-medium text-xs text-gray-500 uppercase mb-1">
                                  Seasons
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {song.seasonalTags.map((tagId) => {
                                    const season = liturgicalSeasons.find(
                                      (s) => s.id === tagId,
                                    );
                                    return (
                                      season && (
                                        <span
                                          key={tagId}
                                          className="px-2 py-0.5 text-xs rounded-md border border-gray-200"
                                          style={{
                                            borderLeftColor: season.color,
                                            borderLeftWidth: "3px",
                                          }}
                                        >
                                          {season.name}
                                        </span>
                                      )
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                          {/* Show tempo, theme, arrangement if available */}
                          {(song.tempo || song.theme || song.arrangement) && (
                            <div className="mt-2 text-gray-700 text-sm">
                              {song.tempo && (
                                <div>
                                  <span className="font-medium">Tempo:</span>{" "}
                                  {song.tempo}
                                </div>
                              )}
                              {song.theme && (
                                <div>
                                  <span className="font-medium">Theme:</span>{" "}
                                  {song.theme}
                                </div>
                              )}
                              {song.arrangement && (
                                <div>
                                  <span className="font-medium">
                                    Arrangement:
                                  </span>{" "}
                                  {song.arrangement}
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex justify-end mt-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditSong(song);
                              }}
                              className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add new button */}
            <div className="p-3 border-t bg-gray-50">
              <button
                onClick={handleResetForm}
                className="w-full py-2 bg-purple-600 text-white rounded-md flex items-center justify-center gap-1 hover:bg-purple-700"
              >
                <Plus className="w-4 h-4" />
                <span>New Song</span>
              </button>
            </div>
          </div>

          {/* Song form panel - 2/3 width */}
          <div className="w-full md:w-2/3 overflow-hidden flex flex-col h-full">
            <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-medium">
                {formMode === "add" ? "Add New Song" : "Edit Song"}
              </h3>

              <div className="flex gap-2">
                {formMode === "edit" && (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-1"
                    disabled={loading}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                )}

                <button
                  onClick={handleSaveSong}
                  className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-1"
                  disabled={loading}
                >
                  <Save className="w-4 h-4" />
                  <span>{formMode === "add" ? "Create" : "Update"}</span>
                </button>
              </div>
            </div>

            {/* Form content */}
            <div className="flex-grow overflow-y-auto p-4">
              {/* Status message */}
              {message && (
                <div
                  className={`mb-4 p-3 rounded ${
                    message.type === "success"
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {message.text}
                </div>
              )}

              {/* Delete confirmation */}
              {confirmDelete && (
                <div className="mb-4 p-3 border border-red-300 bg-red-50 rounded-md">
                  <p className="text-red-700 mb-2 font-medium">
                    Are you sure you want to delete this song?
                  </p>
                  <p className="text-red-600 mb-3 text-sm">
                    This action cannot be undone.
                  </p>

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="px-3 py-1 border border-gray-300 rounded bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteSong}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      disabled={loading}
                    >
                      {loading ? "Deleting..." : "Yes, Delete"}
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Basic information */}
                <div>
                  <h4 className="font-medium mb-2 text-gray-700">
                    Basic Information
                  </h4>

                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Song Title*
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className="w-full border rounded-md p-2"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type*
                    </label>
                    <div className="flex border rounded overflow-hidden">
                      <button
                        type="button"
                        className={`flex-1 py-2 ${
                          formData.type === "hymn"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-white text-gray-700"
                        }`}
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, type: "hymn" }))
                        }
                      >
                        Hymn
                      </button>
                      <button
                        type="button"
                        className={`flex-1 py-2 ${
                          formData.type === "contemporary"
                            ? "bg-green-100 text-green-800"
                            : "bg-white text-gray-700"
                        }`}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            type: "contemporary",
                          }))
                        }
                      >
                        Contemporary
                      </button>
                    </div>
                  </div>

                  {/* Type-specific fields */}
                  {formData.type === "hymn" ? (
                    <>
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Hymn Number*
                        </label>
                        <input
                          type="text"
                          name="number"
                          value={formData.number}
                          onChange={handleChange}
                          className="w-full border rounded-md p-2"
                          required
                        />
                      </div>

                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Hymnal
                        </label>
                        <select
                          name="hymnal"
                          value={formData.hymnal}
                          onChange={handleChange}
                          className="w-full border rounded-md p-2"
                        >
                          <option value="">Select a Hymnal</option>
                          {hymnalVersions.map((hymnal) => (
                            <option key={hymnal.id} value={hymnal.id}>
                              {hymnal.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  ) : (
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Artist/Author*
                      </label>
                      <input
                        type="text"
                        name="author"
                        value={formData.author}
                        onChange={handleChange}
                        className="w-full border rounded-md p-2"
                        required
                      />
                    </div>
                  )}
                </div>

                {/* Seasonal tags */}
                <div>
                  <h4 className="font-medium mb-2 text-gray-700">
                    Seasonal Appropriateness*
                  </h4>
                  <p className="text-sm text-gray-500 mb-2">
                    Select all appropriate seasons
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    {liturgicalSeasons.map((season) => (
                      <div
                        key={season.id}
                        className={`border rounded-md p-2 cursor-pointer ${
                          formData.seasonalTags.includes(season.id)
                            ? "border-purple-500 bg-purple-50"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                        onClick={() => handleSeasonToggle(season.id)}
                        style={{
                          borderLeftColor: season.color,
                          borderLeftWidth: "4px",
                        }}
                      >
                        <div className="font-medium">{season.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* New simplified fields */}
              <div className="mt-4">
                <h4 className="font-medium mb-2 text-gray-700">
                  Song Characteristics
                </h4>

                <div className="grid grid-cols-1 gap-4">
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tempo
                    </label>
                    <input
                      type="text"
                      name="tempo"
                      value={formData.tempo}
                      onChange={handleChange}
                      className="w-full border rounded-md p-2"
                      placeholder="e.g., Slow, solemn"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Theme
                    </label>
                    <input
                      type="text"
                      name="theme"
                      value={formData.theme}
                      onChange={handleChange}
                      className="w-full border rounded-md p-2"
                      placeholder="e.g., Christ's suffering, human sin, atonement"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Arrangement
                    </label>
                    <input
                      type="text"
                      name="arrangement"
                      value={formData.arrangement}
                      onChange={handleChange}
                      className="w-full border rounded-md p-2"
                      placeholder="e.g., Simple, reflective"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferenceSongManageModal;
