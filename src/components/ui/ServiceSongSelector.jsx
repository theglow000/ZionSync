import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, Music, Youtube, Link, BookOpen, AlertCircle, Edit2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import SongSection from './SongSection';
import Logger from '@/utils/logger'
import { getSeasonForDate } from '../../lib/LiturgicalCalendarService';
import { LITURGICAL_SEASONS, MAJOR_FEAST_DAYS } from '../../lib/LiturgicalSeasons.js';

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
  // console.log('Checking songs:', songs, 'for date:', currentDate);

  for (const song of songs) {
    if (!song?.title) continue;

    try {
      const response = await fetch(`/api/song-usage?title=${encodeURIComponent(song.title)}&months=1`);
      if (!response.ok) {
        console.error('Error response from song-usage API:', await response.text());
        continue;
      }

      const usage = await response.json();
      // console.log('Raw usage data for', song.title, ':', usage);

      // Fix date comparison
      const fourWeeksAgo = new Date(currentServiceDate);
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

      const recentUsage = usage.filter(u => {
        const usageDate = new Date(u.dateUsed);
        // Add more detailed logging
        // console.log('Comparing dates:', {
        //   songTitle: song.title,
        //   usageDate: usageDate.toISOString(),
        //   fourWeeksAgo: fourWeeksAgo.toISOString(),
        //   currentServiceDate: currentServiceDate.toISOString(),
        // });
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

  // console.log('Final duplicates found:', duplicates);
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
    // console.log('Recording songs for date:', date, 'service:', serviceType);

    // Filter out empty songs before recording
    const validSongs = songs.filter(song => song?.title?.trim());

    // Process each song one by one to better handle errors
    for (const song of validSongs) {
      try {
        // First check if this song+date combination already exists
        const checkResponse = await fetch(`/api/song-usage/check?title=${encodeURIComponent(song.title)}&date=${encodeURIComponent(date)}`);
        const checkResult = await checkResponse.json();

        // If this song is already recorded for this date, skip it
        if (checkResult.exists) {
          // console.log(`Song "${song.title}" already recorded for ${date}, skipping`);
          continue;
        }

        // Add new usage record
        await fetch('/api/song-usage', {
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
        });

        // console.log(`Successfully recorded usage for "${song.title}" on ${date}`);
      } catch (songError) {
        console.error(`Error recording song "${song.title}":`, songError);
      }
    }
  } catch (error) {
    console.error('Error recording song usage:', error);
  }
};

// First, create a custom hook for debounced song search
const useDebouncedSongSearch = (type, availableSongs, onSongFound) => {
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm && searchTerm.length >= 2) { // Only search after  characters
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

// Add this function near other helper functions
const checkForMissingLinks = (songSelections) => {
  const songsWithMissingLinks = songSelections
    .filter(song => song?.title) // Only check songs with titles
    .map(song => {
      const missingLinks = [];

      if (song.type === 'hymn') {
        if (!song.sheetMusic) missingLinks.push('Hymnary.org');
      } else { // Contemporary
        if (!song.sheetMusic) missingLinks.push('SongSelect');
      }

      if (!song.youtube) missingLinks.push('YouTube');

      return {
        title: song.title,
        missingLinks
      };
    })
    .filter(result => result.missingLinks.length > 0);

  return songsWithMissingLinks;
};

const formatLinkWarning = (songsWithMissingLinks) => {
  const formattedMessage = songsWithMissingLinks.map(song => {
    return `• "${song.title}" is missing: ${song.missingLinks.join(', ')}`;
  }).join('\n');

  return `The following songs are missing reference links:\n\n${formattedMessage}\n\nAdding links helps other team members find resources for these songs.\n\nDo you want to save anyway?`;
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
  isMobile = false, // Add this prop
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

  // useEffect(() => {
  //   if (process.env.NODE_ENV === 'development') {
  //     console.log('Service Details:', {
  //       date,
  //       elements: serviceDetails?.elements,
  //       serviceSongStates
  //     });
  //   }
  // }, [date, serviceDetails?.elements, serviceSongStates]);

  // Add near top of component
  // useEffect(() => {
  //   console.log('Service Data:', {
  //     date,
  //     serviceDetails,
  //     elements: serviceDetails?.elements,
  //   });
  // }, [date, serviceDetails]);

  const handleSongStateUpdate = useCallback((slot, newState) => {
    setServiceSongStates(prev => {
      // Create a clean state object preserving all existing valid song slots
      const cleanState = {};
      const songSlotRegex = /^song_\d+$/;
      
      // Keep all existing slots that follow the song pattern
      Object.keys(prev).forEach(key => {
        if (songSlotRegex.test(key) && prev[key]) {
          cleanState[key] = prev[key];
        }
      });

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

  // Handle clearing a song (reverting to blank/pending state)
  const handleSongClear = useCallback((slot) => {
    // Create an empty song object that maintains the structure but clears all content
    const emptyState = {
      type: 'hymn',
      title: '',
      number: '',
      hymnal: '',
      author: '',
      sheetMusic: '',
      youtube: '',
      notes: ''
    };
    
    // Update the state to empty
    setServiceSongStates(prev => ({
      ...prev,
      [slot]: emptyState
    }));
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
      .filter(element => element.type === 'song_hymn' || element.type === 'song_contemporary')
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
    // console.log('showAlertMessage called with:', message, type); // Add this
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
      // console.log('Alert position set to:', rect.left + rect.width / 2, rect.top); // Add this
    } else {
      // console.log('Form element not found'); // Add this
    }

    // Increase timeout and add cleanup
    const timeoutId = setTimeout(() => {
      setShowAlert(false);
      // console.log('Alert hidden by timeout'); // Add this
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

    try {      // Check for duplicate songs before saving
      // FIXED: Create ordered array that preserves song slot positions
      const requiredSongSections = getRequiredSongSections(serviceDetails[date] || serviceDetails);
      const songSelections = requiredSongSections.map(section => serviceSongStates[section.id]).filter(song => song);
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

      // Add missing links check
      const songsWithMissingLinks = checkForMissingLinks(songSelections);
      if (songsWithMissingLinks.length > 0) {
        // Create warning message
        const linkWarningMessage = formatLinkWarning(songsWithMissingLinks);

        // Show confirmation dialog
        const confirmSave = window.confirm(linkWarningMessage);

        if (!confirmSave) {
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

      // FIXED: Update how we access service details
      // First check if serviceDetails is an object with date keys or if it's already the data for this date
      const serviceDetailsForDate = serviceDetails[date] || serviceDetails;

      // Now check if we have elements
      if (!serviceDetailsForDate?.elements) {
        console.error('Service details structure:', serviceDetails);
        throw new Error(`No service elements found for date: ${date}`);
      }

      // After successful save, record the song usage
      await recordSongUsage(songSelections, date, serviceDetailsForDate?.type, currentUser);

      // IMPROVED STATE UPDATE: Build updated elements locally to match server state
      const updatedElements = serviceDetailsForDate.elements.map((element, index) => {
        if (element.type === 'song_hymn' || element.type === 'song_contemporary') {
          // Find the matching song selection based on the element index
          let matchingSong = null;
          let songIndex = 0;
          
          // Count how many song elements come before this one (excluding liturgical songs)
          for (let i = 0; i < index; i++) {
            if (serviceDetailsForDate.elements[i].type === 'song_hymn' || 
                serviceDetailsForDate.elements[i].type === 'song_contemporary') {
              songIndex++;
            }
          }
          
          // Get the corresponding song selection
          const songKeys = Object.keys(serviceSongStates);
          if (songKeys[songIndex] && serviceSongStates[songKeys[songIndex]]?.title) {
            matchingSong = serviceSongStates[songKeys[songIndex]];
          }
          
          if (matchingSong?.title) {
            const prefix = element.content.split(':')[0].split(' - ')[0].trim();
            const songDetails = matchingSong.type === 'hymn'
              ? `${matchingSong.title} #${matchingSong.number} (${formatHymnalName(matchingSong.hymnal)})`
              : matchingSong.author
                ? `${matchingSong.title} - ${matchingSong.author}`
                : matchingSong.title;

            return {
              ...element,
              content: `${prefix}: ${songDetails}`,
              selection: {
                ...matchingSong,
                originalPrefix: prefix
              }
            };
          }
        }
        return element; // Preserve all non-song elements exactly as they are (including liturgical songs)
      });

      // Update local state - adapt based on the structure of serviceDetails
      if (serviceDetails[date]) {
        // If serviceDetails has dates as keys
        setServiceDetails(prev => ({
          ...prev,
          [date]: {
            ...prev[date],
            elements: updatedElements
          }
        }));
      } else {
        // If serviceDetails is already for the current date
        setServiceDetails(prev => ({
          ...prev,
          elements: updatedElements
        }));
      }

      // console.log('About to show success message');
      showAlertMessage('Songs saved successfully');
      // console.log('Success message should be shown');
      
      // Trigger immediate refresh to sync changes - reduced delay for better responsiveness
      console.log('🔄 Scheduling refresh event in 1 second...');
      setTimeout(() => {
        console.log('🔄 Dispatching refresh event to SignupSheet');
        window.dispatchEvent(new CustomEvent('refreshServiceDetails'));
      }, 1000); // Reduced delay from 3s to 1s for better responsiveness
    } catch (error) {
      console.error('Error saving songs:', error);
      showAlertMessage('Failed to save songs', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Add this before the return statement - define readings variable
  const readings = getReadingSections(serviceDetails);

  // Add this helper function to the component (before the return statement)
  const getSeasonInfo = (dateString) => {
    // First check if we already have season info from serviceDetails
    if (serviceDetails?.liturgical) {
      return {
        seasonName: serviceDetails.liturgical.seasonName || "Ordinary Time",
        seasonColor: serviceDetails.liturgical.color || "#556B2F",
        specialDay: serviceDetails.liturgical.specialDay
      };
    }
    
    // If header is provided, extract season from header class
    if (header) {
      const seasonClass = header?.props?.className?.match(/season-header-(\w+)/)?.[1];
      
      if (seasonClass) {
        // Convert CSS class to proper season format (e.g., "advent" to "ADVENT")
        const seasonId = seasonClass.toUpperCase();
        const season = LITURGICAL_SEASONS[seasonId];
        
        if (season) {
          return {
            seasonName: season.name,
            seasonColor: season.color,
            specialDay: null
          };
        }
      }
    }
    
    // If we couldn't get season info from other sources, get it from the date
    try {
      const info = getLiturgicalInfoForService(dateString);
      if (info) {
        return {
          seasonName: info.seasonName,
          seasonColor: info.seasonColor,
          specialDay: info.specialDay
        };
      }
    } catch (error) {
      console.error("Error getting liturgical info:", error);
    }
    
    // Default fallback
    return {
      seasonName: "Ordinary Time",
      seasonColor: "#556B2F",
      specialDay: null
    };
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

      {/* Only show this header if not in mobile mode or if no header is provided */}
      {!isMobile && (
        header ? (
          // Use the header directly with all its styling classes intact
          header
        ) : (
          // Default header if none provided
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
                  <span className="text-xs text-purple-700">
                    {team || 'No team assigned'}
                  </span>
                  <Edit2 className="w-3 h-3 flex-shrink-0 text-purple-700" />
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
        )
      )}

      {expanded && (
        <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-3'} gap-4 p-3 overflow-y-auto`}>
          {/* Season indicator */}
          <div className="col-span-full mb-2">
            {(() => {
              const seasonInfo = getSeasonInfo(date);
              return (
                <div className="flex items-center gap-2 text-sm">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{backgroundColor: seasonInfo.seasonColor}}
                  ></div>
                  <span className="font-medium">{seasonInfo.seasonName}</span>
                  {seasonInfo.specialDay && (
                    <span className="text-gray-600 ml-1">• {MAJOR_FEAST_DAYS[seasonInfo.specialDay]?.name}</span>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Rest of existing content */}
          {(!isMobile || (isMobile && readings.length > 0)) && (
            <div className={`${isMobile ? 'col-span-1' : 'col-span-1'} flex flex-col h-full`}>
              {isMobile ? (
                /* Mobile collapsible readings section */
                <details className="mb-2 group">
                  <summary className="flex items-center justify-between cursor-pointer text-purple-700 p-2 bg-gray-50 rounded font-medium text-sm">
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      <span>Readings & Sermon</span>
                    </div>
                    <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="p-2 text-xs bg-gray-50 rounded-b mt-1">
                    {readings.map((section) => (
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
                    ))}
                  </div>
                </details>
              ) : (
                /* Desktop readings section - keep as is */
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
              )}

              {/* Keep reference links - more compact for mobile */}
              {isMobile ? (
                <div className="flex justify-center gap-3 text-xs p-1">
                  <a href="https://hymnary.org" target="_blank" className="text-purple-700">Hymnary</a>
                  <a href="https://songselect.ccli.com" target="_blank" className="text-purple-700">SongSelect</a>
                  <a href="https://youtube.com" target="_blank" className="text-purple-700">YouTube</a>
                </div>
              ) : (
                /* Desktop reference links - keep as is */
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
              )}
            </div>
          )}

          {/* Song selection area - full width on mobile */}
          <div className={`${isMobile ? 'col-span-1' : 'col-span-2'}`}>
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
                      onSongClear={handleSongClear}
                      availableSongs={availableSongs}
                      currentUser={currentUser}
                      hymnalVersions={hymnalVersions}
                      isMobile={isMobile}
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