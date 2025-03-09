import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Music, FileText, BarChart2, Plus, X, Edit, Trash2, Save, AlertCircle, GitMerge } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Hymnal options
const hymnalVersions = [
  { id: 'cranberry', name: 'Cranberry' },
  { id: 'green', name: 'Green' },
  { id: 'blue', name: 'Blue' }
];

const SongDatabase = () => {
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
  const [songAnalytics, setSongAnalytics] = useState({
    frequency: [],
    byType: { hymn: 0, contemporary: 0 },
    seasonal: []
  });

  // Add a new state for the merge modal
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeTargetSong, setMergeTargetSong] = useState(null);
  const [mergeSearchTerm, setMergeSearchTerm] = useState('');
  const [mergeCandidates, setMergeCandidates] = useState([]);

  // Fetch songs and analytics data when component mounts
  useEffect(() => {
    const fetchSongsAndAnalytics = async () => {
      setIsLoading(true);
      try {
        // Fetch songs
        const songsResponse = await fetch('/api/songs');
        if (!songsResponse.ok) throw new Error('Failed to fetch songs');
        const songsData = await songsResponse.json();
        
        // Sort songs alphabetically by title
        songsData.sort((a, b) => a.title.localeCompare(b.title));
        setSongs(songsData);
        
        // Fetch song usage analytics
        const analyticsResponse = await fetch('/api/song-usage/analytics');
        if (analyticsResponse.ok) {
          const analyticsData = await analyticsResponse.json();
          
          // Process analytics data
          const byType = {
            hymn: songsData.filter(song => song.type === 'hymn').length,
            contemporary: songsData.filter(song => song.type === 'contemporary').length
          };
          
          setSongAnalytics({
            frequency: analyticsData.frequency || [],
            byType,
            seasonal: analyticsData.seasonal || []
          });
        }
      } catch (err) {
        setError(err.message);
        showAlertMessage(err.message, 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSongsAndAnalytics();
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
      const response = await fetch('/api/songs', {
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
      const usageResponse = await fetch(`/api/song-usage?title=${encodeURIComponent(selectedSong.title)}`);
      
      if (usageResponse.ok) {
        const usageData = await usageResponse.json();
        
        if (usageData && usageData.length > 0) {
          // Song has usage history, show special warning
          const usageWarning = `This song "${selectedSong.title}" has been used in ${usageData.length} services. If you delete this song, the historical data will be preserved but marked as referring to a deleted song.`;
          
          if (!window.confirm(usageWarning + "\n\nAre you sure you want to delete this song?")) {
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
      const response = await fetch(`/api/songs?id=${selectedSong._id}`, {
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
      const response = await fetch('/api/songs/merge', {
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
      
      // Refresh song list and analytics
      fetchSongsAndAnalytics();
      
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
      
      <Tabs defaultValue="library" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100">
          <TabsTrigger value="library" className="flex items-center gap-2 data-[state=active]:bg-white">
            <Music className="w-4 h-4" />
            <span>Song Library</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2 data-[state=active]:bg-white">
            <BarChart2 className="w-4 h-4" />
            <span>Song Analytics</span>
          </TabsTrigger>
        </TabsList>

        {/* Song Library Tab */}
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
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
                    <div className="p-6 text-center text-gray-500">
                      No songs found matching your search criteria.
                    </div>
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
                          <label className="block text-sm font-medium text-gray-700 mb-1">YouTube Link</label>
                          <Input 
                            value={editingSong.youtubeLink || ''} 
                            onChange={e => handleEditorInputChange('youtubeLink', e.target.value)} 
                          />
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
                            {songAnalytics.frequency
                              .filter(item => item.title === selectedSong.title)
                              .map(item => (
                                <div key={`${item.title}-usage`} className="text-sm">
                                  {item.count > 0 ? (
                                    <span>Used {item.count} times in the last year</span>
                                  ) : (
                                    <span>No recent usage recorded</span>
                                  )}
                                </div>
                              ))}
                          </div>
                        </div>
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
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Song Type Distribution */}
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Song Type Distribution</h3>
                <div className="flex items-center justify-center h-52">
                  <div className="flex items-end h-40 gap-8">
                    <div className="flex flex-col items-center">
                      <div className="bg-blue-500 w-16" style={{ height: `${(songAnalytics.byType.hymn / songs.length) * 100}%` }}></div>
                      <div className="mt-2 text-sm font-medium">Hymns</div>
                      <div className="text-xs text-gray-500">{songAnalytics.byType.hymn} songs</div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="bg-green-500 w-16" style={{ height: `${(songAnalytics.byType.contemporary / songs.length) * 100}%` }}></div>
                      <div className="mt-2 text-sm font-medium">Contemporary</div>
                      <div className="text-xs text-gray-500">{songAnalytics.byType.contemporary} songs</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Most Frequently Used Songs */}
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Most Frequently Used Songs</h3>
                {songAnalytics.frequency.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <th className="px-6 py-3">Song</th>
                          <th className="px-6 py-3">Type</th>
                          <th className="px-6 py-3">Uses (Last Year)</th>
                          <th className="px-6 py-3">Last Used</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {songAnalytics.frequency
                          .sort((a, b) => b.count - a.count)
                          .slice(0, 10)
                          .map(song => (
                            <tr key={song.title} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{song.title}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <span className={`px-2 py-0.5 rounded-full text-xs ${
                                  song.type === 'hymn' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                }`}>
                                  {song.type === 'hymn' ? 'Hymn' : 'Contemporary'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{song.count}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {song.lastUsed ? new Date(song.lastUsed).toLocaleDateString() : 'N/A'}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No usage data available yet</p>
                  </div>
                )}
              </div>

              {/* Seasonal Patterns */}
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Seasonal Song Usage</h3>
                {songAnalytics.seasonal.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {['Advent', 'Christmas', 'Lent', 'Easter', 'Pentecost', 'Ordinary Time'].map(season => {
                      const seasonData = songAnalytics.seasonal.find(s => s.season === season);
                      return (
                        <div key={season} className="border rounded p-3">
                          <h4 className="font-medium text-gray-700 mb-2">{season}</h4>
                          {seasonData?.songs?.length > 0 ? (
                            <ul className="text-sm space-y-1">
                              {seasonData.songs.slice(0, 5).map(song => (
                                <li key={song.title} className="flex justify-between">
                                  <span className="text-gray-800">{song.title}</span>
                                  <span className="text-gray-500">{song.count}x</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-gray-500">No data available</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No seasonal data available yet</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SongDatabase;
