/**
 * SongSuggestionEngine.js
 *
 * This engine powers the song rediscovery panel by:
 * - Suggesting songs that haven't been used recently
 * - Prioritizing songs appropriate for the current liturgical season
 * - Ensuring variety in recommendations
 * - Balancing hymns and contemporary music
 */

import { LITURGICAL_SEASONS } from "./LiturgicalSeasons.js";
import { getLiturgicalInfo } from "./LiturgicalCalendarService.js";

// How many songs to keep in the "recently suggested" memory
const SUGGESTION_HISTORY_SIZE = 20;

// How many times a song must be suggested before we reduce its priority
const SUGGESTION_FREQUENCY_THRESHOLD = 3;

// How many days before a season transition to start showing upcoming season songs
const UPCOMING_SEASON_THRESHOLD_DAYS = 30;

class SongSuggestionEngine {
  constructor() {
    // Keep track of recently suggested songs to avoid repetition
    this.recentSuggestions = new Set();

    // Track suggestion frequency to ensure variety
    this.suggestionFrequency = {};

    // Track suggestion history by season
    this.seasonalSuggestions = {};

    // Last refresh time for suggestions
    this.lastRefreshTime = null;

    // Refresh interval (in hours)
    this.refreshInterval = 24; // Refresh suggestions daily
  }

