import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Music, FileText, Plus, X, Edit, Trash2, Save, AlertCircle, GitMerge, Check, X as XIcon, Repeat, ArrowUpRight, TagIcon, BookOpen, Calendar, ChevronDown, ChevronUp, PlusCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import SeasonalTaggingTool from './SeasonalTaggingTool';
import ReferenceSongPanel from './ReferenceSongPanel';
import SongRediscoveryPanel from './SongRediscoveryPanel';
import SeasonalPlanningGuide from './SeasonalPlanningGuide';
import { useConfirm } from '../../hooks/useConfirm';
import { LoadingSpinner, EmptyState } from '../shared';
import { fetchWithTimeout, apiPost, apiDelete } from '../../lib/api-utils';

// Hymnal options
const hymnalVersions = [
  { id: 'cranberry', name: 'Cranberry' },
  { id: 'green', name: 'Green' },
  { id: 'blue', name: 'Blue' }
];

// Liturgical seasons
const liturgicalSeasons = [
  { id: 'advent', name: 'Advent', color: '#4b0082' },
  { id: 'christmas', name: 'Christmas', color: '#ffffff' },
  { id: 'epiphany', name: 'Epiphany', color: '#006400' },
  { id: 'lent', name: 'Lent', color: '#800080' },
  { id: 'holyWeek', name: 'Holy Week', color: '#8b0000' },
  { id: 'easter', name: 'Easter', color: '#ffd700' },
  { id: 'pentecost', name: 'Pentecost', color: '#ff0000' },
  { id: 'ordinaryTime', name: 'Ordinary Time', color: '#008000' },
  { id: 'reformation', name: 'Reformation', color: '#ff0000' },
  { id: 'allSaints', name: 'All Saints', color: '#ffffff' },
  { id: 'thanksgiving', name: 'Thanksgiving', color: '#a0522d' }
];

