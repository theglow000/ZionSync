// Debugging script to check song autocomplete functionality
import React, { useState, useEffect } from "react";

const SongAutocompleteDebugger = () => {
  const [availableSongs, setAvailableSongs] = useState({
    hymn: [],
    contemporary: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        console.log("🔍 Fetching songs from /api/songs...");
        const response = await fetch("/api/songs");

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const songs = await response.json();
        console.log("📊 Songs fetched:", songs.length);
        console.log("📝 First 3 songs:", songs.slice(0, 3));

        const hymns = songs.filter((song) => song.type === "hymn");
        const contemporary = songs.filter(
          (song) => song.type === "contemporary",
        );

        console.log(
          `📈 Breakdown: ${hymns.length} hymns, ${contemporary.length} contemporary`,
        );

        setAvailableSongs({
          hymn: hymns,
          contemporary: contemporary,
        });

        setLoading(false);
      } catch (error) {
        console.error("❌ Error loading songs:", error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchSongs();
  }, []);

  if (loading) return <div>Loading songs...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ padding: "20px", fontFamily: "monospace" }}>
      <h2>🎵 Song Autocomplete Debugger</h2>
      <p>
        <strong>Total Songs:</strong>{" "}
        {availableSongs.hymn.length + availableSongs.contemporary.length}
      </p>
      <p>
        <strong>Hymns:</strong> {availableSongs.hymn.length}
      </p>
      <p>
        <strong>Contemporary:</strong> {availableSongs.contemporary.length}
      </p>

      <h3>Sample Hymns:</h3>
      <ul>
        {availableSongs.hymn.slice(0, 5).map((song) => (
          <li key={song._id}>
            {song.title} #{song.number} ({song.hymnal})
          </li>
        ))}
      </ul>

      <h3>Sample Contemporary:</h3>
      <ul>
        {availableSongs.contemporary.slice(0, 5).map((song) => (
          <li key={song._id}>
            {song.title} - {song.author}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SongAutocompleteDebugger;
