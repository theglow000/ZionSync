import React, { useState, useEffect } from 'react';
import { 
  Search, RefreshCw, Music, Calendar, PlusCircle, Info, 
  ChevronDown, ChevronUp, X as XIcon, ExternalLink, Layers, LayoutList,
  Settings, Filter
} from 'lucide-react';
import { getCurrentSeason } from '../../lib/LiturgicalCalendarService.js';
import ReferenceSongManageModal from './ReferenceSongManageModal.jsx';
import QuickAddModal from './QuickAddModal.jsx';  // Import the QuickAddModal component

// Liturgical seasons (in chronological order)
const liturgicalSeasons = [
  { id: 'advent', name: 'Advent', color: '#4b0082' },         // Purple/Indigo
  { id: 'christmas', name: 'Christmas', color: '#b8860b' },   // Changed from white to darkgoldenrod
  { id: 'epiphany', name: 'Epiphany', color: '#006400' },     // Dark Green
  { id: 'lent', name: 'Lent', color: '#800080' },             // Purple
  { id: 'holyWeek', name: 'Holy Week', color: '#8b0000' },    // Dark Red
  { id: 'easter', name: 'Easter', color: '#ffd700' },         // Gold
  { id: 'ordinaryTime', name: 'Ordinary Time', color: '#008000' }  // Green
];

// Hymnals
const hymnalVersions = [
  { id: 'cranberry', name: 'Cranberry' },
  { id: 'green', name: 'Green' },
  { id: 'blue', name: 'Blue' },
  { id: 'elw', name: 'ELW (Evangelical Lutheran Worship)' },
  { id: 'lbw', name: 'LBW (Lutheran Book of Worship)' },
  { id: 'wov', name: 'WOV (With One Voice)' }
];

