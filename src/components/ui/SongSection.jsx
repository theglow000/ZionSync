import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Link, Youtube } from 'lucide-react';

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
  availableSongs,
  currentUser,
  hymnalVersions
}) => {

  // State
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Refs
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Derived values
  const isHymn = songState.type === 'hymn';
  const isLeader = currentUser?.role === 'leader';

  // Handlers
  const handleSongTypeChange = useCallback((type) => {
    onSongStateUpdate(slot, {
      ...songState,
      type,
      number: type === 'hymn' ? songState.number : '',
      hymnal: type === 'hymn' ? songState.hymnal : '',
      author: type !== 'hymn' ? songState.author : ''
    });
  }, [slot, songState, onSongStateUpdate]);

  const handleInputChange = useCallback((field, value) => {
    onSongStateUpdate(slot, {
      ...songState,
      [field]: value
    });
  }, [slot, songState, onSongStateUpdate]);

  const handleSuggestionSelect = useCallback((suggestion) => {
    onSongStateUpdate(slot, {
      ...songState,
      title: suggestion.title,
      ...(isHymn ? {
        number: suggestion.number || '',
        hymnal: suggestion.hymnal || '',
        sheetMusic: suggestion.hymnaryLink || '',
        youtube: suggestion.youtubeLink || '',
        notes: suggestion.notes || ''
      } : {
        author: suggestion.author || '',
        sheetMusic: suggestion.songSelectLink || '',
        youtube: suggestion.youtubeLink || '',
        notes: suggestion.notes || ''
      })
    });
    setShowSuggestions(false);
  }, [slot, songState, isHymn, onSongStateUpdate]);

  const updateSuggestions = useCallback((value) => {
    if (!value || value.length < 2) {
      setSuggestions([]);
      return;
    }

    const songs = isHymn ? availableSongs?.hymn : availableSongs?.contemporary;
    if (!songs) { // Add this check
      setSuggestions([]);
      return;
    }

    const matches = songs
      ?.filter(song =>
        song.title.toLowerCase().includes(value.toLowerCase()) ||
        (song.number && song.number.toString().includes(value))
      )
      ?.slice(0, 5);

    setSuggestions(matches || []);
  }, [isHymn, availableSongs]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="border rounded p-1.5">
      <div className="flex items-center gap-2 mb-1">
        <h4 className="font-medium text-sm text-black">{label}</h4>
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleSongTypeChange('hymn')}
            className={`px-2 py-0.5 text-xs rounded ${isHymn ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-black'}`}
          >
            Hymn
          </button>
          <button
            type="button"
            onClick={() => handleSongTypeChange('contemporary')}
            className={`px-2 py-0.5 text-xs rounded ${!isHymn ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-black'}`}
          >
            Contemporary
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex gap-1.5">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={songState.title}
              onChange={(e) => {
                handleInputChange('title', e.target.value);
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
                      {song.type === 'hymn' && song.number && ` (#${song.number})`}
                    </div>
                    <div className="text-xs text-gray-500">
                      {song.type === 'hymn' ? song.hymnal : song.author}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {isHymn && (
          <div className="flex gap-1.5">
            <input
              type="text"
              value={songState.number}
              onChange={(e) => handleInputChange('number', e.target.value)}
              placeholder="Hymn #"
              className="w-20 p-1 text-sm border rounded text-black placeholder:text-gray-500"
            />
            <select
              value={songState.hymnal}
              onChange={(e) => handleInputChange('hymnal', e.target.value)}
              className="p-1 text-sm border rounded flex-1 text-black"
            >
              <option value="" className="text-gray-500">Select Hymnal</option>
              {hymnalVersions.map(version => (
                <option key={version.id} value={version.id} className="text-black">
                  {version.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {!isHymn && (
          <input
            type="text"
            value={songState.author}
            onChange={(e) => handleInputChange('author', e.target.value)}
            placeholder="Artist/Author"
            className="w-full p-1 text-sm border rounded text-black placeholder:text-gray-500"
          />
        )}

        <div className="flex gap-1.5">
          <div className="flex-1 relative">
            <input
              type="text"
              value={songState.sheetMusic}
              onChange={(e) => handleInputChange('sheetMusic', e.target.value)}
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
                      ? 'text-[#7B1416] hover:text-[#5a0f10]' // Cranberry color for Hymnary.org
                      : 'text-blue-600 hover:text-blue-800'    // Blue for SongSelect
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
              onChange={(e) => handleInputChange('youtube', e.target.value)}
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
          onChange={(e) => handleInputChange('notes', e.target.value)}
          placeholder="Notes (optional)"
          className="w-full p-1 text-sm border rounded text-black placeholder:text-gray-500"
          rows={2}
        />
      </div>
    </div>
  );
};

export default React.memo(SongSection);