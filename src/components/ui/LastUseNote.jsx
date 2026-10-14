import React from "react";
import {
  findPreviousUse,
  describePreviousUse,
  verseLines,
  notesToCopy,
} from "@/lib/songHistory";

/**
 * "Last sung February 8, 2026 · 5th Sunday of Epiphany" under a song's title.
 * Computed from every service's current picks each render, so it follows
 * other teams adding or swapping songs on earlier dates.
 */
const LastUseNote = ({
  title,
  serviceSongs,
  serviceDate,
  today,
  notesEmpty,
  onCopyNotes,
}) => {
  if (!title?.trim() || !serviceSongs || !serviceDate) return null;

  const prev = findPreviousUse(serviceSongs, title, serviceDate);
  if (!prev) {
    return <p className="text-xs text-gray-500">No earlier record</p>;
  }

  const { verb, date, dayName } = describePreviousUse(prev, today);
  const verses = verseLines(prev.notes);
  const copyable = notesToCopy(prev.notes);

  return (
    <div className="text-xs text-gray-600 space-y-0.5">
      <p>
        {verb} {date}
        {dayName ? ` · ${dayName}` : ""}
      </p>
      {verses.length > 0 && <p>Last time: {verses.join("; ")}</p>}
      {notesEmpty && copyable && (
        <button
          type="button"
          onClick={() => onCopyNotes(copyable)}
          className="text-purple-700 underline"
        >
          Copy last time&apos;s notes
        </button>
      )}
    </div>
  );
};

export default LastUseNote;
