import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, Music, Youtube, Link, BookOpen, AlertCircle, Edit2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import SongSection from './SongSection';
import Logger from '@/utils/logger'

// Constants
const hymnalVersions = [
  { id: 'cranberry', name: 'Cranberry' },
  { id: 'green', name: 'Green' },
  { id: 'blue', name: 'Blue' }
];

// Add this function near the top of the file
const checkForDuplicateSongs = async (songs, currentDate) => {
  const duplicates = [];
  const currentServiceDate = new Date(currentDate); // This might be the issue
  console.log('Checking songs:', songs, 'for date:', currentDate);

  for (const song of songs) {
    if (!song?.title) continue;

    try {
      const response = await fetch(`/api/song-usage?title=${encodeURIComponent(song.title)}&months=1`);
      if (!response.ok) {
        console.error('Error response from song-usage API:', await response.text());
        continue;
      }

      const usage = await response.json();
      console.log('Raw usage data for', song.title, ':', usage);

      // Fix date comparison
      const fourWeeksAgo = new Date(currentServiceDate);
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

      const recentUsage = usage.filter(u => {
        const usageDate = new Date(u.dateUsed);
        // Add more detailed logging
        console.log('Comparing dates:', {
          songTitle: song.title,
          usageDate: usageDate.toISOString(),
          fourWeeksAgo: fourWeeksAgo.toISOString(),
          currentServiceDate: currentServiceDate.toISOString(),
        });
        // Fix date comparison
        return usageDate >= fourWeeksAgo && usageDate < currentServiceDate;
      });

      if (recentUsage.length > 0) {
        duplicates.push({
          title: song.title,
          usedOn: recentUsage.map(u => ({
            date: new Date(u.dateUsed).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            }),
            service: u.service || 'Sunday Service'
          }))
        });
      }
    } catch (error) {
      console.error('Error checking song usage:', error);
    }
  }

  console.log('Final duplicates found:', duplicates);
  return duplicates;
};

const formatDuplicateWarning = (duplicates) => {
  const formattedMessage = duplicates.map(d => {
    const usageList = d.usedOn.map(u =>
      `• ${u.date} (${u.service})`
    ).join('\n');

    return `"${d.title}" was recently used on:\n${usageList}`;
  }).join('\n\n');

  return `Warning: The following songs have been used in the last 4 weeks:\n\n${formattedMessage}\n\nDo you want to use these songs anyway?`;
};

const recordSongUsage = async (songs, date, serviceType, currentUser) => {
  try {
    console.log('Recording songs for date:', date, 'service:', serviceType);

    // Filter out empty songs before recording
    const validSongs = songs.filter(song => song?.title?.trim());

    await Promise.all(validSongs.map(song =>
      fetch('/api/song-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: song.title,
          type: song.type,
          date: date,
          service: serviceType,
          addedBy: currentUser?.name || 'Unknown',
          number: song.number,
          hymnal: song.hymnal,
          author: song.author,
          hymnaryLink: song.sheetMusic,
          songSelectLink: song.sheetMusic,
          youtubeLink: song.youtube,
          notes: song.notes
        })
      })
    ));
  } catch (error) {
    console.error('Error recording song usage:', error);
  }
};

// First, create a custom hook for debounced song search
const useDebouncedSongSearch = (type, availableSongs, onSongFound) => {
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm && searchTerm.length >= 2) { // Only search after 2 characters
        const songs = type === 'hymn' ? availableSongs?.hymn : availableSongs?.contemporary;
        // Improve matching to include partial matches
        const matches = songs?.filter(song =>
          song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (song.number && song.number.toString().startsWith(searchTerm))
        ).slice(0, 5); // Limit to 5 suggestions for performance

        if (matches?.length > 0) onSongFound(matches);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm, type, availableSongs, onSongFound]);

  return setSearchTerm;
};

// Add this function near the top
const cleanSongSelections = (selections) => {
  if (!selections) return {};

  const cleanedSelections = {};
  Object.entries(selections).forEach(([slot, selection]) => {
    if (selection?.title) {
      cleanedSelections[slot] = {
        ...selection,
        title: selection.title.trim(),
        number: selection.number?.trim() || '',
        hymnal: selection.hymnal?.trim() || '',
        author: selection.author?.trim() || '',
        sheetMusic: selection.sheetMusic?.trim() || '',
        youtube: selection.youtube?.trim() || '',
        notes: selection.notes?.trim() || '',
      };
    }
  });
  return cleanedSelections;
};

