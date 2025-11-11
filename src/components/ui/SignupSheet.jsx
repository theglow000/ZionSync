'use client'

// Add UserSelectionModal to the imports at the top
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserCircle, Calendar, Check, ChevronDown, ChevronUp, Mail, X, Music2, BookOpen, Pencil, Trash2, Cross, MessageSquare, Music } from 'lucide-react';
import { format, addMonths, subMonths, isSameMonth } from 'date-fns';
import MobileServiceCard from './MobileServiceCard';
import UserSelectionModal from './UserSelectionModal';
import AddUserModal from './AddUserModal';
import useResponsive from '../../hooks/useResponsive';
import { useDebounce } from '../../hooks/useDebounce';
import { useAlertManager } from '../../hooks/useAlertManager';
import { useConfirm } from '../../hooks/useConfirm';
import { LoadingSpinner, YearSelector } from '../shared';
import { ERROR_MESSAGES, SUCCESS_MESSAGES, createErrorHandler, createSuccessHandler } from '../../utils/errorHandler';
import { POLLING_INTERVAL, ALERT_DURATION, COLOR_THEMES, API_ENDPOINTS } from '../../lib/constants';
import { fetchWithTimeout, fetchWithRetry, parseJSON, apiPost, apiGet, apiDelete, apiPut } from '../../lib/api-utils';
import './table.css'
import PastorServiceInput from './PastorServiceInput'; // Add this import
import { downloadICSFile } from '../../lib/ics-generator'; // Change this import

