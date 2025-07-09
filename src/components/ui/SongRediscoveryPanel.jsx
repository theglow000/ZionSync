import React, { useState, useEffect, useRef } from 'react';
import {
  Search, RefreshCw, Music, Calendar, PlusCircle, Info,
  ChevronDown, ChevronUp, X as XIcon, Clock, BarChart2, 
  Filter, CheckCircle, ExternalLink, AlertCircle
} from 'lucide-react';
import { LITURGICAL_SEASONS } from '@/lib/LiturgicalSeasons.js';
import { getLiturgicalInfo } from '@/lib/LiturgicalCalendarService';

const SongRediscoveryPanel = () => {
  // State for songs
  const [songs, setSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usageAnalytics, setUsageAnalytics] = useState({ frequency: [] });
  
  // Filter state
  const [selectedSeason, setSelectedSeason] = useState("all");
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [timeframeFilter, setTimeframeFilter] = useState('all');
  
  // UI state
  const [expandedSections, setExpandedSections] = useState({
    unused: true,
    seasonal: true,
    suggestions: true,
    upcoming: true
  });
  const [upcomingServices, setUpcomingServices] = useState([]);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [loadingServices, setLoadingServices] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: 'info' });
  const [currentSeason, setCurrentSeason] = useState(null);
  const [isAddingSong, setIsAddingSong] = useState(false);
  
  // Add a new state for intelligent suggestions
  const [intelligentSuggestions, setIntelligentSuggestions] = useState([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState(null);
  
  // Add state for position selection
  const [selectedPosition, setSelectedPosition] = useState('general');
  
  // Ref to track first load
  const firstLoad = useRef(true);
  
  // Load songs and usage data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch songs from your API
        const songsResponse = await fetch('/api/songs');
        if (!songsResponse.ok) throw new Error('Failed to fetch songs');
        const songsData = await songsResponse.json();
        
        // Get song usage data directly from the songs API response
        // This replaces the separate analytics API call that was removed
        const usageData = { 
          frequency: songsData.songs
            ? songsData.songs.map(song => ({
                title: song.title,
                type: song.type || 'unknown',
                count: song.usageCount || 0,
                lastUsed: song.lastUsed || null
              }))
            : [] 
        };

        setSongs(songsData.songs || []);
        setUsageAnalytics(usageData);
      } catch (err) {
        setError(err.message);
        console.error('Error loading data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Load current liturgical season
  useEffect(() => {
    const fetchCurrentSeason = async () => {
      try {
        // Get today's date in MM/DD/YY format
        const today = new Date();
        const formattedDate = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear() % 100}`;
        
        // Get liturgical info for today
        const liturgicalInfo = await getLiturgicalInfo(formattedDate);
        
        // Handle season data based on its type
        if (liturgicalInfo && liturgicalInfo.season) {
          let seasonKey;
          
          // Handle the season based on what type it is
          if (typeof liturgicalInfo.season === 'string') {
            // If it's already a string, use it directly
            seasonKey = liturgicalInfo.season;
          } else {
            // If it's an object reference, find its key in LITURGICAL_SEASONS
            seasonKey = Object.keys(LITURGICAL_SEASONS).find(
              key => LITURGICAL_SEASONS[key] === liturgicalInfo.season
            ) || 'ordinary';
          }
          
          console.log("Determined season key:", seasonKey);
          setCurrentSeason(seasonKey);
          
          // Only set the season on initial load, not when user has made a selection
          if (firstLoad.current) {
            setSelectedSeason(seasonKey.toLowerCase());
            firstLoad.current = false;
          }
        }
      } catch (err) {
        console.error('Error getting current liturgical season:', err);
      }
    };
    
    fetchCurrentSeason();
  }, []);
  
  // Fetch intelligent suggestions
  const fetchIntelligentSuggestions = async () => {
    try {
      setIsSuggestionsLoading(true);
      setSuggestionsError(null);
      
      // Build query parameters based on current filters
      const params = new URLSearchParams({
        limit: 10,
        unusedMonths: 6,
        type: filterType,
        refresh: 'true'
      });
      
      if (selectedSeason && selectedSeason !== "all") {
        params.append('season', selectedSeason);
      }
      
      const response = await fetch(`/api/song-usage/suggestions?${params}`);
      if (!response.ok) throw new Error('Failed to fetch suggestions');
      
      const data = await response.json();
      setIntelligentSuggestions(data.suggestions || []);
    } catch (err) {
      console.error('Error fetching intelligent suggestions:', err);
      setSuggestionsError(err.message);
    } finally {
      setIsSuggestionsLoading(false);
    }
  };
  
  // Call this when the component loads and when filters change
  useEffect(() => {
    fetchIntelligentSuggestions();
  }, [filterType, selectedSeason]);
  
  // Get upcoming services for the modal
  const fetchUpcomingServices = async () => {
    try {
      setLoadingServices(true);
      
      // Fetch upcoming services with their full details
      const response = await fetch('/api/upcoming-services?limit=8');
      
      if (!response.ok) {
        throw new Error('Failed to fetch upcoming services');
      }
      
      const data = await response.json();
      
      // Add additional information needed for display and selection
      const enhancedServices = data.services.map(service => {
        // Identify song positions that need to be filled
        const songPositions = service.elements
          ?.filter(element => element.type === 'song_hymn')
          .map((element, index) => {
            // Extract label from content
            const label = element.content?.split(':')[0]?.trim() || `Song ${index + 1}`;
            
            // Check if this position already has a song
            const hasSelection = !!element.selection;
            
            return {
              id: `song_${index}`,
              label,
              hasSelection,
              selectionDetails: element.selection ? {
                title: element.selection.title,
                type: element.selection.type,
                number: element.selection.number,
                hymnal: element.selection.hymnal,
                author: element.selection.author
              } : null
            };
          }) || [];
        
        // Get service type display name
        let serviceTypeDisplay = 'Sunday Service';
        if (service.type) {
          serviceTypeDisplay = service.type === 'communion' ? 'Communion' :
                             service.type === 'communion_potluck' ? 'Communion & Potluck' :
                             service.type === 'no_communion' ? 'No Communion' : 'Custom Service';
        }
        
        return {
          ...service,
          songPositions,
          serviceTypeDisplay
        };
      });
      
      setUpcomingServices(enhancedServices);
    } catch (err) {
      console.error('Error fetching upcoming services:', err);
      setAlert({
        show: true,
        message: 'Failed to load upcoming services',
        type: 'error'
      });
    } finally {
      setLoadingServices(false);
    }
  };
  
  // Handle opening the service selection modal
  const handleAddToService = (song) => {
    setSelectedSong(song);
    fetchUpcomingServices();
    setShowServiceModal(true);
  };
  
  // Filter songs based on selected criteria
  const getFilteredSongs = () => {
    return songs.filter(song => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (song.author && song.author.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Type filter
      const matchesType = filterType === 'all' || song.type === filterType;
      
      // Season filter - Fixed to handle "all" value
      const matchesSeason = selectedSeason === 'all' || 
        (song.seasonalTags && song.seasonalTags.some(tag => 
          tag.toLowerCase() === selectedSeason.toLowerCase()
        ));
      
      // Timeframe filter - using the analytics data
      let matchesTimeframe = true;
      if (timeframeFilter !== 'all') {
        const usageInfo = usageAnalytics.frequency.find(u => u.title === song.title);
        const hasBeenUsed = usageInfo && usageInfo.count > 0;
        
        if (timeframeFilter === 'unused' && hasBeenUsed) {
          matchesTimeframe = false;
        } else if (timeframeFilter === 'used-once' && (!hasBeenUsed || (usageInfo && usageInfo.count > 1))) {
          matchesTimeframe = false;
        }
      }
      
      return matchesSearch && matchesType && matchesSeason && matchesTimeframe;
    });
  };
  
  // Group songs by category for the rediscovery panels
  const getCategorizedSongs = () => {
    const filteredSongs = getFilteredSongs();
    
    // Get unused or rarely used songs
    const songUsage = {};
    usageAnalytics.frequency.forEach(item => {
      songUsage[item.title] = item.count || 0;
    });
    
    // Songs with no usage or used only once
    const unusedSongs = filteredSongs.filter(song => !songUsage[song.title] || songUsage[song.title] === 0);
    const rarelyUsedSongs = filteredSongs.filter(song => songUsage[song.title] === 1);
    
    // Get songs matching the current or upcoming liturgical season
    const seasonalSongs = {};
    
    // Add current season first if available
    if (currentSeason) {
      // Derive the season ID safely
      const currentSeasonId = typeof currentSeason === 'string' 
        ? currentSeason.toLowerCase() 
        : 'ordinary';
        
      seasonalSongs[currentSeasonId] = filteredSongs.filter(song => 
        song.seasonalTags && song.seasonalTags.some(tag => 
          tag.toLowerCase() === currentSeasonId.toLowerCase()
        )
      );
    }
    
    // Then add other seasons
    filteredSongs.forEach(song => {
      if (song.seasonalTags && song.seasonalTags.length > 0) {
        song.seasonalTags.forEach(tag => {
          // Skip if this is the current season (already added)
          if (currentSeason) {
            const currentSeasonId = typeof currentSeason === 'string' 
              ? currentSeason.toLowerCase() 
              : 'ordinary';
              
            // When checking if a tag matches the current season
            if (tag.toLowerCase() === currentSeasonId.toLowerCase()) {
              return;
            }
          }
          
          if (!seasonalSongs[tag]) {
            seasonalSongs[tag] = [];
          }
          if (!seasonalSongs[tag].includes(song)) {
            seasonalSongs[tag].push(song);
          }
        });
      } else {
        // Songs with no seasonal tags
        if (!seasonalSongs['untagged']) {
          seasonalSongs['untagged'] = [];
        }
        if (!seasonalSongs['untagged'].includes(song)) {
          seasonalSongs['untagged'].push(song);
        }
      }
    });
    
    return {
      unused: unusedSongs,
      rarelyUsed: rarelyUsedSongs,
      seasonal: seasonalSongs
    };
  };
  
  // Add this function to the component to check if we're approaching a season change
  const getUpcomingSeasonInfo = () => {
    if (!intelligentSuggestions || intelligentSuggestions.length === 0) return null;
    
    // Find suggestions that mention upcoming season
    const upcomingSuggestion = intelligentSuggestions.find(
      song => song.liturgicalContext?.upcomingSeason
    );
    
    if (upcomingSuggestion?.liturgicalContext?.upcomingSeason) {
      return {
        season: upcomingSuggestion.liturgicalContext.upcomingSeason.season,
        name: upcomingSuggestion.liturgicalContext.upcomingSeason.name,
        daysUntil: upcomingSuggestion.liturgicalContext.upcomingSeason.daysUntil,
        songs: intelligentSuggestions.filter(song => 
          song.liturgicalContext?.upcomingSeason?.season === 
          upcomingSuggestion.liturgicalContext.upcomingSeason.season
        )
      };
    }
    
    return null;
  };
  
  // Toggle expanded sections
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  // Format song information based on type
  const formatSongInfo = (song) => {
    if (song.type === 'hymn') {
      return song.number ? `#${song.number} ${song.hymnal ? `(${song.hymnal})` : ''}` : '';
    } else {
      return song.author || '';
    }
  };
  
  // Get song usage count from analytics
  const getSongUsageCount = (songTitle) => {
    const usage = usageAnalytics.frequency.find(item => item.title === songTitle);
    return usage ? usage.count : 0;
  };
  
  // Get seasonally appropriate label
  const getSeasonName = (seasonId) => {
    const season = Object.entries(LITURGICAL_SEASONS).find(([key, season]) => 
      key.toLowerCase() === seasonId.toLowerCase()
    );
    return season ? season[1].name : seasonId;
  };
  
  const addSongToService = async () => {
    if (!selectedSong || !selectedService) return;
    
    try {
      setIsAddingSong(true);
      
      // Use the exact same approach as ReferenceSongPanel for adding songs
      const response = await fetch('/api/reference-songs/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          referenceSongId: selectedSong._id,
          serviceDate: selectedService.date,
          position: selectedPosition,
          songData: {
            type: selectedSong.type,
            title: selectedSong.title,
            number: selectedSong.number || '',
            hymnal: selectedSong.hymnal || '',
            author: selectedSong.author || '',
            sheetMusic: selectedSong.type === 'hymn' 
                       ? selectedSong.hymnaryLink 
                       : selectedSong.songSelectLink,
            youtube: selectedSong.youtubeLink || '',
            notes: `Added from Song Rediscovery panel. ${selectedSong.notes || ''}`
          }
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to add song: ${response.statusText}`);
      }
      
      // Success handling
      setAlert({
        show: true,
        message: `Added "${selectedSong.title}" to service on ${selectedService.date}`,
        type: 'success'
      });
      
      // Note: Usage analytics are automatically updated when songs are added
      // The current architecture uses specialized endpoints rather than generic analytics
      
    } catch (error) {
      console.error('Error adding song to service:', error);
      setAlert({
        show: true,
        message: `Error adding song: ${error.message}`,
        type: 'error'
      });
    } finally {
      setIsAddingSong(false);
      setShowServiceModal(false);
      setSelectedSong(null);
      setSelectedService(null);
    }
  };
  
  const categorizedSongs = getCategorizedSongs();
  
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header section with title and filters */}
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Song Rediscovery</h2>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {/* Search box */}
          <div className="flex-grow min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search by title or author..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 p-2 w-full border rounded"
              />
            </div>
          </div>
          
          {/* Season filter */}
          <select
            value={selectedSeason || "all"}
            onChange={(e) => setSelectedSeason(e.target.value)}
            className="p-2 border rounded min-w-[120px]"
          >
            <option value="all">All Seasons</option>
            <option value="advent">Advent</option>
            <option value="christmas">Christmas</option>
            <option value="epiphany">Epiphany</option>
            <option value="lent">Lent</option>
            <option value="easter">Easter</option>
            <option value="pentecost">Pentecost</option>
            <option value="ordinary">Ordinary Time</option>
          </select>
          
          {/* Type filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="p-2 border rounded min-w-[120px]"
          >
            <option value="all">All Types</option>
            <option value="hymn">Hymns Only</option>
            <option value="contemporary">Contemporary Only</option>
          </select>
          
          {/* Usage filter */}
          <select
            value={timeframeFilter}
            onChange={(e) => setTimeframeFilter(e.target.value)}
            className="p-2 border rounded min-w-[120px]"
          >
            <option value="all">All Songs</option>
            <option value="unused">Never Used</option>
            <option value="used-once">Used Only Once</option>
          </select>
        </div>
        
        <div className="text-xs text-gray-500">
          {isLoading ? (
            <span>Loading songs...</span>
          ) : (
            <span>{getFilteredSongs().length} songs found</span>
          )}
        </div>
      </div>
      
      {/* Main content area with song lists */}
      <div className="p-4 overflow-y-auto flex-grow">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <RefreshCw className="w-6 h-6 text-purple-600 animate-spin" />
            <span className="ml-2 text-gray-600">Loading songs...</span>
          </div>
        ) : error ? (
          <div className="text-center p-6 text-red-500">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p>Error: {error}</p>
          </div>
        ) : getFilteredSongs().length === 0 ? (
          <div className="text-center p-6 text-gray-500">
            <Music className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>No songs found matching your criteria.</p>
            <p className="text-sm mt-1">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Intelligent Suggestions Section */}
            <div className="border rounded-md overflow-hidden mb-6">
              <div 
                className="flex justify-between items-center p-3 bg-green-50 border-b cursor-pointer"
                onClick={() => toggleSection('suggestions')}
              >
                <div className="flex items-center">
                  <h3 className="font-medium text-green-800">Intelligent Suggestions</h3>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      fetchIntelligentSuggestions();
                    }}
                    className="ml-2 p-1 rounded-full hover:bg-green-100"
                    title="Refresh suggestions"
                  >
                    <RefreshCw className="w-4 h-4 text-green-600" />
                  </button>
                </div>
                {expandedSections.suggestions ? (
                  <ChevronUp className="w-5 h-5 text-green-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-green-500" />
                )}
              </div>
              
              {expandedSections.suggestions && (
                <div className="p-2">
                  {isSuggestionsLoading ? (
                    <div className="flex justify-center items-center h-24">
                      <RefreshCw className="w-5 h-5 text-green-600 animate-spin" />
                      <span className="ml-2 text-gray-600">Loading suggestions...</span>
                    </div>
                  ) : suggestionsError ? (
                    <div className="text-center p-4 text-red-500">
                      <p>Error: {suggestionsError}</p>
                    </div>
                  ) : intelligentSuggestions.length === 0 ? (
                    <div className="text-center p-4 text-gray-500">
                      <p>No suggestions available.</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-gray-500 mb-2 px-2">
                        These suggestions prioritize seasonal appropriateness and songs you haven't used in a while.
                      </p>
                      <ul className="divide-y divide-gray-100">
                        {intelligentSuggestions.map(song => (
                          <li key={song._id} className="px-3 py-2 hover:bg-gray-50 flex justify-between items-center">
                            <div>
                              <span className="font-medium block">{song.title}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">{formatSongInfo(song)}</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded ${
                                  song.type === 'hymn' 
                                    ? 'bg-blue-50 text-blue-700' 
                                    : 'bg-green-50 text-green-700'
                                }`}>
                                  {song.type === 'hymn' ? 'Hymn' : 'Contemporary'}
                                </span>
                                
                                {/* Enhanced seasonal indicators */}
                                {song.liturgicalContext?.seasonMatches?.some(match => match.isCurrent) && (
                                  <span className="text-xs px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded">
                                    Current Season
                                  </span>
                                )}
                                
                                {song.liturgicalContext?.upcomingSeason && (
                                  <span className="text-xs px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded flex items-center">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {song.liturgicalContext.upcomingSeason.name} 
                                    {song.liturgicalContext.upcomingSeason.daysUntil && (
                                      <span className="ml-1">({song.liturgicalContext.upcomingSeason.daysUntil}d)</span>
                                    )}
                                  </span>
                                )}
                                
                                {/* Show when last used (if applicable) */}
                                {song.liturgicalContext?.lastUsed && (
                                  <span className="text-xs text-gray-500">
                                    {song.liturgicalContext.monthsSinceLastUsed > 11 
                                      ? `Used ${Math.floor(song.liturgicalContext.monthsSinceLastUsed/12)} year${
                                          Math.floor(song.liturgicalContext.monthsSinceLastUsed/12) !== 1 ? 's' : ''
                                        } ago`
                                      : song.liturgicalContext.monthsSinceLastUsed > 0 
                                        ? `Used ${song.liturgicalContext.monthsSinceLastUsed} month${
                                            song.liturgicalContext.monthsSinceLastUsed !== 1 ? 's' : ''
                                          } ago` 
                                        : 'Used recently'}
                                  </span>
                                )}
                              </div>
                              
                              {/* Add special indicator for songs not used this season */}
                              {song.notUsedInCurrentSeason && (
                                <div className="mt-1 text-xs text-amber-600 flex items-center">
                                  <Info className="w-3 h-3 mr-1" />
                                  Not used during this {getSeasonName(currentSeason)}
                                </div>
                              )}
                            </div>
                            <button 
                              className="text-green-600 hover:text-green-800 p-1"
                              onClick={() => handleAddToService(song)}
                              title="Add to service"
                            >
                              <PlusCircle size={18} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Upcoming Season Section - only shows when approaching a season change */}
            {(() => {
              const upcomingInfo = getUpcomingSeasonInfo();
              if (!upcomingInfo) return null;
              
              return (
                <div className="border rounded-md overflow-hidden mb-6">
                  <div 
                    className="flex justify-between items-center p-3 bg-amber-50 border-b cursor-pointer"
                    onClick={() => toggleSection('upcoming')}
                  >
                    <div className="flex items-center">
                      <h3 className="font-medium text-amber-800">
                        Prepare for {upcomingInfo.name}
                        <span className="ml-2 text-xs">
                          ({upcomingInfo.daysUntil} {upcomingInfo.daysUntil === 1 ? 'day' : 'days'} away)
                        </span>
                      </h3>
                    </div>
                    {expandedSections.upcoming ? (
                      <ChevronUp className="w-5 h-5 text-amber-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-amber-500" />
                    )}
                  </div>
                  
                  {expandedSections.upcoming && (
                    <div className="p-2">
                      <p className="text-xs text-gray-500 mb-2 px-2">
                        Start preparing songs for the upcoming liturgical season.
                      </p>
                      <ul className="divide-y divide-gray-100">
                        {upcomingInfo.songs.map(song => (
                          <li key={song._id} className="px-3 py-2 hover:bg-gray-50 flex justify-between items-center">
                            <div>
                              <span className="font-medium block">{song.title}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">{formatSongInfo(song)}</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded ${
                                  song.type === 'hymn' 
                                    ? 'bg-blue-50 text-blue-700' 
                                    : 'bg-green-50 text-green-700'
                                }`}>
                                  {song.type === 'hymn' ? 'Hymn' : 'Contemporary'}
                                </span>
                                
                                {/* Last usage info */}
                                {!song.liturgicalContext?.lastUsed ? (
                                  <span className="text-xs px-1.5 py-0.5 bg-yellow-50 text-yellow-700 rounded">
                                    Never Used
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-500">
                                    Last used: {new Date(song.liturgicalContext.lastUsed).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button 
                              className="text-amber-600 hover:text-amber-800 p-1"
                              onClick={() => handleAddToService(song)}
                              title="Add to service"
                            >
                              <PlusCircle size={18} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })()}
            
            {/* Unused or Rarely Used Songs Section */}
            {(categorizedSongs.unused.length > 0 || categorizedSongs.rarelyUsed.length > 0) && (
              <div className="border rounded-md overflow-hidden">
                <div 
                  className="flex justify-between items-center p-3 bg-purple-50 border-b cursor-pointer"
                  onClick={() => toggleSection('unused')}
                >
                  <h3 className="font-medium text-purple-800">Rediscover These Songs</h3>
                  {expandedSections.unused ? (
                    <ChevronUp className="w-5 h-5 text-purple-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-purple-500" />
                  )}
                </div>
                
                {expandedSections.unused && (
                  <div className="divide-y divide-gray-100">
                    {/* Unused Songs */}
                    {categorizedSongs.unused.length > 0 && (
                      <div className="p-2 bg-gray-50">
                        <h4 className="text-sm font-medium text-gray-700 px-2 py-1">
                          Never Used in Services
                        </h4>
                        <ul className="divide-y divide-gray-100">
                          {categorizedSongs.unused.map(song => (
                            <li key={song._id} className="px-3 py-2 hover:bg-gray-50 flex justify-between items-center">
                              <div>
                                <span className="font-medium block">{song.title}</span>
                                <span className="text-xs text-gray-500">{formatSongInfo(song)}</span>
                                {song.seasonalTags && song.seasonalTags.length > 0 && (
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {song.seasonalTags.slice(0, 2).map(tag => (
                                      <span 
                                        key={tag} 
                                        className="text-xs px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded"
                                      >
                                        {getSeasonName(tag)}
                                      </span>
                                    ))}
                                    {song.seasonalTags.length > 2 && (
                                      <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                                        +{song.seasonalTags.length - 2} more
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              <button 
                                className="text-purple-600 hover:text-purple-800 p-1"
                                onClick={() => handleAddToService(song)}
                                title="Add to service"
                              >
                                <PlusCircle size={18} />
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Rarely Used Songs */}
                    {categorizedSongs.rarelyUsed.length > 0 && (
                      <div className="p-2">
                        <h4 className="text-sm font-medium text-gray-700 px-2 py-1">
                          Used Only Once
                        </h4>
                        <ul className="divide-y divide-gray-100">
                          {categorizedSongs.rarelyUsed.map(song => (
                            <li key={song._id} className="px-3 py-2 hover:bg-gray-50 flex justify-between items-center">
                              <div>
                                <span className="font-medium block">{song.title}</span>
                                <span className="text-xs text-gray-500">{formatSongInfo(song)}</span>
                                {song.seasonalTags && song.seasonalTags.length > 0 && (
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {song.seasonalTags.slice(0, 2).map(tag => (
                                      <span 
                                        key={tag} 
                                        className="text-xs px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded"
                                      >
                                        {getSeasonName(tag)}
                                      </span>
                                    ))}
                                    {song.seasonalTags.length > 2 && (
                                      <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                                        +{song.seasonalTags.length - 2} more
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              <button 
                                className="text-purple-600 hover:text-purple-800 p-1"
                                onClick={() => handleAddToService(song)}
                                title="Add to service"
                              >
                                <PlusCircle size={18} />
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Seasonal Groupings */}
            <div className="border rounded-md overflow-hidden">
              <div 
                className="flex justify-between items-center p-3 bg-blue-50 border-b cursor-pointer"
                onClick={() => toggleSection('seasonal')}
              >
                <h3 className="font-medium text-blue-800">Songs by Season</h3>
                {expandedSections.seasonal ? (
                  <ChevronUp className="w-5 h-5 text-blue-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-blue-500" />
                )}
              </div>
              
              {expandedSections.seasonal && (
                <div className="divide-y divide-gray-100">
                  {Object.entries(categorizedSongs.seasonal).map(([season, seasonSongs]) => {
                    // Skip if no songs or if filtered
                    if (seasonSongs.length === 0) return null;
                    
                    return (
                      <div key={season} className="p-2">
                        <h4 className="text-sm font-medium text-gray-700 px-2 py-1 flex items-center">
                          <span 
                            className="inline-block w-3 h-3 rounded-full mr-2"
                            style={{
                              backgroundColor: Object.entries(LITURGICAL_SEASONS).find(([key]) => 
                                key.toLowerCase() === season.toLowerCase()
                              )?.[1]?.color || '#888888'
                            }}
                          ></span>
                          {season === 'untagged' ? 'No Season Assigned' : getSeasonName(season)}
                          <span className="ml-2 text-xs text-gray-500">({seasonSongs.length})</span>
                        </h4>
                        <ul className="divide-y divide-gray-100">
                          {seasonSongs.slice(0, 5).map(song => (
                            <li key={song._id} className="px-3 py-2 hover:bg-gray-50 flex justify-between items-center">
                              <div>
                                <span className="font-medium block">{song.title}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500">{formatSongInfo(song)}</span>
                                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                                    song.type === 'hymn' 
                                      ? 'bg-blue-50 text-blue-700' 
                                      : 'bg-green-50 text-green-700'
                                  }`}>
                                    {song.type === 'hymn' ? 'Hymn' : 'Contemporary'}
                                  </span>
                                  {getSongUsageCount(song.title) === 0 && (
                                    <span className="text-xs px-1.5 py-0.5 bg-yellow-50 text-yellow-700 rounded">
                                      Never Used
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button 
                                className="text-purple-600 hover:text-purple-800 p-1"
                                onClick={() => handleAddToService(song)}
                                title="Add to service"
                              >
                                <PlusCircle size={18} />
                              </button>
                            </li>
                          ))}
                          {seasonSongs.length > 5 && (
                            <li className="p-2 text-center">
                              <span className="text-xs text-blue-600">
                                + {seasonSongs.length - 5} more songs for this season
                              </span>
                            </li>
                          )}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Service Selection Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-lg">Add to Service</h3>
              <button
                onClick={() => setShowServiceModal(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              <div className="mb-4 p-3 bg-gray-50 rounded-md">
                <h3 className="font-medium text-black mb-1">{selectedSong.title}</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    selectedSong.type === 'hymn' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {selectedSong.type === 'hymn' ? 'Hymn' : 'Contemporary'}
                  </span>
                  
                  {selectedSong.type === 'hymn' && selectedSong.number && (
                    <span className="text-xs text-gray-500">
                      #{selectedSong.number} 
                      {selectedSong.hymnal && ` (${selectedSong.hymnal})`}
                    </span>
                  )}
                  
                  {selectedSong.author && (
                    <span className="text-xs text-gray-500">
                      {selectedSong.author}
                    </span>
                  )}
                </div>
              </div>
              
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Select Service and Position
              </h3>
              
              {loadingServices ? (
                <div className="text-center py-4 text-gray-500">
                  <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-1" />
                  <p className="text-sm">Loading services...</p>
                </div>
              ) : upcomingServices.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <Calendar className="w-5 h-5 mx-auto mb-1" />
                  <p className="text-sm">No upcoming services found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingServices.map(service => {
                    // Determine if this service is expanded
                    const isExpanded = selectedService?.date === service.date;
                    
                    return (
                      <div 
                        key={service.date}
                        className="border rounded-md overflow-hidden"
                      >
                        {/* Service header - Always visible */}
                        <div 
                          onClick={() => setSelectedService(isExpanded ? null : service)}
                          className={`p-3 flex justify-between items-center cursor-pointer hover:bg-gray-50 ${
                            isExpanded ? 'bg-purple-50 border-b border-purple-200' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {service.liturgical && (
                              <div 
                                className="w-3 h-3 rounded-full flex-shrink-0" 
                                style={{ backgroundColor: service.liturgical.color || '#6B7280' }}
                                title={service.liturgical.seasonName}
                              ></div>
                            )}
                            <div>
                              <div className="font-medium">
                                {service.title || `${service.liturgical?.seasonName || 'Sunday'} Service`}
                              </div>
                              <div className="text-xs text-gray-600 flex items-center gap-1">
                                <span>{service.date}</span>
                                <span className="mx-1">•</span>
                                <span>{service.serviceTypeDisplay}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                              {service.songPositions.length} positions
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        </div>
                        
                        {/* Expanded song positions */}
                        {isExpanded && service.songPositions.length > 0 && (
                          <div className="p-3 bg-gray-50">
                            <div className="space-y-2">
                              {service.songPositions.map(position => (
                                <div 
                                  key={position.id}
                                  className={`border rounded-md ${
                                    selectedPosition === position.id
                                      ? 'border-purple-300 bg-purple-50'
                                      : 'border-gray-200 bg-white'
                                  }`}
                                >
                                  <div className="flex items-center justify-between p-2">
                                    <div className="flex items-center gap-2">
                                      <div className={`w-2 h-2 rounded-full ${
                                        position.hasSelection 
                                          ? 'bg-amber-400' 
                                          : 'bg-blue-400'
                                      }`}></div>
                                      <div className="font-medium text-sm text-gray-800">{position.label}</div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                      {position.hasSelection ? (
                                        <div className="flex items-center gap-1 text-xs text-gray-500 mr-2">
                                          <span>Current Song:</span>
                                          <span className="font-medium truncate max-w-[120px]">{position.selectionDetails.title}</span>
                                        </div>
                                      ) : null}
                                      
                                      {position.hasSelection ? (
                                        <button
                                          onClick={() => {
                                            if (confirm(`Replace "${position.selectionDetails.title}" with "${selectedSong.title}"?`)) {
                                              setSelectedPosition(position.id);
                                            }
                                          }}
                                          className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
                                            selectedPosition === position.id
                                              ? 'bg-purple-600 text-white'
                                              : 'bg-amber-50 border border-amber-100 text-amber-700 hover:bg-amber-100'
                                          }`}
                                        >
                                          {selectedPosition === position.id ? (
                                            <span>Selected</span>
                                          ) : (
                                            <>
                                              <PlusCircle className="w-3 h-3" />
                                              <span>Replace</span>
                                            </>
                                          )}
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => setSelectedPosition(position.id)}
                                          className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
                                            selectedPosition === position.id
                                              ? 'bg-purple-600 text-white'
                                              : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                          }`}
                                        >
                                          {selectedPosition === position.id ? (
                                            <span>Selected</span>
                                          ) : (
                                            <>
                                              <PlusCircle className="w-3 h-3" />
                                              <span>Add</span>
                                            </>
                                          )}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Warning shown only for selected positions with existing songs */}
                                  {selectedPosition === position.id && position.hasSelection && (
                                    <div className="px-2 py-1 bg-amber-50 border-t border-amber-100 text-xs text-amber-600 flex items-center gap-1">
                                      <div>⚠️</div>
                                      <div>This will replace the current song</div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              
              <div className="flex justify-end gap-2 mt-6">
                <button
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                  onClick={() => setShowServiceModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-purple-300 flex items-center"
                  disabled={!selectedService || !selectedPosition || isAddingSong}
                  onClick={addSongToService}
                >
                  {isAddingSong ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add to Service'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Alert notifications */}
      {alert.show && (
        <div className={`fixed bottom-4 right-4 p-3 rounded-md shadow-md z-50 ${
          alert.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
          alert.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 
          'bg-blue-50 text-blue-800 border border-blue-200'
        }`}>
          <div className="flex items-center gap-2">
            {alert.type === 'success' ? <CheckCircle size={16} /> : 
             alert.type === 'error' ? <AlertCircle size={16} /> : 
             <Info size={16} />}
            <span>{alert.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SongRediscoveryPanel;