  /**
   * Get song suggestions based on various criteria
   *
   * @param {Object} options - Configuration options
   * @param {Array} options.allSongs - All songs in the library
   * @param {Object} options.usageData - Song usage data from analytics
   * @param {string} options.currentDate - Current date string (MM/DD/YY)
   * @param {string} options.seasonId - Optional specific season to filter for
   * @param {number} options.unusedMonths - How many months of non-usage to consider "forgotten"
   * @param {string} options.type - Filter by song type: 'all', 'hymn', 'contemporary'
   * @param {boolean} options.balanceTypes - Whether to balance hymns and contemporary songs
   * @param {number} options.limit - Maximum number of suggestions to return
   * @param {boolean} options.forceRefresh - Force refresh of suggestions
   * @returns {Promise<Array>} - Array of suggested songs
   */
  async getSuggestions({
    allSongs = [],
    usageData = { frequency: [] },
    currentDate = new Date().toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "2-digit",
    }),
    seasonId = null,
    unusedMonths = 6,
    type = "all",
    balanceTypes = true,
    limit = 10,
    forceRefresh = false,
  } = {}) {
    try {
      // Check if we need to refresh suggestions
      const now = new Date();
      const shouldRefresh =
        forceRefresh ||
        !this.lastRefreshTime ||
        (now - this.lastRefreshTime) / (1000 * 60 * 60) > this.refreshInterval;

      // If we have cached suggestions and don't need to refresh, return those
      if (
        !shouldRefresh &&
        this.cachedSuggestions &&
        this.cachedSuggestions.length > 0
      ) {
        return this.filterCachedSuggestions(this.cachedSuggestions, {
          type,
          limit,
        });
      }

      // Get liturgical information if not provided
      let currentSeason = seasonId;
      let upcomingSeason = null;
      let daysToNextSeason = null;

      if (!currentSeason) {
        const liturgicalInfo = await getLiturgicalInfo(currentDate);
        currentSeason = liturgicalInfo.season;

        // Check if we're within threshold days of a season change
        if (
          liturgicalInfo.daysToNextSeason &&
          liturgicalInfo.daysToNextSeason <= UPCOMING_SEASON_THRESHOLD_DAYS
        ) {
          upcomingSeason = liturgicalInfo.nextSeason;
          daysToNextSeason = liturgicalInfo.daysToNextSeason;
        }
      }

      // Filter songs by type if specified
      let eligibleSongs = [...allSongs];
      if (type !== "all") {
        eligibleSongs = eligibleSongs.filter((song) => song.type === type);
      }

      // Create usage lookup for faster access
      const usageLookup = {};
      usageData.frequency.forEach((item) => {
        usageLookup[item.title] = {
          count: item.count || 0,
          lastUsed: item.lastUsed || null,
        };
      });

      // Score and sort songs based on multiple factors
      const songScores = this.scoreSongs(eligibleSongs, {
        usageLookup,
        currentSeason,
        upcomingSeason,
        daysToNextSeason,
        unusedMonths,
      });

      // Sort songs by score (descending)
      const sortedSongs = Object.keys(songScores)
        .sort((a, b) => songScores[b] - songScores[a])
        .map((id) => eligibleSongs.find((song) => song._id === id))
        .filter(Boolean); // Remove any undefined entries

      // Apply variety algorithm
      const variedSongs = this.applyVarietyAlgorithm(sortedSongs);

      // Balance song types if requested
      let suggestedSongs = balanceTypes
        ? this.balanceSongTypes(variedSongs, limit)
        : variedSongs.slice(0, limit);

      // Add liturgical context to each song
      suggestedSongs = suggestedSongs.map((song) => {
        return {
          ...song,
          liturgicalContext: this.getLiturgicalContext(song, {
            usageLookup,
            currentSeason,
            upcomingSeason,
            daysToNextSeason,
          }),
        };
      });

      // Update suggestion tracking
      this.recordSuggestions(suggestedSongs, currentSeason);

      // Cache suggestions
      this.cachedSuggestions = suggestedSongs;
      this.lastRefreshTime = now;

      return suggestedSongs;
    } catch (error) {
      console.error("Error generating song suggestions:", error);
      return [];
    }
  }

  /**
   * Score songs based on various factors with adaptive seasonal time windows
   *
   * @param {Array} songs - Songs to score
   * @param {Object} options - Scoring options
   * @returns {Object} - Map of song IDs to scores
   */
  scoreSongs(
    songs,
    {
      usageLookup,
      currentSeason,
      upcomingSeason,
      daysToNextSeason,
      unusedMonths,
    },
  ) {
    const scores = {};
    const now = new Date();

    // Get current year
    const currentYear = now.getFullYear();

    songs.forEach((song) => {
      let score = 0;
      const usage = usageLookup[song.title];

      // Factor 1: Usage recency and frequency with seasonal awareness
      if (!usage || usage.count === 0) {
        // Never used songs get high priority
        score += 100;
      } else if (usage.lastUsed) {
        const lastUsed = new Date(usage.lastUsed);
        const lastUsedYear = lastUsed.getFullYear();

        // Calculate months since last usage
        const monthsAgo =
          (now.getFullYear() - lastUsed.getFullYear()) * 12 +
          (now.getMonth() - lastUsed.getMonth());

        // Check if this is a seasonal song
        const isSeasonal = song.seasonalTags && song.seasonalTags.length > 0;

        if (isSeasonal) {
          // Handle seasonal songs with seasonal time windows

          // Check if song matches current season
          const isCurrentSeasonSong =
            currentSeason &&
            song.seasonalTags.some((tag) => {
              const seasonName =
                typeof currentSeason === "string"
                  ? currentSeason
                  : currentSeason.name || currentSeason.seasonName || "";
              return tag.toLowerCase() === seasonName.toLowerCase();
            });

          if (isCurrentSeasonSong) {
            // For current season songs, we care about usage since last year's same season
            const lastSeasonStart = this.getLastSeasonStart(currentSeason);

            if (lastUsed < lastSeasonStart) {
              // Not used since last year's same season - very high priority
              score += 95;
              song.notUsedInCurrentSeason = true;
            } else {
              // Used this season - moderate priority based on recency
              score += Math.min(60, monthsAgo * 8);
            }
          } else if (
            upcomingSeason &&
            song.seasonalTags.some((tag) => {
              const seasonName =
                typeof upcomingSeason === "string"
                  ? upcomingSeason
                  : upcomingSeason.name || upcomingSeason.seasonName || "";
              return tag.toLowerCase() === seasonName.toLowerCase();
            })
          ) {
            // Upcoming season song - priority based on how close the season is
            const urgencyBoost = Math.min(
              50,
              (UPCOMING_SEASON_THRESHOLD_DAYS - daysToNextSeason) * 1.5,
            );
            score += 50 + urgencyBoost;
            song.isUpcomingSeasonSong = true;
          } else {
            // Other seasonal song - use standard recency
            if (monthsAgo >= unusedMonths) {
              score += 70;
            } else {
              score += Math.min(50, monthsAgo * 7);
            }
          }
        } else {
          // Non-seasonal song: standard recency calculation
          if (monthsAgo >= unusedMonths) {
            score += 75;
          } else {
            score += Math.min(65, monthsAgo * 9);
          }
        }

        // Penalize frequently used songs (applies to all song types)
        score -= Math.min(35, usage.count * 6);
      }

      // Factor 2: Seasonal appropriateness
      if (song.seasonalTags && song.seasonalTags.length > 0) {
        // Strongly boost songs matching current season
        if (
          currentSeason &&
          song.seasonalTags.some((tag) => {
            const seasonName =
              typeof currentSeason === "string"
                ? currentSeason
                : currentSeason.name || currentSeason.seasonName || "";
            return tag.toLowerCase() === seasonName.toLowerCase();
          })
        ) {
          score += 45;
          song.matchesCurrentSeason = true;
        }

        // Boost songs matching upcoming season based on how soon it's arriving
        if (
          upcomingSeason &&
          song.seasonalTags.some((tag) => {
            const seasonName =
              typeof upcomingSeason === "string"
                ? upcomingSeason
                : upcomingSeason.name || upcomingSeason.seasonName || "";
            return tag.toLowerCase() === seasonName.toLowerCase();
          })
        ) {
          const urgencyBoost = Math.min(
            45,
            (UPCOMING_SEASON_THRESHOLD_DAYS - daysToNextSeason) * 1.5,
          );
          score += urgencyBoost;
          song.matchesUpcomingSeason = true;
          song.daysToSeason = daysToNextSeason;
        }
      } else {
        // Slight penalty for songs without seasonal tags
        score -= 15;
      }

      // Factor 3: Variety (avoid recently suggested songs)
      if (this.recentSuggestions.has(song._id)) {
        score -= 40;
      }

      // Factor 4: Suggestion frequency
      const suggestionCount = this.suggestionFrequency[song._id] || 0;
      if (suggestionCount > SUGGESTION_FREQUENCY_THRESHOLD) {
        score -= (suggestionCount - SUGGESTION_FREQUENCY_THRESHOLD) * 15;
      }

      scores[song._id] = score;
    });

    return scores;
  }

  /**
   * Get the approximate start date of the previous occurrence of a season
   *
   * @param {string} season - Season identifier
   * @returns {Date} - Approximate start date of the last occurrence
   */
  getLastSeasonStart(season) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Map seasons to approximate month ranges (simplified)
    const seasonStartMonths = {
      advent: 11, // December
      christmas: 0, // January
      epiphany: 1, // February
      lent: 2, // March
      easter: 3, // April
      pentecost: 5, // June
      ordinary: 8, // September
    };

    const seasonMonth = seasonStartMonths[season.toLowerCase()] || 0;
    const lastStart = new Date(currentYear, seasonMonth, 1); // First day of the month

    // If we're currently in or past this season's typical month,
    // then the last occurrence was this year
    if (seasonMonth <= currentMonth) {
      // We're in or after this season in the current year
      return lastStart;
    } else {
      // We're before this season in the current year, so last occurrence was last year
      return new Date(currentYear - 1, seasonMonth, 1);
    }
  }

  /**
   * Get liturgical context for a song to display in the UI
   *
   * @param {Object} song - Song object
   * @param {Object} options - Context options
   * @returns {Object} - Liturgical context information
   */
  getLiturgicalContext(
    song,
    { usageLookup, currentSeason, upcomingSeason, daysToNextSeason },
  ) {
    const context = {
      isSeasonSong: false,
      seasonMatches: [],
      upcomingSeason: null,
      daysToSeason: null,
      lastUsed: null,
      usageCount: 0,
    };

    // Add usage information
    const usage = usageLookup[song.title];
    if (usage) {
      context.lastUsed = usage.lastUsed;
      context.usageCount = usage.count || 0;

      if (usage.lastUsed) {
        const lastUsed = new Date(usage.lastUsed);
        const now = new Date();
        context.monthsSinceLastUsed =
          (now.getFullYear() - lastUsed.getFullYear()) * 12 +
          (now.getMonth() - lastUsed.getMonth());
      }
    }

    // Add seasonal information
    if (song.seasonalTags && song.seasonalTags.length > 0) {
      context.isSeasonSong = true;

      // Check for current season match
      if (currentSeason) {
        const currentSeasonMatch = song.seasonalTags.some((tag) => {
          const seasonName =
            typeof currentSeason === "string"
              ? currentSeason
              : currentSeason.name || currentSeason.seasonName || "";
          return tag.toLowerCase() === seasonName.toLowerCase();
        });

        if (currentSeasonMatch) {
          context.seasonMatches.push({
            season: currentSeason,
            isCurrent: true,
            name: this.getSeasonName(currentSeason),
          });
        }
      }

      // Check for upcoming season match
      if (upcomingSeason) {
        const upcomingSeasonMatch = song.seasonalTags.some((tag) => {
          const seasonName =
            typeof upcomingSeason === "string"
              ? upcomingSeason
              : upcomingSeason.name || upcomingSeason.seasonName || "";
          return tag.toLowerCase() === seasonName.toLowerCase();
        });

        if (upcomingSeasonMatch) {
          context.upcomingSeason = {
            season: upcomingSeason,
            name: this.getSeasonName(upcomingSeason),
            daysUntil: daysToNextSeason,
          };
        }
      }

      // Add all matching seasons
      song.seasonalTags.forEach((tag) => {
        if (
          !context.seasonMatches.some(
            (match) => match.season.toLowerCase() === tag.toLowerCase(),
          )
        ) {
          context.seasonMatches.push({
            season: tag,
            isCurrent: false,
            name: this.getSeasonName(tag),
          });
        }
      });
    }

    return context;
  }

  /**
   * Get user-friendly season name
   *
   * @param {string} seasonId - Season identifier
   * @returns {string} - Formatted season name
   */
  getSeasonName(seasonId) {
    if (!seasonId) return "Ordinary Time";

    const season = Object.entries(LITURGICAL_SEASONS).find(
      ([key]) => key.toLowerCase() === seasonId.toLowerCase(),
    );

    return season ? season[1].name : seasonId;
  }

  // Existing methods remain unchanged
  applyVarietyAlgorithm(sortedSongs) {
    /* unchanged */
  }
  balanceSongTypes(songs, limit) {
    /* unchanged */
  }
  recordSuggestions(songs, season) {
    /* unchanged */
  }
  filterCachedSuggestions(suggestions, { type, limit }) {
    /* unchanged */
  }
  resetSuggestions() {
    /* unchanged */
  }
}

// Create and export a default instance
const songSuggestionEngine = new SongSuggestionEngine();
export default songSuggestionEngine;

// Also export the class for testing or custom instances
export { SongSuggestionEngine };