const ReferenceSongPanel = () => {
  // State for reference songs
  const [referenceSongs, setReferenceSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Filter state
  const [selectedSeason, setSelectedSeason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  
  // UI state
  const [expandedSongId, setExpandedSongId] = useState(null);
  const [importStatus, setImportStatus] = useState(null);
  const [upcomingServices, setUpcomingServices] = useState([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [loadingServices, setLoadingServices] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState('song1');
  
  // Add new state for seasonal organization
  const [groupedSongs, setGroupedSongs] = useState({});
  const [expandedSeasons, setExpandedSeasons] = useState({});
  const [activeSeasonId, setActiveSeasonId] = useState(null);
  const [viewMode, setViewMode] = useState('compact'); // 'compact' or 'detailed'
  const [showFilters, setShowFilters] = useState(false);
  
  // Add state for management modal
  const [showManageModal, setShowManageModal] = useState(false);
  const [manageSongMode, setManageSongMode] = useState('add'); // 'add', 'edit', 'delete'
  const [manageSongData, setManageSongData] = useState(null);

  // Add state for the QuickAdd modal
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [quickAddSong, setQuickAddSong] = useState(null);

  // Load reference songs when filters change
  useEffect(() => {
    fetchReferenceSongs();
  }, [selectedSeason, filterType]);
  
  // Determine active season based on current date when component loads
  useEffect(() => {
    // Determine the current liturgical season using the service
    const currentDate = new Date();
    const currentSeasonId = getCurrentSeason(currentDate).toLowerCase();

    setActiveSeasonId(currentSeasonId);

    // Auto-expand the current season
    setExpandedSeasons(prev => ({ ...prev, [currentSeasonId]: true }));
  }, []);
  
  // Group songs by season after they're loaded
  useEffect(() => {
    if (referenceSongs.length > 0) {
      const grouped = groupSongsBySeason(referenceSongs);
      setGroupedSongs(grouped);
    }
  }, [referenceSongs]);
  
  // Fetch reference songs based on filters
  const fetchReferenceSongs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Build query URL with filters
      let url = '/api/reference-songs';
      const params = new URLSearchParams();
      
      if (selectedSeason) {
        params.append('season', selectedSeason);
      }
      
      if (filterType !== 'all') {
        params.append('type', filterType);
      }
      
      if (searchTerm.trim()) {
        params.append('query', searchTerm.trim());
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch reference songs');
      }
      
      const data = await response.json();
      setReferenceSongs(data);
    } catch (err) {
      console.error('Error fetching reference songs:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Group songs by season
  const groupSongsBySeason = (songs) => {
    const grouped = {};
    
    // Initialize groups for all liturgical seasons
    liturgicalSeasons.forEach(season => {
      grouped[season.id] = {
        seasonName: season.name,
        seasonColor: season.color,
        hymns: [],
        contemporary: []
      };
    });
    
    // Place songs in appropriate season groups
    songs.forEach(song => {
      song.seasonalTags.forEach(seasonId => {
        if (grouped[seasonId]) {
          if (song.type === 'hymn') {
            grouped[seasonId].hymns.push(song);
          } else if (song.type === 'contemporary') {
            grouped[seasonId].contemporary.push(song);
          }
        }
      });
    });
    
    return grouped;
  };
  
  // Toggle expanded state of a song
  const toggleSongExpanded = (songId) => {
    setExpandedSongId(expandedSongId === songId ? null : songId);
  };
  
  // Toggle expanded state of a season
  const toggleSeasonExpanded = (seasonId) => {
    setExpandedSeasons(prev => ({
      ...prev,
      [seasonId]: !prev[seasonId]
    }));
  };
  
  // Toggle view mode between compact and detailed
  const toggleViewMode = () => {
    setViewMode(prev => prev === 'compact' ? 'detailed' : 'compact');
  };
  
  // Open manage song modal
  const handleOpenManageModal = (mode, song = null) => {
    setManageSongMode(mode);
    setManageSongData(song);
    setShowManageModal(true);
  };

  // Function to open the QuickAdd modal
  const handleQuickAddSong = (song) => {
    setQuickAddSong(song);
    setShowQuickAddModal(true);
  };

  // Sort seasons to put current season at top then follow liturgical calendar
  const sortedSeasons = [...liturgicalSeasons].sort((a, b) => {
    // Put active season first
    if (a.id === activeSeasonId) return -1;
    if (b.id === activeSeasonId) return 1;
    
    // For other seasons, create a circular ordering that follows the liturgical calendar
    const seasonOrder = ['advent', 'christmas', 'epiphany', 'lent', 'holyWeek', 'easter', 'ordinaryTime'];
    
    // Find index of current season
    const currentSeasonIndex = activeSeasonId ? seasonOrder.indexOf(activeSeasonId) : 0;
    
    // Calculate positions that create a circular sequence starting from the current season
    const positionA = (seasonOrder.indexOf(a.id) - currentSeasonIndex + seasonOrder.length) % seasonOrder.length;
    const positionB = (seasonOrder.indexOf(b.id) - currentSeasonIndex + seasonOrder.length) % seasonOrder.length;
    
    return positionA - positionB;
  });

  return (
    <div className="bg-white rounded-lg overflow-hidden flex flex-col h-full">
      {/* Compact header with essential controls */}
      <div className="p-3 border-b bg-gray-50">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold">Reference Songs</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-1.5 rounded-md ${showFilters ? 'bg-blue-100 text-blue-700' : 'text-gray-500'} hover:bg-gray-200 border border-gray-300`}
              title="Toggle filters"
            >
              <Filter className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenManageModal('add')}
              className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200 border border-gray-300"
              title="Manage reference songs"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={toggleViewMode}
              className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200 border border-gray-300"
              title={`Switch to ${viewMode === 'compact' ? 'detailed' : 'compact'} view`}
            >
              {viewMode === 'compact' ? 
                <Layers className="w-4 h-4" /> : 
                <LayoutList className="w-4 h-4" />
              }
            </button>
          </div>
        </div>
        
        {/* Search bar - always visible */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search songs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-9 py-2 border rounded-md"
            onKeyPress={(e) => e.key === 'Enter' && fetchReferenceSongs()}
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <button
            onClick={fetchReferenceSongs}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
            aria-label="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        
        {/* Collapsible filters */}
        {showFilters && (
          <div className="mt-2 flex gap-2 overflow-x-auto py-1">
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="border rounded-md px-3 py-1.5 text-sm"
            >
              <option value="">All Seasons</option>
              {liturgicalSeasons.map(season => (
                <option key={season.id} value={season.id}>
                  {season.name}
                </option>
              ))}
            </select>
            
            <div className="flex border rounded-md overflow-hidden text-sm">
              <button
                className={`px-3 py-1.5 ${filterType === 'all' ? 'bg-purple-100 text-purple-800' : 'bg-white text-gray-700'}`}
                onClick={() => setFilterType('all')}
              >
                All
              </button>
              <button
                className={`px-3 py-1.5 ${filterType === 'hymn' ? 'bg-blue-100 text-blue-800' : 'bg-white text-gray-700'}`}
                onClick={() => setFilterType('hymn')}
              >
                Hymns
              </button>
              <button
                className={`px-3 py-1.5 ${filterType === 'contemporary' ? 'bg-green-100 text-green-800' : 'bg-white text-gray-700'}`}
                onClick={() => setFilterType('contemporary')}
              >
                Contemporary
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Song list content area */}
      <div className="flex-grow overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center text-red-600 p-4">
            {error}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Current Season Indicator */}
            {activeSeasonId && (
              <div className="text-sm text-center bg-gray-50 rounded py-1">
                <span className="font-medium">Current Season: </span>
                {liturgicalSeasons.find(s => s.id === activeSeasonId)?.name}
              </div>
            )}

            {/* Loop through sorted seasons */}
            {sortedSeasons.map(season => {
              const seasonSongs = groupedSongs[season.id];
              if (!seasonSongs) return null;
              
              const hasHymns = seasonSongs.hymns.length > 0;
              const hasContemporary = seasonSongs.contemporary.length > 0;
              const hasSongs = hasHymns || hasContemporary;
              
              if (!hasSongs && selectedSeason) return null;
              
              const isExpanded = expandedSeasons[season.id] || false;
              const isActive = season.id === activeSeasonId;
              
              return (
                <div 
                  key={season.id} 
                  className={`border rounded-md ${isActive ? 'border-2' : 'border'}`}
                  style={{ borderColor: season.color }}
                >
                  {/* Season header */}
                  <div 
                    className="flex items-center justify-between p-2.5 cursor-pointer"
                    onClick={() => toggleSeasonExpanded(season.id)}
                    style={{ backgroundColor: isActive ? `${season.color}15` : 'transparent' }}
                  >
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: season.color }}
                      ></div>
                      <h3 className="font-bold">{season.name}</h3>
                      
                      {!selectedSeason && (
                        <div className="ml-2 text-sm text-gray-500">
                          {seasonSongs.hymns.length + seasonSongs.contemporary.length} songs
                        </div>
                      )}
                      
                      {isActive && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                  
                  {/* Season content - conditionally shown */}
                  {isExpanded && (filterType === 'all' || filterType === 'hymn' || filterType === 'contemporary') && (
                    <div className="p-2">
                      {/* Two-column layout for hymns and contemporary songs */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Hymns Column */}
                        {(filterType === 'all' || filterType === 'hymn') && (
                          <div className="flex flex-col h-full">
                            <div className="bg-blue-100 rounded-t-md border-b border-blue-200">
                              <h4 className="text-blue-800 font-medium text-center py-1 px-2">
                                Hymns {hasHymns ? `(${seasonSongs.hymns.length})` : ''}
                              </h4>
                            </div>
                            <div className={`flex-1 bg-blue-50 p-2 rounded-b-md ${hasHymns ? '' : 'flex items-center justify-center'}`}>
                              {hasHymns ? (
                                <div className="space-y-1">
                                  {seasonSongs.hymns.map(song => (
                                    <SongCard 
                                      key={song._id} 
                                      song={song}
                                      isExpanded={expandedSongId === song._id}
                                      onToggleExpand={() => toggleSongExpanded(song._id)}
                                      viewMode={viewMode}
                                      onAddToService={handleQuickAddSong}
                                    />
                                  ))}
                                </div>
                              ) : (
                                <p className="text-center text-gray-500 text-sm py-4">No hymns available</p>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Contemporary Column */}
                        {(filterType === 'all' || filterType === 'contemporary') && (
                          <div className="flex flex-col h-full">
                            <div className="bg-green-100 rounded-t-md border-b border-green-200">
                              <h4 className="text-green-800 font-medium text-center py-1 px-2">
                                Contemporary {hasContemporary ? `(${seasonSongs.contemporary.length})` : ''}
                              </h4>
                            </div>
                            <div className={`flex-1 bg-green-50 p-2 rounded-b-md ${hasContemporary ? '' : 'flex items-center justify-center'}`}>
                              {hasContemporary ? (
                                <div className="space-y-1">
                                  {seasonSongs.contemporary.map(song => (
                                    <SongCard 
                                      key={song._id} 
                                      song={song}
                                      isExpanded={expandedSongId === song._id}
                                      onToggleExpand={() => toggleSongExpanded(song._id)}
                                      viewMode={viewMode}
                                      onAddToService={handleQuickAddSong}
                                    />
                                  ))}
                                </div>
                              ) : (
                                <p className="text-center text-gray-500 text-sm py-4">No contemporary songs available</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Show message when no songs match filter */}
                      {!hasHymns && !hasContemporary && (
                        <p className="text-center text-gray-500 py-2">No songs match the current filter</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Management Modal */}
      {showManageModal && (
        <ReferenceSongManageModal
          isOpen={showManageModal}
          onClose={() => setShowManageModal(false)}
          mode={manageSongMode}
          song={manageSongData}
          onComplete={fetchReferenceSongs}
          liturgicalSeasons={liturgicalSeasons}
          hymnalVersions={hymnalVersions}
        />
      )}
      
      {/* QuickAdd Modal */}
      <QuickAddModal
        isOpen={showQuickAddModal}
        onClose={() => setShowQuickAddModal(false)}
        song={quickAddSong}
      />
    </div>
  );
};

// Song Card component
const SongCard = ({ song, isExpanded, onToggleExpand, viewMode, onAddToService }) => {
  return (
    <div 
      className={`border rounded-md ${isExpanded ? 'bg-white' : 'bg-white'} hover:bg-gray-50 transition-colors`}
    >
      {/* Song header - always visible */}
      <div 
        className="flex justify-between items-center p-2 cursor-pointer"
        onClick={onToggleExpand}
      >
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-gray-900 flex items-center">
            <span className="truncate">{song.title}</span>
            {song.type === 'hymn' && song.number && (
              <span className="text-blue-700 whitespace-nowrap text-xs ml-1">#{song.number}</span>
            )}
            {/* Add a small plus icon inline with the title */}
            <button 
              className="ml-1.5 p-0.5 rounded-full hover:bg-purple-100 text-gray-400 hover:text-purple-600"
              title="Add to service"
              onClick={(e) => {
                e.stopPropagation();
                onAddToService(song);
              }}
            >
              <PlusCircle className="w-3.5 h-3.5" />
            </button>
          </div>
          {viewMode === 'detailed' && !isExpanded && (
            <div className="text-xs text-gray-500 mt-0.5 truncate">
              {song.theme && <span>{song.theme}</span>}
            </div>
          )}
        </div>
        <div className="ml-2 flex items-center">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>
      
      {/* Expanded content */}
      {isExpanded && (
        <div className="px-3 pb-2 pt-0 text-xs border-t">
          {/* Musical properties on individual lines */}
          <div className="mt-2 space-y-1">
            {song.tempo && (
              <div className="text-gray-600">
                <span className="font-medium text-gray-500">Tempo:</span>
                <span className="ml-1">{song.tempo}</span>
              </div>
            )}
            
            {song.theme && (
              <div className="text-gray-600">
                <span className="font-medium text-gray-500">Theme:</span>
                <span className="ml-1">{song.theme}</span>
              </div>
            )}
            
            {song.arrangement && (
              <div className="text-gray-600">
                <span className="font-medium text-gray-500">Arrangement:</span>
                <span className="ml-1">{song.arrangement}</span>
              </div>
            )}
          </div>
          
          {/* External links only - removed the Add to Service button */}
          <div className="flex justify-end mt-2">
            <div className="flex gap-2">
              {(song.hymnaryLink || song.songSelectLink) && (
                <a 
                  href={song.hymnaryLink || song.songSelectLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  Sheet music <ExternalLink className="ml-0.5 w-3 h-3" />
                </a>
              )}
              
              {song.youtubeLink && (
                <a 
                  href={song.youtubeLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-red-600 hover:underline flex items-center text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  YouTube <ExternalLink className="ml-0.5 w-3 h-3" />
                </a>
              )}
            </div>
          </div>
          
          {/* Description section */}
          {song.description && (
            <div className="mt-1.5 pb-1 text-gray-700">
              {song.description}
            </div>
          )}
          
          {/* Scripture references */}
          {song.scripturalConnections?.length > 0 && (
            <div className="mt-1">
              <span className="font-medium text-gray-700">Scripture:</span> {song.scripturalConnections.join(', ')}
            </div>
          )}
          
          {/* Tags */}
          {song.tags?.length > 0 && (
            <div className="mt-1.5">
              <div className="flex flex-wrap gap-1">
                {song.tags.map((tag, i) => (
                  <span key={i} className="bg-gray-100 text-gray-600 px-1.5 py-0.5 text-xs rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReferenceSongPanel;