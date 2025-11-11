import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, UserCircle, X, Music2, CheckCircle2, ChevronUp, ChevronDown, AlertCircle, Edit2, Pencil, Database } from 'lucide-react';
import ServiceSongSelector from './ServiceSongSelector';
import MobileWorshipServiceCard from './MobileWorshipServiceCard';
import MobileWorshipSelect from './MobileWorshipSelect';
import TeamSelectionModal from './TeamSelectionModal';
import AddUserModal from './AddUserModal';
import useResponsive from '../../hooks/useResponsive';
import { useDebounce } from '../../hooks/useDebounce';
import { useAlertManager } from '../../hooks/useAlertManager';
import { LoadingSpinner } from '../shared';
import { ERROR_MESSAGES, SUCCESS_MESSAGES, createErrorHandler, createSuccessHandler } from '../../utils/errorHandler';
import { POLLING_INTERVAL, COLOR_THEMES, API_ENDPOINTS } from '../../lib/constants';
import { fetchWithTimeout, fetchWithRetry, parseJSON, apiPost, apiGet, apiDelete, apiPut } from '../../lib/api-utils';
import Link from 'next/link';
import '../../styles/liturgical-themes.css';
import { getSeasonClass, getSpecialServiceType, getHeaderClass, SpecialServiceIndicator } from '../liturgical/LiturgicalStyling';
import { LiturgicalDebugger } from '../liturgical/LiturgicalDebug';
import { YearSelector } from '../shared';

