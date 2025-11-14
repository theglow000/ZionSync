import React, { useState, useRef, useCallback, useEffect } from "react";
import { Link, Youtube, ChevronDown, ChevronUp, X } from "lucide-react";
import { titleCase, spellCheckAndCorrect } from "@/lib/utils"; // Import our new utility functions

const isValidUrl = (url) => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const SongSection = ({
  slot,
  label,
  songState,
  onSongStateUpdate,
  onSongClear, // Add this new prop for clearing songs
  availableSongs,
  currentUser,
  hymnalVersions,
  isMobile = false, // Add this prop
}) => {
  // State
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [localTitle, setLocalTitle] = useState(songState.title || "");
  const [localAuthor, setLocalAuthor] = useState(songState.author || "");
  const [titleTimer, setTitleTimer] = useState(null);
  const [authorTimer, setAuthorTimer] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Use useEffect to sync the local state with props when they change externally
  useEffect(() => {
    setLocalTitle(songState.title || "");
    setLocalAuthor(songState.author || "");
  }, [songState.title, songState.author]);

  // Refs
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Derived values
  const isHymn = songState.type === "hymn";
  const isLeader = currentUser?.role === "leader";

  // Handlers
  const handleSongTypeChange = useCallback(
    (type) => {
      onSongStateUpdate(slot, {
        ...songState,
        type,
        number: type === "hymn" ? songState.number : "",
        hymnal: type === "hymn" ? songState.hymnal : "",
        author: type !== "hymn" ? songState.author : "",
      });
    },
    [slot, songState, onSongStateUpdate],
  );

  // Update handleInputChange for title and author to use delayed formatting
  const handleInputChange = useCallback(
    (field, value) => {
      if (field === "title") {
        // Update local state immediately for responsive typing
        setLocalTitle(value);

        // Clear any existing timers
        if (titleTimer) clearTimeout(titleTimer);

        // Set a new timer to apply formatting after a short delay
        const timer = setTimeout(() => {
          const formattedValue = spellCheckAndCorrect(value);
          onSongStateUpdate(slot, {
            ...songState,
            title: formattedValue,
          });
        }, 800); // 800ms delay before formatting

        setTitleTimer(timer);
      } else if (field === "author") {
        // Update local state immediately
        setLocalAuthor(value);

        // Clear any existing timers
        if (authorTimer) clearTimeout(authorTimer);

        // Set a new timer to apply formatting after a short delay
        const timer = setTimeout(() => {
          const formattedValue = titleCase(value);
          onSongStateUpdate(slot, {
            ...songState,
            author: formattedValue,
          });
        }, 800); // 800ms delay

        setAuthorTimer(timer);
      } else {
        // For other fields, update immediately without formatting
        onSongStateUpdate(slot, {
          ...songState,
          [field]: value,
        });
      }
    },
    [slot, songState, onSongStateUpdate, titleTimer, authorTimer],
  );

  const handleSuggestionSelect = useCallback(
    (suggestion) => {
      // Format the title and author using our utility functions
      const formattedTitle = spellCheckAndCorrect(suggestion.title);
      const formattedAuthor = suggestion.author
        ? titleCase(suggestion.author)
        : "";

      onSongStateUpdate(slot, {
        ...songState,
        title: formattedTitle,
        ...(isHymn
          ? {
              number: suggestion.number || "",
              hymnal: suggestion.hymnal || "",
              sheetMusic: suggestion.hymnaryLink || "",
              youtube: suggestion.youtubeLink || "",
              notes: suggestion.notes || "",
            }
          : {
              author: formattedAuthor,
              sheetMusic: suggestion.songSelectLink || "",
              youtube: suggestion.youtubeLink || "",
              notes: suggestion.notes || "",
            }),
      });
      setShowSuggestions(false);
    },
    [slot, songState, isHymn, onSongStateUpdate],
  );

  const updateSuggestions = useCallback(
    (value) => {
      if (!value || value.length < 2) {
        setSuggestions([]);
        return;
      }

      const songs = isHymn
        ? availableSongs?.hymn
        : availableSongs?.contemporary;

      if (!songs) {
        setSuggestions([]);
        return;
      }

      const matches = songs
        ?.filter(
          (song) =>
            song.title.toLowerCase().includes(value.toLowerCase()) ||
            (song.number && song.number.toString().includes(value)),
        )
        ?.slice(0, 5);

      setSuggestions(matches || []);
    },
    [isHymn, availableSongs],
  );

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Clean up timers when component unmounts
  useEffect(() => {
    return () => {
      if (titleTimer) clearTimeout(titleTimer);
      if (authorTimer) clearTimeout(authorTimer);
    };
  }, [titleTimer, authorTimer]);

  return (
    <div className="border rounded p-1.5">
      <div className="flex items-center gap-2 mb-1">
        <h4 className="font-medium text-sm text-black">{label}</h4>
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleSongTypeChange("hymn")}
            className={`px-2 py-0.5 text-xs rounded ${isHymn ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-black"}`}
          >
            Hymn
          </button>
          <button
            type="button"
            onClick={() => handleSongTypeChange("contemporary")}
            className={`px-2 py-0.5 text-xs rounded ${!isHymn ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-black"}`}
          >
            Contemporary
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        {/* Title field - always visible */}
        <div className="flex gap-1.5">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={localTitle}
              onChange={(e) => {
                handleInputChange("title", e.target.value);
                updateSuggestions(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              className="flex-1 w-full p-1 text-sm border rounded text-black placeholder:text-gray-500"
              placeholder={isHymn ? "Type hymn title..." : "Type song title..."}
              autoComplete="off"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg"
              >
                {suggestions.map((song) => (
                  <div
                    key={song._id}
                    className="px-3 py-2 cursor-pointer hover:bg-purple-50"
                    onClick={() => handleSuggestionSelect(song)}
                  >
                    <div className="text-sm text-black">
                      {song.title}
                      {song.type === "hymn" &&
                        song.number &&
                        ` (#${song.number})`}
                    </div>
                    <div className="text-xs text-gray-500">
                      {song.type === "hymn" ? song.hymnal : song.author}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Small red X button - only show when song has content */}
          {songState.title && onSongClear && (
            <button
              type="button"
              onClick={() => onSongClear(slot)}
              className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-red-600 hover:bg-red-100 rounded transition-colors"
              title="Clear this song"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* For mobile: Primary fields always visible */}
        <div className="flex gap-1.5">
          {isHymn ? (
            <>
              <input
                type="text"
                value={songState.number}
                onChange={(e) => handleInputChange("number", e.target.value)}
                placeholder="Hymn #"
                className="w-20 p-1 text-sm border rounded text-black placeholder:text-gray-500"
              />
              <select
                value={songState.hymnal}
                onChange={(e) => handleInputChange("hymnal", e.target.value)}
                className="p-1 text-sm border rounded flex-1 text-black"
              >
                <option value="" className="text-gray-500">
                  Select Hymnal
                </option>
                {hymnalVersions.map((version) => (
                  <option
                    key={version.id}
                    value={version.id}
                    className="text-black"
                  >
                    {version.name}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <input
              type="text"
              value={localAuthor}
              onChange={(e) => handleInputChange("author", e.target.value)}
              placeholder="Artist/Author"
              className="w-full p-1 text-sm border rounded text-black placeholder:text-gray-500"
            />
          )}
        </div>

        {/* Links - toggleable on mobile, always visible on desktop */}
        {isMobile ? (
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between text-xs text-purple-700 p-1 border border-purple-100 rounded bg-purple-50/30"
          >
            <span>{showDetails ? "Hide Details" : "Show Links & Notes"}</span>
            {showDetails ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
        ) : null}

        {/* Additional details - conditionally shown on mobile */}
        {(!isMobile || showDetails) && (
          <>
            <div className="flex gap-1.5">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={songState.sheetMusic}
                  onChange={(e) =>
                    handleInputChange("sheetMusic", e.target.value)
                  }
                  placeholder={isHymn ? "Hymnary.org link" : "SongSelect link"}
                  className="w-full p-1 pl-7 text-sm border rounded text-black placeholder:text-gray-500"
                />
                {isValidUrl(songState.sheetMusic) ? (
                  <a
                    href={songState.sheetMusic}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute left-2 top-1/2 -translate-y-1/2"
                  >
                    <Link
                      className={`w-4 h-4 ${
                        isHymn
                          ? "text-[#7B1416] hover:text-[#5a0f10]" // Cranberry color for Hymnary.org
                          : "text-blue-600 hover:text-blue-800" // Blue for SongSelect
                      }`}
                    />
                  </a>
                ) : (
                  <Link className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
                )}
              </div>
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={songState.youtube}
                  onChange={(e) => handleInputChange("youtube", e.target.value)}
                  placeholder="YouTube link"
                  className="w-full p-1 pl-7 text-sm border rounded text-black placeholder:text-gray-500"
                />
                {isValidUrl(songState.youtube) ? (
                  <a
                    href={songState.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute left-2 top-1/2 -translate-y-1/2"
                  >
                    <Youtube className="w-4 h-4 text-red-600 hover:text-red-700" />
                  </a>
                ) : (
                  <Youtube className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
                )}
              </div>
            </div>
            <textarea
              value={songState.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Notes (optional)"
              className="w-full p-1 text-sm border rounded text-black placeholder:text-gray-500"
              rows={isMobile ? 1 : 2}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default React.memo(SongSection);