const SongDatabase = () => {
  const { confirm, ConfirmDialog } = useConfirm();
  
  // State variables
  const [songs, setSongs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingSong, setEditingSong] = useState(null);
  const [selectedSong, setSelectedSong] = useState(null);
  const [showSongEditor, setShowSongEditor] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');
  const [showAlert, setShowAlert] = useState(false);

  // Add a new state for the merge modal
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeTargetSong, setMergeTargetSong] = useState(null);
  const [mergeSearchTerm, setMergeSearchTerm] = useState('');
  const [mergeCandidates, setMergeCandidates] = useState([]);

  // Add this state inside the SongDatabase component
  const [showTaggingTool, setShowTaggingTool] = useState(false);

  // Add these state variables near the top of the SongDatabase component, with the other state declarations
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [upcomingServices, setUpcomingServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState('general');
  const [selectedService, setSelectedService] = useState(null);
  const [isAddingSong, setIsAddingSong] = useState(false);

  // Fetch songs when component mounts
  useEffect(() => {
    const fetchSongs = async () => {
      setIsLoading(true);
      try {
        // Fetch songs
        const songsResponse = await fetchWithTimeout('/api/songs');
        if (!songsResponse.ok) throw new Error('Failed to fetch songs');
        const songsData = await songsResponse.json();
        
        // Sort songs alphabetically by title
        songsData.sort((a, b) => a.title.localeCompare(b.title));
        setSongs(songsData);
      } catch (err) {
        setError(err.message);
        showAlertMessage(err.message, 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSongs();
  }, []);

  // Filter songs based on search term and filter type
  const filteredSongs = songs.filter(song => {
    const matchesSearch = 
      song.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (song.author && song.author.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (song.number && song.number.toString().includes(searchTerm));
      
    const matchesType = 
      filterType === 'all' || 
      song.type === filterType;
      
    return matchesSearch && matchesType;
  });

  // Handle song selection for viewing/editing
  const handleSelectSong = (song) => {
    setSelectedSong(song);
    setShowSongEditor(false);
  };

  // Handle song edit
  const handleEditSong = () => {
    setEditingSong({...selectedSong});
    setShowSongEditor(true);
  };

  // Handle song update
  const handleUpdateSong = async () => {
    try {
      const response = await fetchWithTimeout('/api/songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingSong)
      });
      
      if (!response.ok) throw new Error('Failed to update song');
      
      // Update local state
      setSongs(songs.map(song => 
        song._id === editingSong._id ? editingSong : song
      ));
      
      setSelectedSong(editingSong);
      setShowSongEditor(false);
      showAlertMessage('Song updated successfully');
    } catch (err) {
      showAlertMessage(err.message, 'error');
    }
  };

  // Handle song delete confirmation
  const handleConfirmDelete = async () => {
    try {
      // First check if the song has usage history
      const usageResponse = await fetchWithTimeout(`/api/song-usage?title=${encodeURIComponent(selectedSong.title)}`);
      
      if (usageResponse.ok) {
        const usageData = await usageResponse.json();
        
        if (usageData && usageData.length > 0) {
          // Song has usage history, show special warning
          const confirmed = await confirm({
            title: 'Delete Song with History',
            message: `"${selectedSong.title}" has been used in ${usageData.length} service${usageData.length > 1 ? 's' : ''}.`,
            details: ['Historical data will be preserved but marked as deleted'],
            variant: 'danger',
            confirmText: 'Delete Anyway',
            cancelText: 'Cancel'
          });

          if (!confirmed) {
            return; // Exit if user cancels
          }
        }
      }
      
      // Show normal deletion confirmation
      setShowConfirmDelete(true);
    } catch (err) {
      showAlertMessage(err.message, 'error');
    }
  };

  // Handle actual song deletion
  const handleDeleteSong = async () => {
    try {
      const response = await fetchWithTimeout(`/api/songs?id=${selectedSong._id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete song');
      
      const result = await response.json();
      
      // Update local state
      setSongs(songs.filter(song => song._id !== selectedSong._id));
      setSelectedSong(null);
      setShowConfirmDelete(false);
      
      // Display appropriate message based on whether the song had usage history
      if (result.hadUsageHistory) {
        showAlertMessage('Song deleted. Historical usage records have been preserved.');
      } else {
        showAlertMessage('Song deleted successfully');
      }
    } catch (err) {
      showAlertMessage(err.message, 'error');
    }
  };

  // Handle showing alert message
  const showAlertMessage = (message, type = 'success') => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  // Handle input change in editor
  const handleEditorInputChange = (field, value) => {
    setEditingSong(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Add a function to handle song merging
  const handleMergeSongs = async (targetSong) => {
    try {
      const response = await fetchWithTimeout('/api/songs/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: selectedSong._id,
          targetId: targetSong._id
        })
      });
      
      if (!response.ok) throw new Error('Failed to merge songs');
      
      // Update local state
      setSongs(songs.filter(song => song._id !== selectedSong._id));
      setSelectedSong(null);
      setShowMergeModal(false);
      setMergeCandidates([]);
      setMergeSearchTerm('');
      
      showAlertMessage('Songs merged successfully');
      
      // Refresh song list
      fetchSongs();
      
    } catch (err) {
      showAlertMessage(err.message, 'error');
    }
  };

  // Add a function to find merge candidates
  const findMergeCandidates = (term) => {
    setMergeSearchTerm(term);
    
    if (!term || term.length < 2) {
      setMergeCandidates([]);
      return;
    }
    
    // Find songs with similar titles, excluding the currently selected song
    const candidates = songs.filter(song => 
      song._id !== selectedSong._id &&
      song.title.toLowerCase().includes(term.toLowerCase())
    );
    
    setMergeCandidates(candidates.slice(0, 5)); // Limit to 5 suggestions
  };

  // Add this function to handle seasonal tags
  const handleSeasonalTagToggle = (season) => {
    if (!editingSong) return;
    
    const seasonalTags = editingSong.seasonalTags || [];
    const updatedTags = seasonalTags.includes(season)
      ? seasonalTags.filter(tag => tag !== season)
      : [...seasonalTags, season];
      
    setEditingSong(prev => ({
      ...prev,
      seasonalTags: updatedTags
    }));
  };

  // Add this function to the SongDatabase component to get rotation status display
  const getRotationStatusDisplay = (song) => {
    if (!song.rotationStatus) return null;
    
    const status = [];
    
    if (song.rotationStatus.isLearning) {
      status.push({
        label: 'Learning Song',
        icon: <Repeat className="w-4 h-4 mr-1" />,
        tooltip: `Used in ${song.rotationStatus.consecutiveUses} consecutive services`,
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300'
      });
    }
    
    if (song.rotationStatus.isInRotation) {
      status.push({
        label: 'In Rotation',
        icon: <Music className="w-4 h-4 mr-1" />,
        tooltip: `Used ${song.rotationStatus.recentUses} times in recent services`,
        color: 'bg-green-100 text-green-800 border-green-300'
      });
    }
    
    if (status.length === 0 && song.rotationStatus.lastUsed) {
      const lastUsedDate = new Date(song.rotationStatus.lastUsed);
      const formattedDate = lastUsedDate.toLocaleDateString();
      
      status.push({
        label: 'Last Used',
        icon: <ArrowUpRight className="w-4 h-4 mr-1" />,
        tooltip: `Last used on ${formattedDate}`,
        color: 'bg-gray-100 text-gray-800 border-gray-300'
      });
    }
    
    return status;
  };

  // Fix fetchUpcomingServices function based on the actual API response structure
  const fetchUpcomingServices = async () => {
    try {
      setLoadingServices(true);
      setError(null);
      
      // Fetch upcoming services with their full details
      const response = await fetchWithTimeout('/api/upcoming-services?limit=8');
      
      if (!response.ok) {
        throw new Error('Failed to fetch upcoming services');
      }
      
      // Handle different response structures
      const responseData = await response.json();
      const services = Array.isArray(responseData) ? responseData :
                      Array.isArray(responseData.value) ? responseData.value : [];
      
      // Process the services data
      const enhancedServices = services.map(service => {
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
      showAlertMessage('Failed to load upcoming services', 'error');
    } finally {
      setLoadingServices(false);
    }
  };

  // Add this function to handle opening the service modal
  const handleOpenServiceModal = () => {
    setShowServiceModal(true);
    setSelectedService(null);
    setSelectedPosition('general');
    fetchUpcomingServices();
  };

  // Update the addSongToService function to correctly use the ReferenceSongPanel approach
  const addSongToService = async () => {
    if (!selectedSong || !selectedService || !selectedPosition) {
      showAlertMessage('Please select both a service and a position', 'error');
      return;
    }
    
    try {
      setIsAddingSong(true);
      
      // Use the exact same approach as ReferenceSongPanel for adding songs
      const response = await fetchWithTimeout('/api/reference-songs/import', {
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
            notes: `Added from Song Database panel. ${selectedSong.notes || ''}`
          }
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        console.error('Response status:', response.status, response.statusText);
        throw new Error(`Failed to add song: ${response.status} ${response.statusText}`);
      }
      
      // Success handling
      showAlertMessage(`Added "${selectedSong.title}" to service on ${selectedService.date}`);
      
      // Close the modal
      setTimeout(() => {
        setShowServiceModal(false);
      }, 1500);
      
    } catch (error) {
      console.error('Error adding song to service:', error);
      showAlertMessage(`Error adding song: ${error.message}`, 'error');
    } finally {
      setIsAddingSong(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Alert for notifications */}
      {showAlert && (
        <Alert className={`fixed top-4 right-4 z-50 w-80 bg-white border-${alertType === 'success' ? 'green' : 'red'}-500 shadow-lg`}>
          <div className="flex items-center gap-2 p-2">
            <AlertCircle className={`w-5 h-5 text-${alertType === 'success' ? 'green' : 'red'}-500`} />
            <AlertDescription className="text-black font-medium">
              {alertMessage}
            </AlertDescription>
          </div>
        </Alert>
      )}

      <Tabs defaultValue="planning" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6 bg-gray-100">
          <TabsTrigger value="planning" className="flex items-center gap-2 data-[state=active]:bg-white">
            <Calendar className="w-4 h-4" />
            <span>Planning Guide</span>
          </TabsTrigger>
          <TabsTrigger value="library" className="flex items-center gap-2 data-[state=active]:bg-white">
            <Music className="w-4 h-4" />
            <span>Song Library</span>
          </TabsTrigger>
          <TabsTrigger value="reference" className="flex items-center gap-2 data-[state=active]:bg-white">
            <BookOpen className="w-4 h-4" />
            <span>Reference Songs</span>
          </TabsTrigger>
          <TabsTrigger value="rediscovery" className="flex items-center gap-2 data-[state=active]:bg-white">
            <Repeat className="w-4 h-4" />
            <span>Rediscovery</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by title, number, or author..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {/* Add this button */}
              <Button 
                variant="outline" 
                onClick={() => setShowTaggingTool(true)}
                className="flex items-center gap-1"
              >
                <TagIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Batch Tag</span>
              </Button>
              {/* Existing filter buttons */}
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterType('all')}
                className={filterType === 'all' ? 'bg-purple-700' : ''}
              >
                All
              </Button>
              <Button
                variant={filterType === 'hymn' ? 'default' : 'outline'}
                onClick={() => setFilterType('hymn')}
                className={filterType === 'hymn' ? 'bg-purple-700' : ''}
              >
                Hymns
              </Button>
              <Button
                variant={filterType === 'contemporary' ? 'default' : 'outline'}
                onClick={() => setFilterType('contemporary')}
                className={filterType === 'contemporary' ? 'bg-purple-700' : ''}
              >
                Contemporary
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" className="border-purple-700" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              <p>Error loading songs: {error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Song List */}
              <div className="md:col-span-1 border rounded-lg overflow-hidden bg-white">
                <div className="bg-gray-50 p-3 border-b">
                  <h3 className="font-medium text-gray-700">Song List ({filteredSongs.length})</h3>
                </div>
                <div className="overflow-y-auto max-h-[600px]">
                  {filteredSongs.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                      {filteredSongs.map(song => (
                        <li 
                          key={song._id}
                          className={`p-3 cursor-pointer hover:bg-purple-50 ${selectedSong && selectedSong._id === song._id ? 'bg-purple-100' : ''}`}
                          onClick={() => handleSelectSong(song)}
                        >
                          <div className="font-medium text-black">{song.title}</div>
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <span className={`px-1.5 py-0.5 rounded ${song.type === 'hymn' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                              {song.type === 'hymn' ? 'Hymn' : 'Contemporary'}
                            </span>
                            {song.type === 'hymn' ? (
                              <span className="ml-2">{`#${song.number} (${song.hymnal || 'Unknown'})`}</span>
                            ) : (
                              <span className="ml-2">{song.author}</span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <EmptyState
                      icon={Search}
                      title="No Songs Found"
                      message="No songs match your search criteria. Try different keywords or filters."
                      size="sm"
                    />
                  )}
                </div>
              </div>

              {/* Song Details/Editor */}
              <div className="md:col-span-2 border rounded-lg overflow-hidden bg-white">
                {selectedSong ? (
                  showSongEditor ? (
                    <div>
                      <div className="bg-gray-50 p-3 border-b flex justify-between items-center">
                        <h3 className="font-medium text-gray-700">Edit Song</h3>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setShowSongEditor(false)}>
                            <X className="w-4 h-4 mr-1" /> Cancel
                          </Button>
                          <Button className="bg-purple-700" size="sm" onClick={handleUpdateSong}>
                            <Save className="w-4 h-4 mr-1" /> Save
                          </Button>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <Input 
                              value={editingSong.title || ''} 
                              onChange={e => handleEditorInputChange('title', e.target.value)} 
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                            <select 
                              value={editingSong.type || 'hymn'} 
                              onChange={e => handleEditorInputChange('type', e.target.value)}
                              className="w-full p-2 border rounded-md"
                            >
                              <option value="hymn">Hymn</option>
                              <option value="contemporary">Contemporary</option>
                            </select>
                          </div>
                        </div>
                        {editingSong.type === 'hymn' ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Hymn Number</label>
                              <Input 
                                value={editingSong.number || ''} 
                                onChange={e => handleEditorInputChange('number', e.target.value)} 
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Hymnal</label>
                              <select 
                                value={editingSong.hymnal || ''} 
                                onChange={e => handleEditorInputChange('hymnal', e.target.value)}
                                className="w-full p-2 border rounded-md"
                              >
                                <option value="">Select Hymnal</option>
                                {hymnalVersions.map(version => (
                                  <option key={version.id} value={version.id}>
                                    {version.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Hymnary.org Link</label>
                              <Input 
                                value={editingSong.hymnaryLink || ''} 
                                onChange={e => handleEditorInputChange('hymnaryLink', e.target.value)} 
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Author/Artist</label>
                              <Input 
                                value={editingSong.author || ''} 
                                onChange={e => handleEditorInputChange('author', e.target.value)} 
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">SongSelect Link</label>
                              <Input 
                                value={editingSong.songSelectLink || ''} 
                                onChange={e => handleEditorInputChange('songSelectLink', e.target.value)} 
                              />
                            </div>
                          </div>
                        )}
                        
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Seasonal Appropriateness</label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {liturgicalSeasons.map(season => (
                              <button
                                key={season.id}
                                onClick={() => handleSeasonalTagToggle(season.id)}
                                className={`flex items-center justify-between p-2 rounded-md border ${
                                  editingSong.seasonalTags?.includes(season.id)
                                    ? 'bg-purple-100 border-purple-500 text-purple-800'
                                    : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                <span>{season.name}</span>
                                {editingSong.seasonalTags?.includes(season.id) && (
                                  <Check className="w-4 h-4 text-purple-600" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                          <textarea 
                            value={editingSong.notes || ''} 
                            onChange={e => handleEditorInputChange('notes', e.target.value)}
                            className="w-full p-2 border rounded-md min-h-[100px]"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="bg-gray-50 p-3 border-b flex justify-between items-center">
                        <h3 className="font-medium text-gray-700">Song Details</h3>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={handleEditSong}>
                            <Edit className="w-4 h-4 mr-1" /> Edit
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setShowMergeModal(true)}>
                            <GitMerge className="w-4 h-4 mr-1" /> Merge
                          </Button>
                          <Button variant="destructive" size="sm" onClick={handleConfirmDelete}>
                            <Trash2 className="w-4 h-4 mr-1" /> Delete
                          </Button>
                        </div>
                      </div>
                      <div className="p-4">
                        <h2 className="text-2xl font-bold text-purple-700 mb-1">{selectedSong.title}</h2>
                        <div className="flex items-center mb-4">
                          <span className={`px-2 py-0.5 rounded text-xs ${selectedSong.type === 'hymn' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                            {selectedSong.type === 'hymn' ? 'Hymn' : 'Contemporary'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                          {selectedSong.type === 'hymn' ? (
                            <>
                              <div>
                                <label className="block text-xs font-medium text-gray-500">Hymn Number</label>
                                <p className="text-black">{selectedSong.number || 'Not specified'}</p>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-500">Hymnal</label>
                                <p className="text-black">
                                  {selectedSong.hymnal ? 
                                    hymnalVersions.find(v => v.id === selectedSong.hymnal)?.name || selectedSong.hymnal : 
                                    'Not specified'
                                  }
                                </p>
                              </div>
                              {selectedSong.hymnaryLink && (
                                <div className="md:col-span-2">
                                  <label className="block text-xs font-medium text-gray-500">Hymnary.org Link</label>
                                  <a 
                                    href={selectedSong.hymnaryLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline break-all"
                                  >
                                    {selectedSong.hymnaryLink}
                                  </a>
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-gray-500">Author/Artist</label>
                                <p className="text-black">{selectedSong.author || 'Not specified'}</p>
                              </div>
                              {selectedSong.songSelectLink && (
                                <div className="md:col-span-2">
                                  <label className="block text-xs font-medium text-gray-500">SongSelect Link</label>
                                  <a 
                                    href={selectedSong.songSelectLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline break-all"
                                  >
                                    {selectedSong.songSelectLink}
                                  </a>
                                </div>
                              )}
                            </>
                          )}
                          {selectedSong.youtubeLink && (
                            <div className="md:col-span-2">
                              <label className="block text-xs font-medium text-gray-500">YouTube Link</label>
                              <a 
                                href={selectedSong.youtubeLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-red-600 hover:underline break-all"
                              >
                                {selectedSong.youtubeLink}
                              </a>
                            </div>
                          )}
                        </div>
                        {selectedSong.notes && (
                          <div className="mt-4">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                            <div className="bg-gray-50 p-3 rounded-md whitespace-pre-wrap">{selectedSong.notes}</div>
                          </div>
                        )}
                        
                        {/* Song Usage History */}
                        <div className="mt-6 pt-4 border-t border-gray-200">
                          <h3 className="text-sm font-medium text-gray-700 mb-2">Recent Usage</h3>
                          <div className="text-sm text-gray-500">
                            {selectedSong.usageCount ? (
                              <span>Used {selectedSong.usageCount} times</span>
                            ) : (
                              <span>No recent usage recorded</span>
                            )}
                          </div>
                        </div>

                        {/* Song Details View - Add after YouTube link section */}
                        {selectedSong && !showSongEditor && (
                          <div className="mt-4">
                            <label className="block text-xs font-medium text-gray-500">Seasonal Appropriateness</label>
                            {selectedSong.seasonalTags && selectedSong.seasonalTags.length > 0 ? (
                              <div className="flex flex-wrap gap-2 mt-1">
                                {selectedSong.seasonalTags.map(tag => {
                                  const season = liturgicalSeasons.find(s => s.id === tag);
                                  return (
                                    <div key={tag} className="flex items-center">
                                      <span 
                                        className="px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-800"
                                        style={{borderLeft: `3px solid ${season?.color || '#888'}`}}
                                      >
                                        {season?.name || tag}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-gray-500 text-sm mt-1">No seasonal tags assigned</p>
                            )}
                          </div>
                        )}

                        {/* Song Details - Add rotation status display */}
                        {selectedSong && !showSongEditor && (
                          <div className="mt-4">
                            <label className="block text-xs font-medium text-gray-500">Rotation Status</label>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {getRotationStatusDisplay(selectedSong)?.map((status, index) => (
                                <div 
                                  key={index}
                                  className={`flex items-center px-2 py-1 rounded-md text-xs border ${status.color}`}
                                  title={status.tooltip}
                                >
                                  {status.icon}
                                  <span>{status.label}</span>
                                </div>
                              ))}
                              {(!selectedSong.rotationStatus || getRotationStatusDisplay(selectedSong)?.length === 0) && (
                                <p className="text-gray-500 text-sm">No rotation data available</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Add this after the Rotation Status section */}
                        {selectedSong && !showSongEditor && (
                          <div className="mt-6 pt-4 border-t border-gray-200">
                            <Button
                              onClick={handleOpenServiceModal}
                              className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md flex items-center justify-center gap-1"
                            >
                              <Calendar className="w-4 h-4 mr-1" />
                              <span>Add to Service</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    <Music className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                    <p>Select a song to view details</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Delete Confirmation Modal */}
          {showConfirmDelete && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg w-full max-w-md">
                <h2 className="text-xl font-bold text-red-600 mb-4">Delete Song</h2>
                <p className="mb-4">
                  Are you sure you want to delete "{selectedSong?.title}"? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowConfirmDelete(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteSong}>
                    Delete Song
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Add the Merge Modal */}
          {showMergeModal && selectedSong && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg w-full max-w-md">
                <h2 className="text-xl font-bold text-purple-700 mb-4">Merge Song</h2>
                <p className="mb-4">
                  Merge "{selectedSong.title}" into another song. This will move all usage history to the target song and delete this song.
                </p>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search for target song
                  </label>
                  <Input
                    type="text"
                    placeholder="Type to search..."
                    value={mergeSearchTerm}
                    onChange={(e) => findMergeCandidates(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                {mergeCandidates.length > 0 ? (
                  <div className="max-h-60 overflow-y-auto border rounded mb-4">
                    <ul className="divide-y divide-gray-200">
                      {mergeCandidates.map(song => (
                        <li
                          key={song._id}
                          className="p-3 cursor-pointer hover:bg-purple-50 flex flex-col"
                          onClick={() => setMergeTargetSong(song)}
                        >
                          <span className="font-medium text-black">{song.title}</span>
                          <span className="text-xs text-gray-500">
                            {song.type === 'hymn' 
                              ? `Hymn #${song.number} (${song.hymnal || 'Unknown'})`
                              : `${song.author || 'Unknown artist'}`
                            }
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : mergeSearchTerm.length >= 2 ? (
                  <p className="text-gray-500 mb-4">No matching songs found</p>
                ) : null}
                
                {mergeTargetSong && (
                  <div className="bg-purple-50 p-3 rounded border border-purple-200 mb-4">
                    <div className="font-medium">Selected target:</div>
                    <div className="text-black">{mergeTargetSong.title}</div>
                    <div className="text-xs text-gray-600">
                      {mergeTargetSong.type === 'hymn' 
                        ? `Hymn #${mergeTargetSong.number} (${mergeTargetSong.hymnal || 'Unknown'})`
                        : `${mergeTargetSong.author || 'Unknown artist'}`
                      }
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setMergeCandidates([]);
                      setMergeSearchTerm('');
                      setMergeTargetSong(null);
                      setShowMergeModal(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => handleMergeSongs(mergeTargetSong)}
                    disabled={!mergeTargetSong}
                  >
                    Merge Songs
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Service Selection Modal */}
          {showServiceModal && selectedSong && (
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
                      <LoadingSpinner size="md" className="border-purple-700 mx-auto mb-1" />
                      <p className="text-sm">Loading services...</p>
                    </div>
                  ) : upcomingServices.length === 0 ? (
                    <EmptyState
                      icon={Calendar}
                      title="No Upcoming Services"
                      message="Services will appear here when scheduled."
                      size="sm"
                    />
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
                                              onClick={async () => {
                                                const confirmed = await confirm({
                                                  title: 'Replace Song',
                                                  message: `Replace "${position.selectionDetails.title}" with "${selectedSong.title}"?`,
                                                  variant: 'warning',
                                                  confirmText: 'Replace',
                                                  cancelText: 'Cancel'
                                                });

                                                if (confirmed) {
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
                          <LoadingSpinner size="sm" color="white" className="mr-2" />
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
        </TabsContent>

        {/* Rediscovery Tab */}
        <TabsContent value="rediscovery" className="space-y-4">
          <SongRediscoveryPanel />
        </TabsContent>

        <TabsContent value="reference" className="space-y-4">
          <ReferenceSongPanel />
        </TabsContent>

        {/* Planning Guide Tab */}
        <TabsContent value="planning" className="space-y-4">
          <SeasonalPlanningGuide />
        </TabsContent>
      </Tabs>

      {/* Seasonal Tagging Tool Modal */}
      {showTaggingTool && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold">Seasonal Song Tagging</h2>
              <button 
                onClick={() => setShowTaggingTool(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            <SeasonalTaggingTool />
          </div>
        </div>
      )}
      <ConfirmDialog />
    </div>
  );
};

export default SongDatabase;
