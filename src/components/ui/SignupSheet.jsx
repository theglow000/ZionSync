'use client'

// Add UserSelectionModal to the imports at the top
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserCircle, Calendar, Check, ChevronDown, ChevronUp, Mail, X, Music2, BookOpen, Pencil, Trash2, Cross, MessageSquare, Music } from 'lucide-react';
import { format, addMonths, subMonths, isSameMonth } from 'date-fns';
import MobileServiceCard from './MobileServiceCard';
import UserSelectionModal from './UserSelectionModal';
import useResponsive from '../../hooks/useResponsive';
import './table.css'
import PastorServiceInput from './PastorServiceInput'; // Add this import
import { downloadICSFile } from '../../lib/ics-generator'; // Change this import

const SignupSheet = ({ serviceDetails, setServiceDetails }) => {
  const { isMobile } = useResponsive();
  // Initialize all state at the top of component
  const [expanded, setExpanded] = useState({});
  const [showRegistration, setShowRegistration] = useState(false);
  const [signups, setSignups] = useState({});
  const [currentDate, setCurrentDate] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
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
  const [alertPosition, setAlertPosition] = useState({ x: 0, y: 0 });
  const POLLING_INTERVAL = 30000;
  const [customServices, setCustomServices] = useState([]);
  const [showUserSelectModal, setShowUserSelectModal] = useState(null); // { date, currentAssignment }

  const checkForOrderOfWorship = (date) => {
    const elements = serviceDetails[date]?.elements;
    return Array.isArray(elements) && elements.length > 0;
  };

  const isFutureDate = (dateStr) => {
    const [month, day, year] = dateStr.split('/').map(num => parseInt(num, 10));
    // Set time to start of day for accurate comparison
    const dateToCheck = new Date(year, month - 1, day);
    dateToCheck.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return dateToCheck >= today;
  };

  const handleAddUser = async () => {
    const name = prompt('Enter new user name:');
    if (name) {
      try {
        await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name })
        });

        setAvailableUsers(prev => [...prev, { name }]);
      } catch (error) {
        console.error('Error adding user:', error);
        setAlertMessage('Error adding user');
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
      }
    }
  };

  const handleRemoveUser = async (userName, skipConfirm = true) => {
    if (!skipConfirm && !confirm(`Remove ${userName} from users list?`)) {
      return;
    }

    try {
      await fetch('/api/users', {
        method: 'DELETE',
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
      setAlertMessage('Error removing user');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    }
  };

  // Update the useEffect data fetching
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch users
        console.log('Fetching users...');
        const usersResponse = await fetch('/api/users');
        if (!usersResponse.ok) throw new Error('Failed to fetch users');
        const usersData = await usersResponse.json();
        setAvailableUsers(usersData);

        // Fetch signups
        console.log('Fetching signups...');
        const signupsResponse = await fetch('/api/signups');
        if (!signupsResponse.ok) throw new Error('Failed to fetch signups');
        const signupsData = await signupsResponse.json();

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

        // Fetch completed status
        console.log('Fetching completed status...');
        const completedResponse = await fetch('/api/completed');
        if (!completedResponse.ok) throw new Error('Failed to fetch completed status');
        const completedData = await completedResponse.json();

        const completedObj = {};
        completedData.forEach(item => {
          completedObj[item.date] = item.completed;
        });
        setCompleted(completedObj);

      } catch (error) {
        console.error('Error fetching data:', error);
        setAlertMessage(`Error loading data: ${error.message}`);
        setShowAlert(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    let isSubscribed = true;

    const fetchServiceDetails = async () => {
      try {
        const response = await fetch('/api/service-details');
        if (!response.ok) throw new Error('Failed to fetch service details');
        const data = await response.json();

        if (isSubscribed) {
          setServiceDetails(prev => {
            const merged = { ...prev };
            Object.keys(data).forEach(date => {
              const existingElements = prev[date]?.elements || [];
              const newElements = data[date]?.elements || [];

              // Improved merging logic for elements
              const mergedElements = newElements.map(newElement => {
                // Find matching existing element with more robust matching
                const existingElement = existingElements.find(existing => {
                  // Match by ID if available
                  if (existing.id && newElement.id && existing.id === newElement.id) {
                    return true;
                  }
                  
                  // For readings and messages, match by type and content prefix
                  if ((existing.type === 'reading' || existing.type === 'message') && 
                      existing.type === newElement.type) {
                    const existingPrefix = existing.content.split(':')[0];
                    const newPrefix = newElement.content.split(':')[0];
                    return existingPrefix === newPrefix;
                  }
                  
                  // For songs, match by type and position
                  if ((existing.type === 'song_hymn' || existing.type === 'song_contemporary' ||
                       existing.type === 'liturgical_song') && existing.type === newElement.type) {
                    // Try to match by position in the service
                    const existingIndex = existingElements.indexOf(existing);
                    const newIndex = newElements.indexOf(newElement);
                    return existingIndex === newIndex;
                  }
                  
                  return false;
                });
                
                // If we found a matching element
                if (existingElement) {
                  // For songs, preserve selections while updating content
                  if (newElement.type === 'song_hymn' || newElement.type === 'song_contemporary' ||
                      newElement.type === 'liturgical_song') {
                    return {
                      ...newElement,
                      selection: existingElement.selection || newElement.selection,
                      reference: existingElement.reference || newElement.reference
                    };
                  }
                  
                  // For readings and messages, preserve formatting while updating content
                  if (newElement.type === 'reading' || newElement.type === 'message') {
                    return {
                      ...existingElement,
                      ...newElement,
                      content: newElement.content || existingElement.content
                    };
                  }
                }
                
                // For elements without a match or other element types, use the new data
                return newElement;
              });

              merged[date] = {
                ...prev[date],
                ...data[date],
                elements: mergedElements
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
    const intervalId = setInterval(fetchServiceDetails, 30000); // 30 second polling

    return () => {
      isSubscribed = false;
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const fetchCustomServices = async () => {
      try {
        const response = await fetch('/api/custom-services');
        if (response.ok) {
          const data = await response.json();
          setCustomServices(data);
        }
      } catch (error) {
        console.error('Error fetching custom services:', error);
      }
    };

    fetchCustomServices();
  }, []);

  const dates = [
    { date: '1/5/25', day: 'Sunday', title: 'Epiphany' },
    { date: '1/12/25', day: 'Sunday', title: 'Baptism of our Lord' },
    { date: '1/19/25', day: 'Sunday', title: 'Epiphany Week 2' },
    { date: '1/26/25', day: 'Sunday', title: 'Epiphany Week 3' },
    { date: '2/2/25', day: 'Sunday', title: 'Presentation of Our Lord' },
    { date: '2/9/25', day: 'Sunday', title: 'Epiphany Week 5' },
    { date: '2/16/25', day: 'Sunday', title: 'Epiphany Week 6' },
    { date: '2/23/25', day: 'Sunday', title: 'Epiphany Week 7' },
    { date: '3/2/25', day: 'Sunday', title: 'The Transfiguration of Our Lord' },
    { date: '3/5/25', day: 'Wednesday', title: 'Ash Wednesday' },
    { date: '3/9/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '3/12/25', day: 'Wednesday', title: 'Lent Worship' },
    { date: '3/16/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '3/19/25', day: 'Wednesday', title: 'Lent Worship' },
    { date: '3/23/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '3/26/25', day: 'Wednesday', title: 'Lent Worship' },
    { date: '3/30/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '4/2/25', day: 'Wednesday', title: 'Lent Worship' },
    { date: '4/6/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '4/9/25', day: 'Wednesday', title: 'Lent Worship' },
    { date: '4/13/25', day: 'Sunday', title: 'Palm Sunday' },
    { date: '4/17/25', day: 'Thursday', title: 'Maundy Thursday' },
    { date: '4/18/25', day: 'Friday', title: 'Good Friday' },
    { date: '4/20/25', day: 'Sunday', title: 'Easter Sunday' },
    { date: '4/27/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '5/4/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '5/11/25', day: 'Sunday', title: 'Mother\'s Day' },
    { date: '5/18/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '5/25/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '6/1/25', day: 'Sunday', title: 'VBS Week' },
    { date: '6/8/25', day: 'Sunday', title: 'Pentecost/Confirmation Sunday' },
    { date: '6/15/25', day: 'Sunday', title: 'Trinity Sunday/Father\'s Day' },
    { date: '6/22/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '6/29/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '7/6/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '7/13/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '7/20/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '7/27/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '8/3/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '8/10/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '8/17/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '8/24/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '8/31/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '9/7/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '9/14/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '9/21/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '9/28/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '10/5/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '10/12/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '10/19/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '10/26/25', day: 'Sunday', title: 'Reformation Sunday' },
    { date: '11/2/25', day: 'Sunday', title: 'All Saint\'s Day' },
    { date: '11/9/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '11/16/25', day: 'Sunday', title: 'Sunday Worship' },
    { date: '11/23/25', day: 'Sunday', title: 'Christ the King' },
    { date: '11/26/25', day: 'Wednesday', title: 'Thanksgiving Eve' },
    { date: '11/30/25', day: 'Sunday', title: 'Advent 1' },
    { date: '12/7/25', day: 'Sunday', title: 'Advent 2' },
    { date: '12/14/25', day: 'Sunday', title: 'Advent 3' },
    { date: '12/21/25', day: 'Sunday', title: 'Advent 4 (Kid\'s Christmas Program)' },
    { date: '12/24/25', day: 'Wednesday', title: 'Christmas Eve Services (3pm & 7pm)' },
    { date: '12/28/25', day: 'Sunday', title: 'Christmas Week 1' }
  ];

  const handleSignup = async () => {
    const nameInput = document.querySelector('input[name="name"]');

    if (!nameInput) return;

    const name = nameInput.value;

    if (!name) return;

    try {
      // Save to MongoDB
      await fetch('/api/signups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: currentDate,
          name,
        })
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
      setAlertMessage('Successfully signed up! Date added to calendar selection.');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    } catch (error) {
      setAlertMessage('Error saving signup. Please try again.');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    }
  };

  // Update handleServiceDetailChange function
  const handleServiceDetailChange = async (date, field, value) => {
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

          const response = await fetch('/api/service-details', {
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
          console.log('Save successful:', result);
        } catch (error) {
          console.error('Save error:', error);
          setServiceDetailsError(error.message);
          setAlertMessage('Failed to save service details');
          setShowAlert(true);
        }
      }, 500);
    } catch (error) {
      console.error('Error:', error);
      setServiceDetailsError(error.message);
      setAlertMessage('Error updating service details');
      setShowAlert(true);
    }
  };

  const handleRemoveReservation = async (date) => {
    if (signups[date]) {
      try {
        await fetch('/api/signups', {
          method: 'DELETE',
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
        setAlertMessage('Reservation removed successfully');
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
      } catch (error) {
        setAlertMessage('Error removing reservation. Please try again.');
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
      }
    }
  };

  const handleCompleted = async (date) => {
    const newValue = !completed[date];
    try {
      await fetch('/api/completed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date,
          completed: newValue
        })
      });

      setCompleted(prev => ({
        ...prev,
        [date]: newValue
      }));
    } catch (error) {
      console.error('Error updating completed status:', error);
    }
  };

  const handleCalendarDownload = async () => {
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

      setAlertMessage('Calendar file downloaded successfully');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    } catch (error) {
      console.error('Error creating calendar file:', error);
      setAlertMessage('Error creating calendar file. Please try again.');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    }
  };

  const checkForSelectedSongs = (date) => {
    const elements = serviceDetails[date]?.elements;
    const songElements = elements?.filter(element => element.type === 'song_hymn');

    console.log('Checking songs for date:', date, {
      elements: songElements,
      hasSongs: songElements?.some(element => element.selection?.title)
    });

    // Check if any songs have a reference (which indicates they were selected)
    // OR if they have a selection.title
    return songElements?.some(element =>
      element.reference || element.selection?.title
    );
  };

  const handleAssignUser = async (date, userName) => {
    try {
      const response = await fetch('/api/signups', {
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

      setAlertMessage(`Successfully assigned to ${userName}!`);
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    } catch (error) {
      console.error('Error saving signup:', error);
      setAlertMessage('Error saving assignment. Please try again.');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    }
  };

  // Add this helper function near your other helper functions
  const isSongElementFullyLoaded = (element) => {
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
  };

  return (
 <Card className="w-full h-full mx-auto relative bg-white shadow-lg">
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
                <p className="text-2xl font-bold text-center text-gray-600">2025 Service Schedule</p>
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
                <p className="text-lg font-bold text-gray-600">2025 Service Schedule</p>
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
            <div className="h-full">
              {/* Desktop Table View */}
              <div className="hidden md:block h-full">
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
                            <tr className={index % 2 === 0 ? 'bg-gray-50' : ''}>
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
                                  onClick={() => handleCompleted(item.date)}
                                  className={`w-6 h-6 rounded border ${completed[item.date]
                                    ? 'bg-[#6B8E23] border-[#556B2F]'
                                    : 'bg-white border-gray-300'
                                    } flex items-center justify-center`}
                                >
                                  {completed[item.date] && <Check className="w-4 h-4 text-white" />}
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
                                          onClick={() => {
                                            setEditingDate(item.date);
                                            setShowPastorInput(true);
                                          }}
                                          className="px-2 py-0.5 text-sm text-[#6B8E23] border border-[#6B8E23] rounded hover:bg-[#6B8E23] hover:text-white"
                                        >
                                          Pastor Edit
                                        </button>
                                        <button
                                          onClick={async () => {
                                            if (confirm('Are you sure you want to delete this service\'s details?')) {
                                              try {
                                                const response = await fetch(`/api/service-details?date=${item.date}`, {
                                                  method: 'DELETE',
                                                });

                                                if (!response.ok) throw new Error('Failed to delete service details');

                                                // Update the local state by removing service details
                                                setServiceDetails(prev => {
                                                  const newDetails = { ...prev };
                                                  delete newDetails[item.date];
                                                  return newDetails;
                                                });
                                                setAlertMessage('Service details deleted successfully');
                                                setShowAlert(true);
                                                setTimeout(() => setShowAlert(false), 3000);
                                              } catch (error) {
                                                console.error('Error deleting service details:', error);
                                                setAlertMessage('Error deleting service details');
                                                setShowAlert(true);
                                                setTimeout(() => setShowAlert(false), 3000);
                                              }
                                            }
                                          }}
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
              </div>
              {/* Mobile Card View */}
              <div className="md:hidden">
                {dates.map((item) => (
                  <MobileServiceCard
                    key={item.date}
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
                    setAlertMessage={setAlertMessage}
                    setShowAlert={setShowAlert}
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
                        await fetch('/api/service-details', {
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

                        setAlertMessage('Service details deleted successfully');
                        setShowAlert(true);
                        setTimeout(() => setShowAlert(false), 3000);
                      } catch (error) {
                        console.error('Error deleting service details:', error);
                        setAlertMessage('Error deleting service details');
                        setShowAlert(true);
                        setTimeout(() => setShowAlert(false), 3000);
                      }
                    }}
                  />
                ))}
              </div>
            </div>
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
                onClick={() => {
                  setShowUserManagement(false);
                  setUsersToDelete([]);
                }}
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
                  onClick={() => {
                    setShowUserManagement(false);
                    setUsersToDelete([]);
                  }}
                  className="px-4 py-2 rounded border border-[#6B8E23] text-[#6B8E23] hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (usersToDelete.length === 0) {
                      setAlertMessage('Please select users to remove');
                      setShowAlert(true);
                      setTimeout(() => setShowAlert(false), 3000);
                      return;
                    }

                    if (confirm(`Are you sure you want to remove ${usersToDelete.length} user${usersToDelete.length > 1 ? 's' : ''}?`)) {
                      for (const userName of usersToDelete) {
                        await handleRemoveUser(userName);
                      }
                      setShowUserManagement(false);
                      setUsersToDelete([]);
                      setAlertMessage('Users removed successfully');
                      setShowAlert(true);
                      setTimeout(() => setShowAlert(false), 3000);
                    }
                  }}
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
          }}
          onSave={async (serviceData) => {
            try {
              // Keep existing elements that have selections/references with improved matching
              const existingElements = serviceDetails[editingDate]?.elements || [];
              const updatedElements = serviceData.elements.map(newElement => {
                // Find matching existing element with more robust matching
                const existingElement = existingElements.find(existing => {
                  // Match by ID if available
                  if (existing.id && newElement.id && existing.id === newElement.id) {
                    return true;
                  }
                  
                  // For readings and messages, match by type and content prefix
                  if ((existing.type === 'reading' || existing.type === 'message') && 
                      existing.type === newElement.type) {
                    const existingPrefix = existing.content.split(':')[0];
                    const newPrefix = newElement.content.split(':')[0];
                    return existingPrefix === newPrefix;
                  }
                  
                  // For songs, try to match by type and position or content
                  if ((existing.type === 'song_hymn' || existing.type === 'song_contemporary' ||
                       existing.type === 'liturgical_song') && existing.type === newElement.type) {
                    // If content has a match, consider it the same element
                    if (existing.content && newElement.content) {
                      return existing.content.split(':')[0] === newElement.content.split(':')[0];
                    }
                    
                    // Try to match by position in the service
                    const existingIndex = existingElements.indexOf(existing);
                    const newIndex = serviceData.elements.indexOf(newElement);
                    return existingIndex === newIndex;
                  }
                  
                  return false;
                });
                
                // If we found a match, preserve selections and references
                if (existingElement?.selection || existingElement?.reference) {
                  return {
                    ...newElement,
                    selection: existingElement.selection,
                    reference: existingElement.reference
                  };
                }
                
                return newElement;
              });

              const response = await fetch('/api/service-details', {
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
              setAlertMessage('Service details saved successfully');
              setShowAlert(true);
              setTimeout(() => setShowAlert(false), 3000);
            } catch (error) {
              console.error('Error saving service details:', error);
              setAlertMessage('Error saving service details. Please try again.');
              setShowAlert(true);
              setTimeout(() => setShowAlert(false), 3000);
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
          onSelect={(userName) => handleAssignUser(showUserSelectModal.date, userName)}
          onDelete={() => handleRemoveReservation(showUserSelectModal.date)}
          title={showUserSelectModal.currentAssignment ? "Reassign Service" : "Assign User"}
        />
      )}
    </Card>
  );
};

export default SignupSheet;