// Add near other helper functions
const isValidSongData = (song) => {
  if (!song) return false;
  
  // For hymns, require at least title and number
  if (song.type === 'hymn') {
    return Boolean(song.title && song.number);
  }
  
  // For contemporary songs, require at least title
  return Boolean(song.title);
};

const ServiceSongSelector = ({
  date,
  currentUser,
  serviceDetails,
  setServiceDetails,
  expanded,
  onToggleExpand,
  team,
  onEditTeam,
  customServices,
  availableSongs,
  header,
  ...props
}) => {
  // Set context for all logs in this component
  Logger.setContext('ServiceSongSelector');

  const [serviceSongStates, setServiceSongStates] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');
  const [alertPosition, setAlertPosition] = useState({ x: 0, y: 0 });
  const formRef = useRef(null); // Add this ref

  // First, update useEffect for proper state initialization
  // Update the useEffect that handles fetching selections
  useEffect(() => {
    if (!expanded) return;

    const fetchSelections = async () => {
      setIsLoading(true);
      try {
        const selectionsResponse = await fetch(`/api/service-songs?date=${date}`);
        if (!selectionsResponse.ok) throw new Error('Failed to fetch selections');
        const selectionsData = await selectionsResponse.json();

        if (selectionsData?.selections) {
          const cleanedSelections = cleanSongSelections(selectionsData.selections);
          setServiceSongStates(cleanedSelections);

        }
      } catch (error) {
        Logger.error('Failed to fetch selections:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSelections();
  }, [expanded, date]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Service Details:', {
        date,
        elements: serviceDetails?.elements,
        serviceSongStates
      });
    }
  }, [date, serviceDetails?.elements, serviceSongStates]);

  // Add near top of component
  useEffect(() => {
    console.log('Service Data:', {
      date,
      serviceDetails,
      elements: serviceDetails?.elements,
    });
  }, [date, serviceDetails]);

  const handleSongStateUpdate = useCallback((slot, newState) => {
    setServiceSongStates(prev => {
      // Create a clean state object with only valid slots
      const cleanState = {};
      for (let i = 0; i < 3; i++) {
        const validSlot = `song_${i}`;
        if (prev[validSlot]) {
          cleanState[validSlot] = prev[validSlot];
        }
      }

      // Add new state
      return {
        ...cleanState,
        [slot]: {
          ...cleanState[slot],
          ...newState
        }
      };
    });
  }, []);

  const getWeekInfo = (dateStr) => {
    const [month, day, year] = dateStr.split('/').map(Number);
    const date = new Date(2000 + year, month - 1, day);

    // Get start of week (Sunday)
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());

    // Get end of week (Saturday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    // Format as MM/DD/YY for consistency
    const weekKey = `${startOfWeek.getMonth() + 1}/${startOfWeek.getDate()}/${year}`;

    return {
      weekKey,
      weekNum: getWeekNumber(dateStr),
      isFirstOfWeek: date.getDay() === 0, // Sunday
      isWeekend: date.getDay() === 0 || date.getDay() === 6
    };
  };

  // Helper function to get week number for a date
  const getWeekNumber = (dateStr) => {
    const [month, day, year] = dateStr.split('/').map(Number);
    const date = new Date(2000 + year, month - 1, day);
    const startOfYear = new Date(2000 + year, 0, 1);
    const days = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
  };

  const getWeekStyles = (date) => {
    const { weekNum, isFirstOfWeek } = getWeekInfo(date);
    return `flex justify-between items-center p-3 cursor-pointer transition-colors duration-200 
    ${weekNum % 2 === 0 ? 'bg-purple-100/20' : 'bg-purple-50/20'}
    ${isFirstOfWeek ? 'border-t-2 border-t-purple-200/20' : ''}`;
  };

  const getWeekClasses = (dateStr) => {
    const { weekNum, isFirstOfWeek } = getWeekInfo(dateStr);

    // Base classes that will always be applied
    const baseClasses = "flex justify-between items-center p-3 cursor-pointer transition-colors duration-200";

    // Week alternating background classes
    const bgClass = weekNum % 2 === 0 ? "bg-purple-50/30" : "bg-purple-100/20";

    // Border classes for week separation
    const borderClass = isFirstOfWeek
      ? "border-t-2 border-purple-200/20"
      : "border-t border-purple-100/10";

    return `${baseClasses} ${bgClass} ${borderClass}`;
  }

  // Add this helper function near your other helper functions
  const getReadingSections = (serviceDetails) => {
    if (!serviceDetails?.elements) return [];

    return serviceDetails.elements
      .filter(element =>
        element.type === 'reading' ||
        element.type === 'message' ||
        (element.type === 'liturgy' &&
          (element.content.toLowerCase().includes('reading:') ||
            element.content.toLowerCase().includes('sermon:') ||
            element.content.toLowerCase().includes('gospel:')))
      )
      .map((element) => {
        const isSermon = element.type === 'message' ||
          element.content.toLowerCase().includes('sermon:');

        let label = '';
        let content = element.content;

        // Split only on first colon
        const colonIndex = element.content.indexOf(':');
        if (colonIndex !== -1) {
          label = element.content.substring(0, colonIndex).trim();
          content = element.content.substring(colonIndex + 1).trim();
        } else {
          label = element.label || '';
        }

        return {
          id: element.id || `reading_${Math.random().toString(36).substr(2, 9)}`,
          label: label,
          content: content,
          reference: element.reference || '',
          type: element.type,
          isSermon
        };
      });
  };

  // Add this after getReadingSections
  const getRequiredSongSections = (serviceDetails) => {
    if (!serviceDetails?.elements) return [];

    return serviceDetails.elements
      .filter(element => element.type === 'song_hymn')
      .map((element, index) => {
        // Ensure we always have a numeric index for the ID
        const songId = index.toString();

        return {
          id: `song_${songId}`, // Always use numeric index for consistency
          label: element.content?.split(':')[0]?.trim() || 'Song',
          content: element.content || '',
          reference: element.reference || '',
          selection: element.selection || null
        };
      });
  };

  // Memoize showAlertMessage
  const showAlertMessage = useCallback((message, type = 'success') => {
    console.log('showAlertMessage called with:', message, type); // Add this
    setAlertMessage(message);
    setAlertType(type);
    setShowAlert(true);

    // Make sure we're finding the form correctly
    if (formRef.current) {
      const rect = formRef.current.getBoundingClientRect();
      setAlertPosition({
        x: rect.left + rect.width / 2,
        y: rect.top
      });
      console.log('Alert position set to:', rect.left + rect.width / 2, rect.top); // Add this
    } else {
      console.log('Form element not found'); // Add this
    }

    // Increase timeout and add cleanup
    const timeoutId = setTimeout(() => {
      setShowAlert(false);
      console.log('Alert hidden by timeout'); // Add this
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, []); // Empty dependency array since it only uses setState functions

  const formatHymnalName = (hymnal) => {
    if (!hymnal) return '';
    return hymnal.charAt(0).toUpperCase() + hymnal.slice(1);
  };

  // Update the formatSongDisplay function
const formatSongDisplay = (song) => {
  if (!song?.title) return null;
  
  // Preserve the original label from the element content
  const prefix = song.content?.split(':')[0] || 'Song';
  
  // Format based on song type
  let songDetails;
  if (song.type === 'hymn') {
    songDetails = `${song.title} #${song.number} (${formatHymnalName(song.hymnal)})`;
  } else {
    // Contemporary song
    songDetails = song.author ? `${song.title} - ${song.author}` : song.title;
  }
  
  return `${prefix}: ${songDetails}`;
};

  // Handle form submission
  // Update the handleSubmit function to include duplicate song checking
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Check for duplicate songs before saving
      const songSelections = Object.values(serviceSongStates);
      const duplicates = await checkForDuplicateSongs(songSelections, date);

      if (duplicates.length > 0) {
        // Create warning message
        const warningMessage = formatDuplicateWarning(duplicates);

        // Show confirmation dialog
        const confirmUse = window.confirm(warningMessage);

        if (!confirmUse) {
          setIsSaving(false);
          return; // Exit without saving if user cancels
        }
      }

      // Add this section to save songs to the songs collection
      await Promise.all(songSelections.map(async (song) => {
        if (!isValidSongData(song)) return;
        
        try {
          await fetch('/api/songs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: song.title,
              type: song.type,
              number: song.number || '',
              hymnal: song.hymnal || '',
              author: song.author || '',
              hymnaryLink: song.type === 'hymn' ? song.sheetMusic : '',
              songSelectLink: song.type === 'contemporary' ? song.sheetMusic : '',
              youtubeLink: song.youtube || '',
              notes: song.notes || '',
              lastUpdated: new Date().toISOString()
            })
          });
        } catch (error) {
          console.error(`Failed to save song: ${song.title}`, error);
        }
      }));

      // Proceed with existing save logic...
      const serviceSongsResponse = await fetch('/api/service-songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          selections: serviceSongStates,
          updatedBy: currentUser?.name
        })
      });

      if (!serviceSongsResponse.ok) {
        throw new Error('Failed to save to service_songs');
      }

      // Get all song selections as an array
      let currentSongIndex = 0;

      // Then map the songs to the elements array
      const updatedElements = serviceDetails.elements.map(element => {
        if (element.type === 'song_hymn') {
          const matchingSong = songSelections[currentSongIndex];
          currentSongIndex++;

          // Get the original prefix/label WITHOUT any existing song info
          const prefix = element.content.split(':')[0].split(' - ')[0].trim();

          if (matchingSong?.title) {
            // Format song details based on type
            const songDetails = matchingSong.type === 'hymn'
              ? `${matchingSong.title} #${matchingSong.number} (${formatHymnalName(matchingSong.hymnal)})`
              : matchingSong.author 
                ? `${matchingSong.title} - ${matchingSong.author}`
                : matchingSong.title;

            console.log('Formatting song:', {
              prefix,
              songDetails,
              finalContent: `${prefix}: ${songDetails}`
            });

            return {
              ...element,
              selection: {
                ...matchingSong,
                content: prefix // Store original prefix with selection
              },
              content: `${prefix}: ${songDetails}`
            };
          }
          
          return {
            ...element,
            selection: null,
            content: `${prefix}: <Awaiting Song Selection>`
          };
        }
        return element;
      });

      // Debug the final elements array
      console.log('Final updated elements:', updatedElements);

      // Update serviceDetails collection
      const serviceDetailsResponse = await fetch('/api/service-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          elements: updatedElements,
          content: serviceDetails.content,
          type: serviceDetails.type,
          setting: serviceDetails.setting
        })
      });

      if (!serviceDetailsResponse.ok) {
        throw new Error('Failed to update service details');
      }

      // After successful save, record the song usage
      await recordSongUsage(songSelections, date, serviceDetails?.type, currentUser);

      // Update local state
      setServiceDetails(prev => ({
        ...prev,
        [date]: {
          ...prev[date],
          elements: updatedElements
        }
      }));

      console.log('About to show success message'); // Add this
      showAlertMessage('Songs saved successfully');
      console.log('Success message should be shown'); // Add this
    } catch (error) {
      console.error('Error saving songs:', error);
      showAlertMessage('Failed to save songs', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="border rounded-lg shadow-sm bg-white flex flex-col relative"> {/* Add relative */}
      {showAlert && (
        <Alert
          className={`fixed z-[60] w-80 bg-white border-${alertType === 'success' ? 'purple' : 'red'}-700 shadow-lg rounded-lg`}
          style={{
            top: `${alertPosition.y}px`,
            left: `${alertPosition.x}px`,
            transform: 'translate(-50%, -120%)',
            position: 'fixed', // Make sure position is fixed
          }}
        >
          <div className="flex items-center gap-2 p-2">
            <AlertCircle className={`w-5 h-5 text-${alertType === 'success' ? 'purple' : 'red'}-700`} />
            <AlertDescription className="text-black font-medium">
              {alertMessage}
            </AlertDescription>
          </div>
        </Alert>
      )}

      <div className={getWeekClasses(date)}>
        <div className="flex items-center justify-between w-full">
          {header ? (
            <div className="w-full">{header}</div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-black truncate">
                    {dates?.find(d => d.date === date)?.title || 'Service Title'}
                  </h3>
                  {serviceDetails?.type ? (
                    <span className="text-xs px-2 py-0.5 rounded flex-shrink-0 text-gray-600 bg-gray-100">
                      {serviceDetails.type === 'communion' ? 'Communion' :
                        serviceDetails.type === 'communion_potluck' ? 'Communion & Potluck' :
                          serviceDetails.type === 'no_communion' ? 'No Communion' :
                            (serviceDetails.type.startsWith('service_') && customServices?.find(s => s.id === serviceDetails.type)?.name) ||
                            serviceDetails.name ||
                            'Custom Service'}
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded flex-shrink-0 text-amber-600 bg-amber-50 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Awaiting Pastor Input
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-600">{date}</div>
              </div>

              <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                <div className="flex items-center gap-2">
                  <div
                    className="flex items-center gap-1 bg-purple-100 rounded px-2 py-0.5 cursor-pointer hover:bg-purple-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onEditTeam) {
                        onEditTeam(date); // Pass the date when calling onEditTeam
                      }
                    }}
                  >
                    <span className="text-xs text-purple-700 whitespace-nowrap">
                      {team || 'No team assigned'}
                    </span>
                    <Edit2 className="w-3 h-3 text-purple-700" />
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleExpand(date);
                  }}
                  className="ml-2"
                >
                  {expanded ?
                    <ChevronUp className="w-5 h-5 text-purple-700" /> :
                    <ChevronDown className="w-5 h-5 text-purple-700" />
                  }
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {expanded && (
        <div className="grid grid-cols-3 gap-4 p-3 overflow-y-auto">
          <div className="col-span-1 flex flex-col h-full">
            <div className="flex-1 bg-gray-50 rounded p-2 text-xs">
              <div className="flex items-center gap-1 mb-1 text-purple-700">
                <BookOpen className="w-3 h-3" />
                <span className="font-medium">Readings</span>
              </div>
              <div className="space-y-1">
                {serviceDetails ? (
                  getReadingSections(serviceDetails).map((section) => (
                    <p
                      key={section.id}
                      className={`text-black ${section.isSermon ? 'mt-2 pt-1 border-t text-purple-700' : ''}`}
                    >
                      {section.label && (
                        <span className="font-medium">{section.label}:</span>
                      )}
                      <span className="text-gray-900"> {section.content}</span>
                      {section.reference && (
                        <span className="text-gray-600 italic ml-1">
                          ({section.reference})
                        </span>
                      )}
                    </p>
                  ))
                ) : (
                  <p className="text-black italic">
                    Readings not yet available. Songs can be updated later.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-auto p-2 text-xs">
              <div className="flex gap-2 text-gray-500">
                <span>Reference:</span>
                <a
                  href="https://hymnary.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-700 hover:underline"
                >
                  Hymnary.org
                </a>
                <span>•</span>
                <a
                  href="https://songselect.ccli.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-700 hover:underline"
                >
                  SongSelect
                </a>
                <span>•</span>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-700 hover:underline"
                >
                  YouTube
                </a>
              </div>
            </div>
          </div>

          <div className="col-span-2">
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-2">
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700" />
                </div>
              ) : (
                <>
                  {getRequiredSongSections(serviceDetails).map((section) => (
                    <SongSection
                      key={section.id}
                      slot={section.id}
                      label={section.label}
                      songState={serviceSongStates[section.id] || {
                        type: 'hymn',
                        title: '',
                        number: '',
                        hymnal: '',
                        author: '',
                        sheetMusic: '',
                        youtube: '',
                        notes: ''
                      }}
                      onSongStateUpdate={handleSongStateUpdate}
                      availableSongs={availableSongs}
                      currentUser={currentUser}
                      hymnalVersions={hymnalVersions}
                    />
                  ))}
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className={`px-3 py-1 text-sm bg-purple-700 text-white rounded hover:bg-purple-800 
                      ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isSaving ? 'Saving...' : 'Save Songs'}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(ServiceSongSelector);