const SignupSheet = ({ serviceDetails, setServiceDetails, selectedYear, setSelectedYear, availableYears }) => {
  const { isMobile } = useResponsive();
  
  // Use alert manager hook
  const { 
    showAlert, 
    alertMessage, 
    alertPosition, 
    setAlertPosition, 
    showAlertWithTimeout 
  } = useAlertManager();
  
  // Use confirm dialog hook
  const { confirm, ConfirmDialog } = useConfirm();
  
  // Initialize all state at the top of component
  const [expanded, setExpanded] = useState({});
  const [showRegistration, setShowRegistration] = useState(false);
  const [signups, setSignups] = useState({});
  const [currentDate, setCurrentDate] = useState(null);
  const [completed, setCompleted] = useState({});
  const [selectedDates, setSelectedDates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [signupDetails, setSignupDetails] = useState({});  // Add this near other state declarations
  const [availableUsers, setAvailableUsers] = useState([])
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [usersToDelete, setUsersToDelete] = useState([]);
  const [serviceDetailsError, setServiceDetailsError] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showPastorInput, setShowPastorInput] = useState(false);
  const [editingDate, setEditingDate] = useState(null);
  const [customServices, setCustomServices] = useState([]);
  const [showUserSelectModal, setShowUserSelectModal] = useState(null); // { date, currentAssignment }
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [pendingActions, setPendingActions] = useState({}); // Track pending debounced actions
  
  // Sprint 4.2: Dynamic dates fetching
  const [dates, setDates] = useState([]);
  const [datesLoading, setDatesLoading] = useState(false);

  // Refs for auto-scrolling to current date (consolidated for both views)
  const dateRefs = useRef({});
  const componentRootRef = useRef(null);

  // Centralized error and success handlers (updated to use useAlertManager)
  const handleError = useMemo(
    () => createErrorHandler('Presentation Team', (msg) => showAlertWithTimeout(msg), () => {}),
    [showAlertWithTimeout]
  );
  
  const handleSuccess = useMemo(
    () => createSuccessHandler((msg) => showAlertWithTimeout(msg), () => {}),
    [showAlertWithTimeout]
  );

  // Utility functions wrapped in useCallback for performance
  const checkForOrderOfWorship = useCallback((date) => {
    const elements = serviceDetails[date]?.elements;
    return Array.isArray(elements) && elements.length > 0;
  }, [serviceDetails]);

  const isFutureDate = useCallback((dateStr) => {
    const [month, day, year] = dateStr.split('/').map(num => parseInt(num, 10));
    // Set time to start of day for accurate comparison
    const dateToCheck = new Date(year, month - 1, day);
    dateToCheck.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return dateToCheck >= today;
  }, []);

  // Handler functions wrapped in useCallback for performance
  const handleAddUser = useCallback(() => {
    setShowAddUserModal(true);
  }, []);

  const handleAddUserSubmit = useCallback(async (name) => {
    try {
      await apiPost(API_ENDPOINTS.USERS, { name });

      setAvailableUsers(prev => [...prev, { name }]);
      setShowAddUserModal(false);
      handleSuccess(SUCCESS_MESSAGES.USER_ADDED);
    } catch (error) {
      handleError(error, { operation: 'addUser', name }, ERROR_MESSAGES.USER_ADD_ERROR);
      throw error; // Re-throw to let modal handle error display
    }
  }, [handleSuccess, handleError]);

  const handleRemoveUser = useCallback(async (userName, skipConfirm = true) => {
    if (!skipConfirm) {
      const confirmed = await confirm({
        title: 'Remove User',
        message: `Remove ${userName} from the system?`,
        variant: 'danger',
        confirmText: 'Remove',
        cancelText: 'Cancel'
      });
      if (!confirmed) return;
    }

    try {
      await apiDelete(API_ENDPOINTS.USERS, {
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: userName })
      });

      setAvailableUsers(prev => prev.filter(user => user.name !== userName));

      // Clear signups for this user
      setSignups(prev => {
        const newSignups = { ...prev };
        Object.entries(newSignups).forEach(([date, name]) => {
          if (name === userName) {
            delete newSignups[date];
          }
        });
        return newSignups;
      });

      // If current user was deleted, clear current user
    } catch (error) {
      console.error('Error removing user:', error);
      handleError(error, 'Error removing user');
    }
  }, [confirm, handleError]);

  // Consolidated initial data fetch - runs once on mount
  useEffect(() => {
    const controller = new AbortController();
    
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        // Fetch all initial data in parallel for better performance
        const [usersResponse, signupsResponse, completedResponse, customServicesResponse] = await Promise.all([
          fetchWithTimeout(API_ENDPOINTS.USERS, { signal: controller.signal }),
          fetchWithTimeout(API_ENDPOINTS.SIGNUPS, { signal: controller.signal }),
          fetchWithTimeout(API_ENDPOINTS.COMPLETED, { signal: controller.signal }),
          fetchWithTimeout(API_ENDPOINTS.CUSTOM_SERVICES, { signal: controller.signal })
        ]);

        // Check for errors
        if (!usersResponse.ok) throw new Error('Failed to fetch users');
        if (!signupsResponse.ok) throw new Error('Failed to fetch signups');
        if (!completedResponse.ok) throw new Error('Failed to fetch completed status');
        // customServices can fail silently

        // Parse responses
        const [usersData, signupsData, completedData, customServicesData] = await Promise.all([
          usersResponse.json(),
          signupsResponse.json(),
          completedResponse.json(),
          customServicesResponse.ok ? customServicesResponse.json() : []
        ]);

        // Process users
        setAvailableUsers(usersData);

        // Process signups
        const signupsObj = {};
        const detailsObj = {};
        const userFutureDates = [];

        signupsData.forEach(signup => {
          signupsObj[signup.date] = signup.name;
          detailsObj[signup.date] = { name: signup.name };
          if (isFutureDate(signup.date)) {
            userFutureDates.push(signup.date);
          }
        });

        setSignups(signupsObj);
        setSignupDetails(detailsObj);
        setSelectedDates(userFutureDates);

        // Process completed status
        const completedObj = {};
        completedData.forEach(item => {
          completedObj[item.date] = item.completed;
        });
        setCompleted(completedObj);

        // Process custom services
        setCustomServices(customServicesData);

      } catch (error) {
        if (error.name === 'AbortError') return;
        console.error('Error fetching initial data:', error);
        handleError(error, 'Error loading data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();

    return () => controller.abort();
  }, [isFutureDate]); // Include isFutureDate in dependencies since it's used

  // Service details polling - critical for syncing Worship Team song selections
  // Runs on mount and every 30 seconds to keep data fresh
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
            
            // Convert array to object if needed
            let dataObj = data;
            if (Array.isArray(data)) {
              dataObj = {};
              data.forEach(detail => {
                if (detail.date) {
                  dataObj[detail.date] = detail;
                }
              });
            }
            
            // Defensive check: ensure dataObj is an object
            if (dataObj && typeof dataObj === 'object') {
              Object.keys(dataObj).forEach(date => {
                const existingElements = prev[date]?.elements || [];
                const newElements = dataObj[date]?.elements || [];

                // Create a map of existing elements by ID and type-content key for quick lookup
                const existingElementMap = new Map();
              existingElements.forEach(element => {
                // Store by ID if available
                if (element.id) {
                  existingElementMap.set(element.id, element);
                }
                
                // Also store by type and content prefix
                const contentPrefix = element.content?.split(':')[0]?.trim();
                if (contentPrefix) {
                  const key = `${element.type}-${contentPrefix}`;
                  existingElementMap.set(key, element);
                }
                
                // For song elements, also store by position index
                if (element.type === 'song_hymn' || element.type === 'song_contemporary') {
                  const songIndex = existingElements.filter(
                    e => e.type === element.type || 
                         (e.type === 'song_hymn' && element.type === 'song_contemporary') || 
                         (e.type === 'song_contemporary' && element.type === 'song_hymn')
                  ).indexOf(element);
                  
                  if (songIndex >= 0) {
                    existingElementMap.set(`song-${songIndex}`, element);
                  }
                }
              });
              
              // Process each new element, preserving song selections and formatting
              const mergedElements = newElements.map((newElement, index) => {
                // Try to find matching element in several ways
                let existingElement = null;
                
                // 1. Try matching by ID
                if (newElement.id && existingElementMap.has(newElement.id)) {
                  existingElement = existingElementMap.get(newElement.id);
                } 
                // 2. Try matching by content prefix
                else {
                  const contentPrefix = newElement.content?.split(':')[0]?.trim();
                  if (contentPrefix) {
                    const key = `${newElement.type}-${contentPrefix}`;
                    if (existingElementMap.has(key)) {
                      existingElement = existingElementMap.get(key);
                    }
                  }
                }
                
                // 3. For songs, try matching by position if still not found
                if (!existingElement && 
                    (newElement.type === 'song_hymn' || newElement.type === 'song_contemporary')) {
                  const songIndex = newElements.filter(
                    e => e.type === 'song_hymn' || e.type === 'song_contemporary'
                  ).indexOf(newElement);
                  
                  if (songIndex >= 0 && existingElementMap.has(`song-${songIndex}`)) {
                    existingElement = existingElementMap.get(`song-${songIndex}`);
                  }
                }
                
                // If matching element found, merge properly based on type
                if (existingElement) {
                  // For song elements, preserve the selection data
                  if (newElement.type === 'song_hymn' || newElement.type === 'song_contemporary' ||
                      newElement.type === 'liturgical_song') {
                    
                    // Generate display content based on existing selection if available
                    let content = newElement.content;
                    
                    if (existingElement.selection?.title) {
                      // Extract the prefix from the new element content
                      const prefix = newElement.content.split(':')[0].trim();
                      
                      // Format the song details based on type
                      let songDetails;
                      if (existingElement.selection.type === 'hymn') {
                        songDetails = `${existingElement.selection.title} #${existingElement.selection.number || ''} (${
                          existingElement.selection.hymnal ? 
                            existingElement.selection.hymnal.charAt(0).toUpperCase() + 
                            existingElement.selection.hymnal.slice(1) : 
                            'Hymnal'
                        })`;
                      } else {
                        songDetails = existingElement.selection.author ? 
                          `${existingElement.selection.title} - ${existingElement.selection.author}` : 
                          existingElement.selection.title;
                      }
                      
                      content = `${prefix}: ${songDetails}`;
                    }
                    
                    return {
                      ...newElement,
                      selection: existingElement.selection,
                      reference: existingElement.reference,
                      content: content
                    };
                  }
                  
                  // For readings and messages, update content but preserve formatting
                  if (newElement.type === 'reading' || newElement.type === 'message') {
                    return {
                      ...existingElement,
                      ...newElement
                    };
                  }
                }
                
                // For elements without a match or other element types, use the new data
                return newElement;
              });

              merged[date] = {
                ...prev[date],
                ...dataObj[date],
                elements: mergedElements
              };
            });
            }
            return merged;
          });
        }
      } catch (error) {
        console.error('Error fetching service details:', error);
        // Don't show alert for polling errors to avoid annoying users
      }
    };

    fetchServiceDetails();
    const intervalId = setInterval(fetchServiceDetails, POLLING_INTERVAL);

    return () => {
      isSubscribed = false;
      clearInterval(intervalId);
    };
  }, [POLLING_INTERVAL]); // Include POLLING_INTERVAL in dependencies

  // Sprint 4.2: Fetch dates dynamically based on selected year
  useEffect(() => {
    // Don't fetch if no year selected yet
    if (!selectedYear) return;
    
    const fetchDates = async () => {
      setDatesLoading(true);
      try {
        const response = await fetchWithTimeout(`/api/service-dates?year=${selectedYear}&upcomingOnly=false`);
        
        if (!response.ok) {
          if (response.status === 404) {
            // Year not generated yet
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

  const handleSignup = useCallback(async () => {
    const nameInput = document.querySelector('input[name="name"]');

    if (!nameInput) return;

    const name = nameInput.value;

    if (!name) return;

    try {
      // Save to MongoDB
      await apiPost(API_ENDPOINTS.SIGNUPS, {
        date: currentDate,
        name,
      });

      const newUser = {
        name,
        color: 'bg-[#6B8E23] bg-opacity-20'
      };

      // Update both signups and signupDetails states
      setSignups(prev => ({
        ...prev,
        [currentDate]: name
      }));

      setSignupDetails(prev => ({
        ...prev,
        [currentDate]: {
          name
        }
      }));

      setSelectedDates(prev => [...prev, currentDate]);
      setShowRegistration(false);
      handleSuccess('Successfully signed up! Date added to calendar selection.');
    } catch (error) {
      handleError(error, 'Error saving signup');
    }
  }, [currentDate]);

  // Update handleServiceDetailChange function
  const handleServiceDetailChange = useCallback(async (date, field, value) => {
    try {
      // Update local state immediately
      setServiceDetails(prev => ({
        ...prev,
        [date]: {
          ...prev[date],
          [field]: value
        }
      }));

      // Clear any existing timeout
      if (window.serviceDetailTimeout) {
        clearTimeout(window.serviceDetailTimeout);
      }

      // Set new timeout for debouncing
      window.serviceDetailTimeout = setTimeout(async () => {
        try {
          const currentDetails = serviceDetails[date] || {};

          const response = await fetchWithTimeout(API_ENDPOINTS.SERVICE_DETAILS, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              date,
              ...currentDetails,
              [field]: value
            })
          });

          if (!response.ok) {
            throw new Error('Failed to save service details');
          }

          const result = await response.json();
        } catch (error) {
          console.error('Save error:', error);
          setServiceDetailsError(error.message);
          handleError(error, 'Failed to save service details');
        }
      }, 500);
    } catch (error) {
      console.error('Error:', error);
      setServiceDetailsError(error.message);
      handleError(error, 'Error updating service details');
    }
  }, [serviceDetails]);

  const handleRemoveReservation = useCallback(async (date) => {
    if (signups[date]) {
      try {
        await apiDelete(API_ENDPOINTS.SIGNUPS, {
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            date: date,
            name: signups[date]
          })
        });

        setSignups(prev => {
          const newSignups = { ...prev };
          delete newSignups[date];
          return newSignups;
        });

        setSignupDetails(prev => {
          const newDetails = { ...prev };
          delete newDetails[date];
          return newDetails;
        });

        setSelectedDates(prev => prev.filter(d => d !== date));
        handleSuccess('Reservation removed successfully');
      } catch (error) {
        handleError(error, 'Error removing reservation');
      }
    }
  }, [signups]);

  const handleCompleted = useCallback(async (date) => {
    const newValue = !completed[date];
    const previousValue = completed[date];
    
    // OPTIMISTIC UPDATE: Update UI immediately
    setCompleted(prev => ({
      ...prev,
      [date]: newValue
    }));
    
    try {
      await apiPost(API_ENDPOINTS.COMPLETED, {
        date,
        completed: newValue
      });
    } catch (error) {
      console.error('Error updating completed status:', error);
      
      // ROLLBACK: Restore previous state on error
      setCompleted(prev => ({
        ...prev,
        [date]: previousValue
      }));
      
      handleError(error, { operation: 'updateCompletion', date }, ERROR_MESSAGES.COMPLETION_ERROR);
    } finally {
      // Clear pending state
      setPendingActions(prev => {
        const newState = { ...prev };
        delete newState[`complete-${date}`];
        return newState;
      });
    }
  }, [completed, handleError]);

  // Debounced version of handleCompleted
  const [debouncedCompleted] = useDebounce((date) => {
    setPendingActions(prev => ({ ...prev, [`complete-${date}`]: true }));
    handleCompleted(date);
  }, 500);

  const handlePastorEdit = useCallback((date) => {
    setEditingDate(date);
    setShowPastorInput(true);
  }, []);

  const handleDeleteServiceDetails = useCallback(async (date) => {
    const confirmed = await confirm({
      title: 'Delete Service Details',
      message: 'This action cannot be undone.',
      variant: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });
    
    if (confirmed) {
      try {
        const response = await fetchWithTimeout(`/api/service-details?date=${date}`, {
          method: 'DELETE',
        });

        if (!response.ok) throw new Error('Failed to delete service details');

        // Update the local state by removing service details
        setServiceDetails(prev => {
          const newDetails = { ...prev };
          delete newDetails[date];
          return newDetails;
        });
        handleSuccess('Service details deleted successfully');
      } catch (error) {
        console.error('Error deleting service details:', error);
        handleError(error, 'Error deleting service details');
      }
    }
  }, [confirm, handleSuccess, handleError]);

  const handleCloseUserManagement = useCallback(() => {
    setShowUserManagement(false);
    setUsersToDelete([]);
  }, []);

  const handleRemoveSelectedUsers = useCallback(async () => {
    if (usersToDelete.length === 0) {
      handleError(null, 'Please select users to remove');
      return;
    }

    const confirmed = await confirm({
      title: 'Remove Users',
      message: `Remove ${usersToDelete.length} user${usersToDelete.length > 1 ? 's' : ''} from the system?`,
      details: ['This action cannot be undone'],
      variant: 'danger',
      confirmText: 'Remove',
      cancelText: 'Cancel'
    });
    
    if (confirmed) {
      for (const userName of usersToDelete) {
        await handleRemoveUser(userName);
      }
      setShowUserManagement(false);
      setUsersToDelete([]);
      handleSuccess('Users removed successfully');
    }
  }, [usersToDelete, handleRemoveUser, confirm]);

  const handleCalendarDownload = useCallback(async () => {
    try {
      // Use selected dates directly without filtering by currentUser
      const eventsToDownload = dates.filter(date => selectedDates.includes(date.date));

      // Create events array for ICS
      const events = eventsToDownload.map(event => {
        const [month, day, parsedYear] = event.date.split('/').map(num => parseInt(num, 10));
        const year = 2000 + parsedYear;

        // Get the assigned user for this date
        const assignedUser = signups[event.date] || 'Unassigned';

        return {
          uid: `proclaim-presentation-${event.date}`,
          start: [year, month, day, 9, 0],
          duration: { hours: 1, minutes: 0 },
          title: `Proclaim Presentation - ${event.title}`,
          description: `Assigned to: ${assignedUser}\n\nService: ${event.title}`,
          url: 'https://zion-presentation-sign-up.vercel.app/',
          alarms: [{
            trigger: '-P3D',
            description: 'Proclaim Presentation Reminder',
            action: 'display'
          }],
          status: 'CONFIRMED',
          busyStatus: 'BUSY',
          sequence: 0
        };
      });

      // Create and download ICS file
      const { createEvents } = await import('@/lib/ics-generator');
      
      const icsContent = createEvents(events);
      
      // Create a blob and trigger download
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'proclaim-presentation-schedule.ics');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      handleSuccess('Calendar file downloaded successfully');
    } catch (error) {
      console.error('Error creating calendar file:', error);
      handleError(error, 'Error creating calendar file');
    }
  }, [dates, selectedDates, signups]);

  const checkForSelectedSongs = useCallback((date) => {
    const elements = serviceDetails[date]?.elements;
    const songElements = elements?.filter(element => element.type === 'song_hymn');

    

    // Check if any songs have a reference (which indicates they were selected)
    // OR if they have a selection.title
    return songElements?.some(element =>
      element.reference || element.selection?.title
    );
  }, [serviceDetails]);

  const handleAssignUser = useCallback(async (date, userName) => {
    // Store previous state for rollback
    const previousSignups = signups[date];
    const previousDetails = signupDetails[date];
    const previousSelectedDates = selectedDates;

    // OPTIMISTIC UPDATE: Update UI immediately
    setSignups(prev => ({
      ...prev,
      [date]: userName
    }));
    
    setSignupDetails(prev => ({
      ...prev,
      [date]: {
        name: userName
      }
    }));

    // Add to selected dates for future dates
    const [month, day, shortYear] = date.split('/').map(num => parseInt(num, 10));
    const year = 2000 + shortYear;
    const dateObj = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateObj >= today) {
      setSelectedDates(prev => [...prev, date]);
    }

    try {
      const response = await fetchWithTimeout(API_ENDPOINTS.SIGNUPS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: date,
          name: userName
        })
      });

      if (!response.ok) throw new Error('Failed to save signup');

      handleSuccess(SUCCESS_MESSAGES.ASSIGNMENT_SAVED);
    } catch (error) {
      // ROLLBACK: Restore previous state on error
      setSignups(prev => ({
        ...prev,
        [date]: previousSignups
      }));
      
      setSignupDetails(prev => ({
        ...prev,
        [date]: previousDetails
      }));
      
      setSelectedDates(previousSelectedDates);
      
      handleError(error, { operation: 'assignUser', date, userName }, ERROR_MESSAGES.ASSIGNMENT_ERROR);
    } finally {
      // Clear pending state
      setPendingActions(prev => {
        const newState = { ...prev };
        delete newState[`assign-${date}`];
        return newState;
      });
    }
  }, [signups, signupDetails, selectedDates, handleSuccess, handleError]); // Add error handlers

  // Debounced version of handleAssignUser
  const [debouncedAssignUser] = useDebounce((date, userName) => {
    setPendingActions(prev => ({ ...prev, [`assign-${date}`]: true }));
    handleAssignUser(date, userName);
  }, 300);

  // Add this helper function near your other helper functions
  const isSongElementFullyLoaded = useCallback((element) => {
    if (element.type !== 'song_hymn') return true;
    
    // If it has selection with title, it's fully loaded
    if (element.selection?.title) return true;
    
    // If the content includes only a label with colon and nothing more,
    // or it shows the placeholder text for Awaiting Song Selection,
    // then it needs worship team selection
    const contentParts = element.content?.split(':') || [];
    if (contentParts.length > 1) {
      const textAfterColon = contentParts.slice(1).join(':').trim();
      if (textAfterColon === '' || textAfterColon === ' <Awaiting Song Selection>') {
        return 'needs-selection';
      }
      // If there's some content after colon but no selection, it might be mid-loading
      if (textAfterColon && !element.selection?.title) {
        return false; // Still loading
      }
    }
    
    return true; // Default to fully loaded if we can't determine
  }, []);

  return (
 <Card ref={componentRootRef} className="w-full h-full mx-auto relative bg-white shadow-lg">
      {showAlert && (
        <Alert
          className="fixed z-[200] w-80 bg-white border-[#6B8E23] shadow-lg rounded-lg"
          style={{
            top: isMobile ? '50%' : `${alertPosition.y}px`,
            left: isMobile ? '50%' : `${alertPosition.x}px`,
            transform: isMobile ? 'translate(-50%, -50%)' : 'translate(-50%, -120%)'
          }}
        >
          <div className="flex items-center gap-2 p-2">
            <Mail className="w-5 h-5 text-[#6B8E23]" />
            <AlertDescription className="text-black font-medium">
              {alertMessage}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {showRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#6B8E23]">Sign Up for Service</h2>
              <button
                onClick={() => setShowRegistration(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-black">Name</label>
                <input
                  required
                  name="name"
                  type="text"
                  className="w-full p-2 border rounded text-black"
                  placeholder="Enter your name"
                />
              </div>
              <button
                onClick={handleSignup}
                className="w-full bg-[#6B8E23] text-white p-2 rounded hover:bg-[#556B2F] transition-colors"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col h-full">
        {/* Fixed Header Section */}
        <div className="sticky top-0 z-10 bg-white">
          <CardHeader className="border-b border-gray-200">
            {/* Desktop Header */}
            <div className="hidden md:flex items-center justify-center gap-12">
              <img
                src="/church-logo.png"
                alt="Church Logo"
                className="h-28 object-contain"
              />
              <div>
                <h1 className="text-3xl font-bold text-center text-[#6B8E23]">Proclaim Presentation Team</h1>
                <div className="flex items-center justify-center mt-2">
                  <YearSelector 
                    selectedYear={selectedYear}
                    setSelectedYear={setSelectedYear}
                    availableYears={availableYears}
                    teamColor="#6B8E23"
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
                  <img src="/church-Logo.png" alt="Zion Church Sync Logo" className="h-10 object-contain" />
                  <img src="/ZionSynclogo.png" alt="ZionSync Logo" className="h-10 object-contain" />
                </div>
              </div>
              <div className="text-center">
                <h1 className="text-xl font-bold text-[#6B8E23]">Proclaim Presentation Team</h1>
                <div className="flex items-center justify-center mt-2">
                  <YearSelector 
                    selectedYear={selectedYear}
                    setSelectedYear={setSelectedYear}
                    availableYears={availableYears}
                    teamColor="#6B8E23"
                    textSize="text-lg"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          {/* User Management Section */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {selectedDates.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCalendarDownload}
                      className="flex items-center px-3 py-1.5 text-sm bg-[#6B8E23] text-white rounded hover:bg-[#556B2F] transition-colors"
                    >
                      <Calendar className="w-4 h-4 mr-1" />
                      <span className="hidden sm:inline">Download Calendar Events</span>
                      <span className="sm:hidden">Calendar ({selectedDates.length})</span>
                    </button>
                    <div className="relative group">
                      <button className="w-6 h-6 rounded-full bg-[#6B8E23] bg-opacity-20 text-[#6B8E23] flex items-center justify-center font-bold hover:bg-opacity-30">
                        ?
                      </button>
                      <div className="absolute left-0 top-full mt-2 w-72 bg-white p-3 rounded-lg shadow-lg invisible group-hover:visible z-50 text-sm border border-gray-200 text-slate-900">
                        <p className="font-bold mb-2 text-slate-900">How to import events:</p>
                        <p className="font-bold mt-2 text-slate-900">Google Calendar:</p>
                        <ol className="list-decimal ml-4 mb-2">
                          <li className="text-slate-900">Open Google Calendar</li>
                          <li className="text-slate-900">Click + next to "Other Calendars"</li>
                          <li className="text-slate-900">Select "Import"</li>
                          <li className="text-slate-900">Upload the downloaded file</li>
                        </ol>
                        <p className="font-bold mt-2 text-slate-900">Outlook:</p>
                        <ol className="list-decimal ml-4">
                          <li className="text-slate-900">Double-click downloaded file</li>
                          <li className="text-slate-900">Outlook will open automatically</li>
                          <li className="text-slate-900">Click "Save & Close"</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => setShowUserManagement(true)}
                className="px-3 py-1.5 rounded border border-[#6B8E23] text-[#6B8E23] hover:bg-[#6B8E23] hover:text-white transition-colors"
              >
                Manage Users
              </button>
            </div>
          </div>
        </div>
      {/* Scrollable Content Section */}
        <div className="flex-1 overflow-hidden"> {/* This wrapper prevents double scrollbar */}
          <CardContent className="h-full p-0"> {/* Remove default padding */}
            {(isLoading || datesLoading) ? (
              <LoadingSpinner 
                message={datesLoading ? `Loading ${selectedYear} services...` : "Loading Presentation Team schedule..."} 
                color="[#6B8E23]" 
              />
            ) : dates.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <p className="text-gray-600 text-lg mb-2">No services found for {selectedYear}</p>
                  <p className="text-gray-500 text-sm">Services may not be generated yet.</p>
                </div>
              </div>
            ) : (
            <div className="h-full">
              {isMobile ? (
                // Mobile Card View - Only renders on mobile
                dates.map((item) => (
                  <div key={item.date} ref={el => dateRefs.current[item.date] = el} style={{ scrollMarginTop: '20px' }}>
                    <MobileServiceCard
                      item={item}
                    checkForSelectedSongs={checkForSelectedSongs}
                    checkForOrderOfWorship={checkForOrderOfWorship}
                    expanded={expanded}
                    completed={completed}
                    signups={signups}
                    availableUsers={availableUsers}
                    selectedDates={selectedDates}
                    serviceDetails={serviceDetails}
                    setSelectedDates={setSelectedDates}
                    showAlertWithTimeout={showAlertWithTimeout}
                    setAlertPosition={setAlertPosition}
                    customServices={customServices}
                    onExpand={(date) => setExpanded(prev => ({
                      ...prev,
                      [date]: !prev[date]
                    }))}
                    onAssignUser={handleAssignUser}
                    onRemoveAssignment={handleRemoveReservation}
                    onComplete={handleCompleted}
                    onSelectDate={(date) => {
                      setSelectedDates(prev =>
                        prev.includes(date)
                          ? prev.filter(d => d !== date)
                          : [...prev, date]
                      );
                    }}
                    onServiceDetailChange={handleServiceDetailChange}
                    onEditService={(date) => {
                      setEditingDate(date);
                      setShowPastorInput(true);
                    }}
                    onDeleteService={async (date) => {
                      try {
                        await fetchWithTimeout(API_ENDPOINTS.SERVICE_DETAILS, {
                          method: 'DELETE',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ date })
                        });

                        // Update local state
                        setServiceDetails(prev => {
                          const newState = { ...prev };
                          delete newState[date];
                          return newState;
                        });

                        handleSuccess('Service details deleted successfully');
                      } catch (error) {
                        console.error('Error deleting service details:', error);
                        handleError(error, 'Error deleting service details');
                      }
                    }}
                  />
                  </div>
                ))
              ) : (
                // Desktop Table View - Only renders on desktop
                <div className="relative h-full">
                  {/* Single table with sticky header */}
                  <div className="overflow-y-auto h-full">
                    <table className="w-full">
                      <thead className="sticky top-0 z-10">
                        <tr className="bg-[#FFF8DC]">
                          <th style={{ width: '64px' }} className="p-2 text-left font-bold text-[#6B8E23]">Add to Calendar</th>
                          <th style={{ width: '80px' }} className="p-2 text-left font-bold text-[#6B8E23]">Details</th>
                          <th style={{ width: '96px' }} className="p-2 text-left font-bold text-[#6B8E23]">Date</th>
                          <th style={{ width: '96px' }} className="p-2 text-left font-bold text-[#6B8E23]">Day</th>
                          <th style={{ width: '35%' }} className="p-2 text-left font-bold text-[#6B8E23]">Service</th>
                          <th style={{ width: '120px' }} className="p-2 text-left font-bold text-[#6B8E23]">Presentation Builder</th>
                          <th style={{ width: '96px' }} className="p-2 text-center font-bold text-[#6B8E23]">Completed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dates.map((item, index) => (
                          <React.Fragment key={item.date}>
                            <tr 
                              ref={el => dateRefs.current[item.date] = el}
                              style={{ scrollMarginTop: '60px' }}
                              className={index % 2 === 0 ? 'bg-gray-50' : ''}
                            >
                              <td style={{ width: '64px' }} className="p-2 border-r border-gray-300 text-center">
                                {signups[item.date] && (
                                  <input
                                    type="checkbox"
                                    checked={selectedDates.includes(item.date)}
                                    onChange={() => {
                                      setSelectedDates(prev =>
                                        prev.includes(item.date)
                                          ? prev.filter(d => d !== item.date)
                                          : [...prev, item.date]
                                      );
                                    }}
                                    className="w-4 h-4 rounded border-gray-300 mx-auto"
                                  />
                                )}
                              </td>
                              <td style={{ width: '80px' }} className="p-2 border-r border-gray-300">
                                <button
                                  onClick={() => setExpanded(prev => ({
                                    ...prev,
                                    [item.date]: !prev[item.date]
                                  }))}
                                  className="p-1 hover:bg-gray-200 rounded"
                                >
                                  {expanded[item.date] ? <ChevronUp /> : <ChevronDown />}
                                </button>
                              </td>
                              <td style={{ width: '96px' }} className="p-2 border-r border-gray-300">{item.date}</td>
                              <td style={{ width: '96px' }} className="p-2 border-r border-gray-300">{item.day}</td>
                              <td style={{ width: '35%' }} className="p-2 border-r border-gray-300">
                                <div className="flex items-center justify-between">
                                  <span>{item.title}</span>
                                  <div className="flex items-center gap-1">
                                    {checkForOrderOfWorship(item.date) && (
                                      <BookOpen
                                        className="w-4 h-4 text-green-600"
                                        title="Order of Worship available"
                                      />
                                    )}
                                    {checkForSelectedSongs(item.date) && (
                                      <Music2
                                        className="w-4 h-4 text-purple-700"
                                        title="Songs selected"
                                      />
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td style={{ width: '150px' }} className="p-2 border-r border-gray-300">
                                {signups[item.date] ? (
                                  <div className="p-2 rounded bg-[#6B8E23] bg-opacity-20 flex items-center gap-2">
                                    <span className="flex-1">
                                      <UserCircle className="w-4 h-4 text-[#6B8E23] inline-block mr-1" />
                                      <span className="text-[#6B8E23] font-medium">{signups[item.date]}</span>
                                    </span>
                                    <button
                                      onClick={() => setShowUserSelectModal({ date: item.date, currentAssignment: signups[item.date] })}
                                      className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                                      title="Change assignment"
                                    >
                                      <Pencil className="w-3 h-3 text-gray-600" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setShowUserSelectModal({ date: item.date })}
                                    className="w-full p-2 border rounded flex items-center justify-center gap-1 hover:bg-gray-50"
                                  >
                                    <UserCircle className="w-4 h-4" />
                                    <span>Assign User</span>
                                  </button>
                                )}
                              </td>
                              <td style={{ width: '96px' }} className="p-2 text-center">
                                <button
                                  onClick={() => debouncedCompleted(item.date)}
                                  disabled={pendingActions[`complete-${item.date}`]}
                                  className={`w-6 h-6 rounded border ${completed[item.date]
                                    ? 'bg-[#6B8E23] border-[#556B2F]'
                                    : 'bg-white border-gray-300'
                                    } flex items-center justify-center relative ${
                                      pendingActions[`complete-${item.date}`] ? 'opacity-50 cursor-wait' : ''
                                    }`}
                                >
                                  {pendingActions[`complete-${item.date}`] ? (
                                    <LoadingSpinner size="sm" color="[#6B8E23]" className="!m-0" />
                                  ) : (
                                    completed[item.date] && <Check className="w-4 h-4 text-white" />
                                  )}
                                </button>
                              </td>
                            </tr>
                            {expanded[item.date] && (
                              <tr>
                                <td colSpan="7" className="p-2 bg-gray-50">
                                  <div className="space-y-0 ml-[10%] max-w-xl">
                                    {/* Service Title with Type Indicator */}
                                    <div className="flex justify-between items-center mb-2">
                                      <div className="flex items-center gap-2">
                                        <h3 className="text-base font-bold text-[#6B8E23]">Order of Worship</h3>
                                        <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
                                          {serviceDetails[item.date]?.type === 'communion' ? 'Communion' :
                                           serviceDetails[item.date]?.type === 'no_communion' ? 'No Communion' :
                                           serviceDetails[item.date]?.type === 'communion_potluck' ? 'Communion with Potluck' :
                                           customServices?.find(s => s.id === serviceDetails[item.date]?.type)?.name || 'Not Set'}
                                        </span>
                                      </div>
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => handlePastorEdit(item.date)}
                                          className="px-2 py-0.5 text-sm text-[#6B8E23] border border-[#6B8E23] rounded hover:bg-[#6B8E23] hover:text-white"
                                        >
                                          Pastor Edit
                                        </button>
                                        <button
                                          onClick={() => handleDeleteServiceDetails(item.date)}
                                          className="px-2 py-0.5 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </div>
                                    {/* Map through ordered service elements */}
                                    {serviceDetails[item.date]?.elements?.map((element, index) => (
                                      <div key={index} className="flex items-center gap-1 text-sm leading-tight">
                                        <div className={`p-0.5 rounded ${element.type === 'song_hymn' ? 'bg-blue-50 text-blue-600' :
                                          element.type === 'reading' ? 'bg-green-50 text-green-600' :
                                            element.type === 'message' ? 'bg-purple-50 text-purple-600' :
                                              element.type === 'liturgical_song' ? 'bg-amber-50 text-amber-600' :
                                                'bg-gray-50 text-gray-600'
                                          }`}>
                                          {element.type === 'song_hymn' ? <Music className="w-4 h-4" /> :
                                            element.type === 'reading' ? <BookOpen className="w-4 h-4" /> :
                                              element.type === 'message' ? <MessageSquare className="w-4 h-4" /> :
                                                element.type === 'liturgical_song' ? <Music2 className="w-4 h-4" /> :
                                                  <Cross className="w-4 h-4" />
                                          }
                                        </div>
                                        <div className="flex-1">
                                          {element.type === 'song_hymn' && isSongElementFullyLoaded(element) === false ? (
                                            <>
                                              <span className="font-bold">{element.content?.split(':')?.[0]}</span>:
                                              <span className="ml-1 italic text-gray-400">Loading...</span>
                                            </>
                                          ) : element.type === 'song_hymn' && isSongElementFullyLoaded(element) === 'needs-selection' ? (
                                            <>
                                              <span className="font-bold">{element.content?.split(':')?.[0]}</span>:
                                              <span className="ml-1 italic text-amber-600">Waiting for Worship Team song selection</span>
                                            </>
                                          ) : (
                                            <>
                                              {element.content?.includes(':') ? (
                                                <>
                                                  <span className="font-bold">{element.content.split(':')[0]}</span>:
                                                  <span>{element.content.split(':').slice(1).join(':')}</span>
                                                </>
                                              ) : (
                                                element.content
                                              )}
                                              {element.selection && (element.type === 'song_hymn' || element.type === 'song_contemporary') && (
                                                <span className="text-blue-600 font-semibold ml-1">
                                                  {typeof element.selection === 'object' ? (
                                                    element.selection.type === 'hymn' ? (
                                                      !element.content.includes('#') ? `#${element.selection.number || ''}` : ''
                                                    ) : (
                                                      element.selection.author && !element.content.includes(element.selection.author) ? 
                                                        `(${element.selection.author})` : ''
                                                    )
                                                  ) : (
                                                    element.selection && !element.content.includes(element.selection) ? element.selection : ''
                                                  )}
                                                </span>
                                              )}
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                    {/* Fallback message if no elements */}
                                    {(!serviceDetails[item.date]?.elements || serviceDetails[item.date]?.elements.length === 0) && (
                                      <div className="text-gray-500 italic">
                                        No service details available yet.
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            )}
          </CardContent>
        </div>
      </div>
      {/* User Management Modal */}
      {showUserManagement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#6B8E23]">Manage Users</h2>
              <button
                onClick={handleCloseUserManagement}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <button
                onClick={handleAddUser}
                className="w-full px-3 py-2 rounded border border-[#6B8E23] text-[#6B8E23] hover:bg-[#6B8E23] hover:text-white transition-colors"
              >
                + Add New User
              </button>
              <div className="border-t pt-4">
                {availableUsers.map(user => (
                  <div key={user.name} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`delete-${user.name}`}
                      checked={usersToDelete.includes(user.name)}
                      onChange={(e) => {
                        setUsersToDelete(prev =>
                          e.target.checked
                            ? [...prev, user.name]
                            : prev.filter(name => name !== user.name)
                        );
                      }}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <label htmlFor={`delete-${user.name}`} className="text-black">
                      {user.name}
                    </label>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={handleCloseUserManagement}
                  className="px-4 py-2 rounded border border-[#6B8E23] text-[#6B8E23] hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemoveSelectedUsers}
                  className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
                >
                  Remove Selected
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showPastorInput && (
        <PastorServiceInput
          date={editingDate}
          serviceDetails={serviceDetails}  // Add this line
          onClose={() => {
            setShowPastorInput(false);
            setEditingDate(null);
          }}          onSave={async (serviceData) => {
            try {
              // Keep existing elements that have selections/references with improved matching
              const existingElements = serviceDetails[editingDate]?.elements || [];
              
              // Create a map to track which existing elements have been used
              const usedExistingElements = new Map();
              
              // Helper function to extract song number from content
              const extractSongNumber = (text) => {
                if (!text) return '';
                const numberMatch = text.match(/#(\d+)/);
                return numberMatch ? numberMatch[1] : '';
              };
              
              const updatedElements = serviceData.elements.map(newElement => {
                // If this element already has selections/references, keep them as-is
                if (newElement.selection?.title || newElement.reference) {
                  return newElement;
                }
                
                // Find best matching existing element using multiple strategies
                let bestMatch = null;
                let bestScore = -1;
                
                existingElements.forEach(existing => {
                  // Skip if already used or not the same type
                  if (usedExistingElements.has(existing.id) || existing.type !== newElement.type) {
                    return;
                  }
                  
                  // Skip if no selection or reference to preserve
                  if (!existing.selection?.title && !existing.reference) {
                    return;
                  }
                  
                  // Calculate match score between elements
                  let score = 0;
                  
                  // STRATEGY 1: Exact content match (50 points)
                  if (existing.content === newElement.content) {
                    score += 50;
                  }
                  
                  // STRATEGY 2: Prefix match (30 points)
                  const existingPrefix = existing.content.split(':')[0].trim().toLowerCase();
                  const newPrefix = newElement.content.split(':')[0].trim().toLowerCase();
                  
                  if (existingPrefix === newPrefix) {
                    score += 30;
                  } else if (existingPrefix.includes(newPrefix) || newPrefix.includes(existingPrefix)) {
                    score += 20;
                  }
                  
                  // STRATEGY 3: Position similarity (20 points max)
                  const existingIndex = existingElements.findIndex(el => el.type === existing.type);
                  const newIndex = serviceData.elements.findIndex(el => el.type === newElement.type);
                  const positionDiff = Math.abs(existingIndex - newIndex);
                  
                  if (positionDiff === 0) score += 20;
                  else if (positionDiff === 1) score += 15;
                  else if (positionDiff <= 2) score += 10;
                  
                  // STRATEGY 4: Song number match for hymns (40 points)
                  if (existing.type === 'song_hymn' || existing.type === 'liturgical_song') {
                    const existingSongNumber = extractSongNumber(existing.content);
                    const newSongNumber = extractSongNumber(newElement.content);
                    
                    if (existingSongNumber && newSongNumber && existingSongNumber === newSongNumber) {
                      score += 40;
                    }
                  }
                  
                  // Update best match if this is better
                  if (score > bestScore) {
                    bestScore = score;
                    bestMatch = existing;
                  }
                });
                
                // If we found a good match, preserve selections and references
                if (bestMatch && bestScore >= 15) {
                  // Mark this existing element as used
                  usedExistingElements.set(bestMatch.id, true);
                  
                  return {
                    ...newElement,
                    selection: bestMatch.selection,
                    reference: bestMatch.reference,
                    // Preserve ID for better continuation
                    id: bestMatch.id
                  };
                }
                
                return newElement;
              });

              const response = await fetchWithTimeout(API_ENDPOINTS.SERVICE_DETAILS, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  date: editingDate,
                  content: serviceData.content,
                  type: serviceData.type,
                  setting: serviceData.setting,
                  elements: updatedElements  // Use merged elements
                })
              });
              
              if (!response.ok) throw new Error('Failed to save service details');
              
              // Update local state with merged data
              setServiceDetails(prev => ({
                ...prev,
                [editingDate]: {
                  ...prev[editingDate],
                  elements: updatedElements,
                  type: serviceData.type,
                  setting: serviceData.setting,
                  content: serviceData.content
                }
              }));
              
              setShowPastorInput(false);
              handleSuccess('Service details saved successfully');
            } catch (error) {
              console.error('Error saving service details:', error);
              handleError(error, 'Error saving service details');
            }
          }}
        />
      )}
      {showUserSelectModal && (
        <UserSelectionModal
          showModal={!!showUserSelectModal}
          onClose={() => setShowUserSelectModal(null)}
          availableUsers={availableUsers}
          initialUserName={showUserSelectModal.currentAssignment}
          onSelect={(userName) => debouncedAssignUser(showUserSelectModal.date, userName)}
          onDelete={() => handleRemoveReservation(showUserSelectModal.date)}
          title={showUserSelectModal.currentAssignment ? "Reassign Service" : "Assign User"}
        />
      )}
      
      <AddUserModal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        onSubmit={handleAddUserSubmit}
        teamColor="#6B8E23"
        teamName="Presentation"
      />
      
      {/* Confirmation Dialog */}
      <ConfirmDialog />
    </Card>
  );
};

export default SignupSheet;