const WorshipTeam = ({ serviceDetails, setServiceDetails, selectedYear, setSelectedYear, availableYears }) => {
  // Use alert manager hook
  const { 
    showAlert, 
    alertMessage, 
    alertPosition, 
    setAlertPosition, 
    showAlertWithTimeout 
  } = useAlertManager();
  
  // Add this hook for responsive detection
  const { isMobile } = useResponsive();
  
  // All state declarations stay here
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [availableSongs, setAvailableSongs] = useState({ hymn: [], contemporary: [] });
  const [showTeamSelector, setShowTeamSelector] = useState(false);
  const [editingDate, setEditingDate] = useState(null);
  const [teams, setTeams] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [users, setUsers] = useState([]);
  const [dates, setDates] = useState([]);
  const [datesLoading, setDatesLoading] = useState(false);
  const [customServices, setCustomServices] = useState([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [pendingActions, setPendingActions] = useState({}); // Track pending debounced actions

  // Refs for auto-scrolling to current date (consolidated for both views)
  const dateRefs = useRef({});
  const componentRootRef = useRef(null);

  // Centralized error and success handlers (updated to use useAlertManager)
  const handleError = useMemo(
    () => createErrorHandler('Worship Team', (msg) => showAlertWithTimeout(msg), () => {}),
    [showAlertWithTimeout]
  );
  
  const handleSuccess = useMemo(
    () => createSuccessHandler((msg) => showAlertWithTimeout(msg), () => {}),
    [showAlertWithTimeout]
  );

  // Add this useEffect to fetch custom services
  useEffect(() => {
    const fetchCustomServices = async () => {
      try {
        const response = await fetchWithTimeout(API_ENDPOINTS.CUSTOM_SERVICES);
        if (!response.ok) throw new Error('Failed to fetch custom services');
        const data = await response.json();
        setCustomServices(data);
      } catch (error) {
        console.error('Error fetching custom services:', error);
      }
    };

    fetchCustomServices();
  }, []);

  // Sprint 4.2: Fetch dates dynamically based on selected year
  useEffect(() => {
    if (!selectedYear) return;
    
    const fetchDates = async () => {
      setDatesLoading(true);
      try {
        const response = await fetchWithTimeout(`/api/service-dates?year=${selectedYear}&upcomingOnly=false`);
        
        if (!response.ok) {
          if (response.status === 404) {
            handleError(
              new Error(`Services for ${selectedYear} have not been generated yet.`),
              `Please generate services for ${selectedYear} in Settings > Calendar Manager.`
            );
            setDates([]);
          } else {
            throw new Error('Failed to fetch service dates');
          }
          return;
        }
        
        const fetchedDates = await response.json();
        setDates(fetchedDates);
        
      } catch (error) {
        console.error('Error fetching dates for year:', selectedYear, error);
        handleError(error, 'Error loading service dates');
        setDates([]);
      } finally {
        setDatesLoading(false);
      }
    };
    
    fetchDates();
  }, [selectedYear, handleError]);

  // Auto-scroll to current date when dates are loaded
  useEffect(() => {
    if (!dates.length || isLoading || datesLoading) return;

    // Small delay to ensure DOM is fully rendered
    const timer = setTimeout(() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find the first date that is today or in the future
      const currentDateIndex = dates.findIndex(item => {
        const [month, day, year] = item.date.split('/').map(num => parseInt(num, 10));
        // Use 2000 + year to match existing codebase pattern
        const itemDate = new Date(2000 + year, month - 1, day);
        itemDate.setHours(0, 0, 0, 0);
        return itemDate >= today;
      });

      if (currentDateIndex !== -1) {
        const currentDate = dates[currentDateIndex].date;
        const targetElement = dateRefs.current[currentDate];
        
        if (targetElement) {
          if (isMobile) {
            // Mobile: Use scrollIntoView (works with scroll-margin-top CSS)
            targetElement.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          } else {
            // Desktop: Use scrollIntoView - browser handles optimal positioning
            targetElement.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }
        }
      }
    }, 1000); // Increased delay to 1000ms for mobile DOM rendering

    return () => clearTimeout(timer);
  }, [dates, isLoading, datesLoading, isMobile]);

  // Single fetch for songs on component mount
  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const response = await fetchWithTimeout(API_ENDPOINTS.SONGS);
        if (response.ok) {
          const songs = await response.json();
          setAvailableSongs({
            hymn: songs.filter(song => song.type === 'hymn'),
            contemporary: songs.filter(song => song.type === 'contemporary')
          });
        }
      } catch (error) {
        console.error('Error loading songs:', error);
      }
    };

    fetchSongs();
  }, []); // Empty dependency array - only fetch once

  // Add this useEffect to fetch teams and assignments
  useEffect(() => {
    const controller = new AbortController();
    const fetchTeamsAndAssignments = async () => {
      try {
        // Fetch worship users
        const usersResponse = await fetchWithTimeout(API_ENDPOINTS.WORSHIP_USERS, {
          signal: controller.signal
        });
        if (!usersResponse.ok) throw new Error('Failed to fetch users');
        const data = await usersResponse.json();

        // Filter and organize users
        const allUsers = data.users || [];

        setUsers(allUsers);
        setAvailableUsers(allUsers);

        // Fetch assignments
        const assignmentsResponse = await fetchWithTimeout(API_ENDPOINTS.WORSHIP_ASSIGNMENTS, {
          signal: controller.signal
        });
        if (!assignmentsResponse.ok) throw new Error('Failed to fetch assignments');
        const assignmentsData = await assignmentsResponse.json();

        // Convert assignments array to object with explicit boolean conversion
        const assignmentsObj = {};
        assignmentsData.forEach(assignment => {
          if (assignment.date) {
            // Get the service details for this date
            const service = serviceDetails[assignment.date];
            const hasSongs = service?.elements?.some(e =>
              e.type === 'song_hymn' && e.selection?.title
            );

            assignmentsObj[assignment.date] = {
              team: assignment.team,
              lastUpdated: assignment.lastUpdated
            };
          }
        });

        setAssignments(assignmentsObj);
        
        // Set loading to false after initial data is loaded
        setIsLoading(false);

      } catch (error) {
        if (error.name === 'AbortError') return;
        console.error('Error:', error);
        handleError(error, 'Error loading data');
        // Set loading to false even on error so user can see the error
        setIsLoading(false);
      }
    };

    fetchTeamsAndAssignments();

    // Cleanup function to abort fetch on unmount
    return () => controller.abort();
  }, []); // Empty dependency array

  useEffect(() => {
    let isSubscribed = true;

    const fetchServiceDetails = async () => {
      try {
        const response = await fetchWithTimeout(API_ENDPOINTS.SERVICE_DETAILS);
        if (!response.ok) throw new Error('Failed to fetch service details');
        const data = await response.json();

        if (isSubscribed) {
          setServiceDetails(prev => {
            const merged = { ...prev };
            Object.keys(data).forEach(date => {
              // Keep existing elements if they exist
              const existingElements = prev[date]?.elements || [];
              const newElements = data[date]?.elements || [];

              // Create a map for more efficient lookups
              const existingElementMap = new Map(
                existingElements.map(element => [
                  `${element.type}-${element.content?.split(':')[0]}`,
                  element
                ])
              );

              // Merge elements, preserving existing data
              const mergedElements = newElements.map(newElement => {
                const key = `${newElement.type}-${newElement.content?.split(':')[0]}`;
                const existingElement = existingElementMap.get(key);
                // Keep existing element data if it exists, otherwise use new element
                return existingElement ? { ...existingElement, ...newElement } : newElement;
              });

              // Keep any existing elements that weren't in the new data
              const preservedElements = existingElements.filter(existing => {
                const key = `${existing.type}-${existing.content?.split(':')[0]}`;
                return !newElements.some(newElem =>
                  `${newElem.type}-${newElem.content?.split(':')[0]}` === key
                );
              });

              merged[date] = {
                ...prev[date],          // Keep existing service data
                ...data[date],          // Add new data
                elements: [
                  ...mergedElements,    // Add merged elements
                  ...preservedElements  // Add preserved elements that weren't in new data
                ].filter(Boolean)       // Remove any null/undefined elements
              };
            });
            return merged;
          });
        }
      } catch (error) {
        console.error('Error fetching service details:', error);
      }
    };

    fetchServiceDetails();
    const intervalId = setInterval(fetchServiceDetails, POLLING_INTERVAL);

    return () => {
      isSubscribed = false;
      clearInterval(intervalId);
    };
  }, []);

  // Add this effect to initialize assignments
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const response = await fetchWithTimeout(API_ENDPOINTS.WORSHIP_ASSIGNMENTS);
        const data = await response.json();

        // Transform the data into the format we need
        const assignmentMap = data.reduce((acc, assignment) => {
          acc[assignment.date] = {
            team: assignment.team,
            lastUpdated: assignment.lastUpdated
          };
          return acc;
        }, {});

        setAssignments(assignmentMap);
      } catch (error) {
        console.error('Error fetching assignments:', error);
      }
    };

    fetchAssignments();
  }, []);

  // Inside the WorshipTeam component, add this handler:
  const handleEditTeam = useCallback((date) => {
    setEditingDate(date);
    setShowTeamSelector(true);
  }, []);

  // Add this function in WorshipTeam.jsx - wrapped with useCallback for performance
  const handleSongSelection = useCallback(async (date, songId, songData) => {
    // Store previous state for rollback
    const previousServiceDetails = serviceDetails[date];
    
    // Prepare updated elements
    const updatedElements = serviceDetails[date]?.elements.map(element => {
      if (element.type === 'song_hymn' && element.id === songId) {
        return {
          ...element,
          selection: songData
        };
      }
      return element;
    });

    // OPTIMISTIC UPDATE: Update UI immediately
    setServiceDetails(prev => ({
      ...prev,
      [date]: {
        ...prev[date],
        elements: updatedElements
      }
    }));
    
    try {
      // First update service-songs collection
      await fetchWithTimeout(API_ENDPOINTS.SERVICE_SONGS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date,
          selections: {
            [`song_${songId}`]: songData
          },
          updatedBy: currentUser?.name || 'Unknown'
        })
      });

      // Then update service-details collection
      await fetchWithTimeout(API_ENDPOINTS.SERVICE_DETAILS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date,
          elements: updatedElements,
          content: serviceDetails[date]?.content,
          type: serviceDetails[date]?.type
        })
      });

    } catch (error) {
      // ROLLBACK: Restore previous state on error
      setServiceDetails(prev => ({
        ...prev,
        [date]: previousServiceDetails
      }));
      
      handleError(error, { operation: 'selectSong', date, songId }, ERROR_MESSAGES.SONG_SELECT_ERROR);
    } finally {
      // Clear pending state
      setPendingActions(prev => {
        const newState = { ...prev };
        delete newState[`song-${date}-${songId}`];
        return newState;
      });
    }
  }, [currentUser, serviceDetails, handleError]);

  // Debounced version of handleSongSelection
  const [debouncedSongSelection] = useDebounce((date, songId, songData) => {
    setPendingActions(prev => ({ ...prev, [`song-${date}-${songId}`]: true }));
    handleSongSelection(date, songId, songData);
  }, 500);

  // Add a function to determine special services - wrapped with useCallback
  const isSpecialService = useCallback((title) => {
    const specialTitles = [
      'ash wednesday', 'palm sunday', 'maundy thursday', 'good friday',
      'easter', 'pentecost', 'reformation', 'all saints', 'thanksgiving',
      'christmas eve', 'christmas day', 'epiphany', 'transfiguration',
      'confirmation', 'baptism'
    ];

    const lowerTitle = title.toLowerCase();
    return specialTitles.some(special => lowerTitle.includes(special));
  }, []);

  // Helper to get season info from a date - wrapped with useCallback
  const getSeasonInfo = useCallback((date) => {
    const service = serviceDetails[date];
    if (!service?.liturgical) return { name: "", color: "", hasSpecialDay: false };

    return {
      name: service.liturgical.seasonName || "",
      color: service.liturgical.color || "",
      hasSpecialDay: !!service.liturgical.specialDay,
      specialDay: service.liturgical.specialDayName || ""
    };
  }, [serviceDetails]);

  // User management handlers - wrapped with useCallback for performance
  const handleAddUser = useCallback(() => {
    setShowAddUserModal(true);
  }, []);

  const handleAddUserSubmit = useCallback(async (name) => {
    try {
      await apiPost(API_ENDPOINTS.WORSHIP_USERS, { name });

      setAvailableUsers(prev => [...prev, { name }]);
      setShowAddUserModal(false);
      handleSuccess(SUCCESS_MESSAGES.USER_ADDED);
    } catch (error) {
      handleError(error, { operation: 'addUser', name }, ERROR_MESSAGES.USER_ADD_ERROR);
      throw error; // Re-throw to let modal handle error display
    }
  }, [handleSuccess, handleError]);

  const handleDeleteUser = useCallback(async (userName) => {
    try {
      await apiDelete(API_ENDPOINTS.WORSHIP_USERS, {
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: userName })
      });

      setAvailableUsers(prev => prev.filter(user => user.name !== userName));
      
      // If deleting current user, clear selection
      if (currentUser?.name === userName) {
        setCurrentUser(null);
      }

      handleSuccess('User removed successfully');
    } catch (error) {
      console.error('Error removing user:', error);
      handleError(error, 'Error removing user');
    }
  }, [currentUser]);

  const handleUserSelect = useCallback((user) => {
    // If clicking the current user, deselect them
    if (currentUser?.name === user.name) {
      setCurrentUser(null);
    } else {
      // Otherwise select the new user
      setCurrentUser({
        name: user.name,
        role: user.role,
        color: 'bg-purple-700 bg-opacity-20'
      });
    }
  }, [currentUser]);

  return (
    <Card ref={componentRootRef} className="w-full h-full mx-auto relative bg-white shadow-lg">
      {showAlert && (
        <Alert
          className={`fixed z-[60] w-80 bg-white border-purple-700 shadow-lg rounded-lg ${
            isMobile 
              ? 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2' 
              : ''
          }`}
          style={!isMobile ? {
            top: `${alertPosition.y}px`,
            left: `${alertPosition.x}px`,
            transform: 'translate(-50%, -120%)'
          } : {}}
        >
          <div className="flex items-center gap-2 p-2">
            <Mail className="w-5 h-5 text-purple-700" />
            <AlertDescription className="text-black font-medium">
              {alertMessage}
            </AlertDescription>
          </div>
        </Alert>
      )}

      <div className="flex flex-col h-full">
        {/* Sticky Header Section */}
        <div className="sticky top-0 z-10 bg-white">
          {/* Logo Header */}
          <CardHeader className="border-b border-gray-200">
            {/* Desktop Header */}
            <div className="hidden md:flex items-center justify-center gap-12">
              <img
                src="/church-logo.png"
                alt="Church Logo"
                className="h-28 object-contain"
              />
              <div>
                <h1 className="text-3xl font-bold text-center text-purple-700">Worship Team</h1>
                <div className="flex items-center justify-center mt-2">
                  <YearSelector 
                    selectedYear={selectedYear}
                    setSelectedYear={setSelectedYear}
                    availableYears={availableYears}
                    teamColor="#7C3AED"
                    textSize="text-2xl"
                  />
                </div>
              </div>
              <img
                src="/ZionSyncLogo.png"
                alt="ZionSync Logo"
                className="h-28 object-contain"
              />
            </div>

            {/* Mobile Header */}
            <div className="flex md:hidden flex-col gap-4">
              <div className="flex justify-center gap-4 mb-2">
                <div className="flex gap-2 items-center">
                  <img src="/church-logo.png" alt="Church Logo" className="h-10 object-contain" />
                  <img src="/ZionSyncLogo.png" alt="ZionSync Logo" className="h-10 object-contain" />
                </div>
              </div>
              <div className="text-center">
                <h1 className="text-xl font-bold text-purple-700">Worship Team</h1>
                <div className="flex items-center justify-center mt-2">
                  <YearSelector 
                    selectedYear={selectedYear}
                    setSelectedYear={setSelectedYear}
                    availableYears={availableYears}
                    teamColor="#7C3AED"
                    textSize="text-lg"
                  />
                </div>
              </div>
            </div>
          </CardHeader>

          {/* User Selection Bar */}
          <div className="p-4 border-b border-gray-200">
            {/* Combined Header with all buttons on a single line */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Link href="/song-management">
                  <button className="flex items-center gap-2 px-3 py-2 bg-purple-700 text-white rounded-md hover:bg-purple-800 transition-colors">
                    <Database className="w-4 h-4" />
                    <span>Worship Planning</span>
                  </button>
                </Link>

                {/* Remove worship leader indicator */}
              </div>

              {/* Desktop User Selection - now in the same row */}
              <div className="hidden md:flex items-center gap-4">
                <div className="flex flex-wrap gap-2 justify-end">
                  {availableUsers
                    .filter(user => (
                      // Only show individual users and worship leader
                      (user.role === 'leader' || (!user.name.includes('&') && !user.role)) &&
                      // Exclude special groups
                      user.role !== 'special' &&
                      user.role !== 'pastor' &&
                      // Exclude specific groups by name
                      !user.name.includes('Confirmation') &&
                      !user.name.includes('Sunday School')
                    ))
                    .map(user => (
                      <button
                        key={user.name}
                        onClick={() => handleUserSelect(user)}
                        className={`${currentUser?.name === user.name
                          ? 'bg-purple-700 text-white'
                          : 'bg-purple-700 bg-opacity-20 text-purple-700'
                          } px-3 py-1 rounded flex items-center`}
                      >
                        <span>{user.name}</span>
                        {user.role === 'leader' && (
                          <span className="text-xs ml-1">(Leader)</span>
                        )}
                      </button>
                    ))}
                </div>
                <button
                  onClick={() => setShowUserManagement(true)}
                  className="px-3 py-1 rounded border border-purple-700 text-white bg-purple-700 hover:bg-purple-800"
                >
                  Manage Users
                </button>
              </div>
            </div>

            {/* Mobile User Selection */}
            <div className="md:hidden mt-2">
              <button
                onClick={() => setShowUserSelector(true)}
                className="w-full px-3 py-2 rounded border border-purple-700 text-purple-700"
              >
                {currentUser ? `Selected: ${currentUser.name}` : 'Select User'}
              </button>
            </div>
          </div>

        </div>

        {/* Scrollable Content Section */}
        <div className="flex-1 overflow-hidden">
          <CardContent className="h-full p-0">
            {(isLoading || datesLoading) ? (
              <LoadingSpinner 
                message={datesLoading ? `Loading ${selectedYear} services...` : "Loading Worship Team schedule..."} 
                color="purple-700" 
              />
            ) : dates.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <p className="text-gray-600 text-lg mb-2">No services found for {selectedYear}</p>
                  <p className="text-gray-500 text-sm">Services may not be generated yet.</p>
                </div>
              </div>
            ) : (
            <div className="h-full overflow-y-auto">
              <div className="space-y-4 p-4">
                {isMobile ? (
                  // Mobile View - Only renders on mobile
                  dates.map((item) => (
                    <div key={item.date} ref={el => dateRefs.current[item.date] = el} style={{ scrollMarginTop: '20px' }}>
                      <MobileWorshipServiceCard
                      date={item.date}
                    title={item.title}
                    day={item.day}
                    serviceDetails={serviceDetails[item.date]}
                    assignments={assignments}
                    currentUser={currentUser}
                    expanded={expanded[item.date]}
                    onToggleExpand={(date) => {
                      setExpanded(prev => ({
                        ...prev,
                        [date]: !prev[date]
                      }));
                    }}
                    onEditTeam={() => handleEditTeam(item.date)}
                    customServices={customServices}
                    availableSongs={availableSongs}
                    setServiceDetails={setServiceDetails}
                  />
                  </div>
                ))
                ) : (
                  // Desktop View - Only renders on desktop
                  dates.map((item) => (
                    <div key={item.date} ref={el => dateRefs.current[item.date] = el} style={{ scrollMarginTop: '60px' }}>
                      <ServiceSongSelector
                      date={item.date}
                      currentUser={currentUser}
                      serviceDetails={serviceDetails[item.date]}
                      setServiceDetails={setServiceDetails}
                      customServices={customServices}
                      availableSongs={availableSongs}
                      team={assignments[item.date]?.team}
                      expanded={expanded[item.date]}
                      onSongSelect={debouncedSongSelection}
                      onToggleExpand={(date) => {
                        setExpanded(prev => ({
                          ...prev,
                          [date]: !prev[date]
                        }));
                      }}
                      onEditTeam={() => handleEditTeam(item.date)}
                      header={
                        <div className={`w-full ${getHeaderClass(item.date)}`}>
                          {/* Left Side - Service Info */}
                          <div
                            className="flex items-center flex-1 cursor-pointer hover:bg-gray-50 hover:bg-opacity-50 p-2 rounded"
                            onClick={() => {
                              setExpanded(prev => ({
                                ...prev,
                                [item.date]: !prev[item.date]
                              }));
                            }}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-4">
                                {/* Larger date */}
                                <div className="text-xl font-medium text-gray-600">
                                  {item.date}
                                </div>

                                {/* Title and type on same line */}
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium text-black text-sm truncate">
                                    {item.title}
                                  </h3>
                                  {getSpecialServiceType(item.date) && <SpecialServiceIndicator date={item.date} />}
                                  <span className={`text-xs px-2 py-0.5 rounded flex-shrink-0 ${serviceDetails[item.date]?.type ?
                                    'text-gray-600 bg-gray-100' :
                                    'text-amber-700 bg-amber-50 border border-amber-200'
                                    }`}>
                                    {serviceDetails[item.date]?.type === 'communion' ? 'Communion' :
                                      serviceDetails[item.date]?.type === 'communion_potluck' ? 'Communion with Potluck' :
                                        serviceDetails[item.date]?.type === 'no_communion' ? 'No Communion' :
                                          customServices?.find(s => s.id === serviceDetails[item.date]?.type)?.name ||
                                          'Not Set'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Right Side - Team Assignment plus icon */}
                          <div className="flex items-center gap-3 flex-shrink-0">
                            {/* Check for songs - add music icon */}
                            {serviceDetails[item.date]?.elements?.some(e => e.type === 'song_hymn' && e.selection?.title) && (
                              <div className="w-5 h-5 rounded-full bg-purple-50 flex items-center justify-center">
                                <Music2 className="w-3 h-3 text-purple-700" />
                              </div>
                            )}

                            {/* Team Assignment Badge - Clickable to edit */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditTeam(item.date);
                              }}
                              className="flex items-center bg-purple-100 rounded px-2 py-0.5 hover:bg-purple-200 transition-colors"
                              title="Click to edit team assignment"
                            >
                              <UserCircle className="w-3 h-3 text-purple-700 mr-1" />
                              <span className="text-xs text-purple-700">
                                {assignments[item.date]?.team || 'No team assigned'}
                              </span>
                            </button>

                            {/* Expand/Collapse button */}
                            <button
                              onClick={() => setExpanded(prev => ({ ...prev, [item.date]: !prev[item.date] }))}
                              className="ml-1"
                            >
                              {expanded[item.date] ?
                                <ChevronUp className="w-5 h-5 text-purple-700" /> :
                                <ChevronDown className="w-5 h-5 text-purple-700" />
                              }
                            </button>
                          </div>
                        </div>
                      }
                    />
                  </div>
                ))
                )}
              </div>
            </div>
            )}
          </CardContent>
        </div>
      </div>

      {/* Team Selector Modal */}
      {showTeamSelector && editingDate && (
        <TeamSelectionModal
          showModal={showTeamSelector}
          onClose={() => {
            setShowTeamSelector(false);
            setEditingDate(null);
          }}
          date={editingDate}
          users={users}
          currentUser={currentUser}
          assignments={assignments}
          serviceDetails={serviceDetails}
          onSelect={async (teamName) => {
            try {
              // Optimistically update UI
              setAssignments(prev => ({
                ...prev,
                [editingDate]: {
                  ...prev[editingDate],
                  team: teamName
                }
              }));

              // Make the API call
              const response = await fetchWithTimeout(API_ENDPOINTS.WORSHIP_ASSIGNMENTS, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  date: editingDate,
                  team: teamName,
                  updatedBy: currentUser?.name || 'Unknown'
                })
              });

              if (!response.ok) {
                throw new Error('Failed to update team');
              }

              // Show success message
              handleSuccess(teamName ? 'Team updated successfully' : 'Team assignment removed');

              // Fetch fresh data
              const assignmentsResponse = await fetchWithTimeout(API_ENDPOINTS.WORSHIP_ASSIGNMENTS);
              if (assignmentsResponse.ok) {
                const assignmentsData = await assignmentsResponse.json();
                const assignmentsObj = {};
                assignmentsData.forEach(assignment => {
                  if (assignment.date) {
                    assignmentsObj[assignment.date] = {
                      team: assignment.team,
                      lastUpdated: assignment.lastUpdated
                    };
                  }
                });
                setAssignments(assignmentsObj);
              }
            } catch (error) {
              console.error('Error updating team:', error);
              // Revert the optimistic update
              setAssignments(prev => ({
                ...prev,
                [editingDate]: {
                  ...prev[editingDate],
                  team: assignments[editingDate]?.team
                }
              }));
              handleError(error, 'Error updating team');
            }
          }}
          title="Assign Worship Team"
        />
      )}

      {/* Mobile User Select Component */}
      < MobileWorshipSelect
        showSelector={showUserSelector}
        setShowSelector={setShowUserSelector}
        availableUsers={availableUsers}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
      />

      {/* User Management Modal */}
      {
        showUserManagement && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-purple-700">Manage Users</h2>
                <button
                  onClick={() => setShowUserManagement(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <button
                  onClick={handleAddUser}
                  className="w-full px-3 py-2 rounded border border-purple-700 text-purple-700 hover:bg-purple-50"
                >
                  + Add New User
                </button>
                <div className="space-y-2">
                  {availableUsers.map(user => (
                    <div key={user.name} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900">{user.name}</span>
                        {user.role === 'leader' && (
                          <span className="text-xs text-purple-700">(Leader)</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteUser(user.name)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      }
      
      <AddUserModal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        onSubmit={handleAddUserSubmit}
        teamColor="#9333EA"
        teamName="Worship"
      />
    </Card >
  );
};

export default WorshipTeam;