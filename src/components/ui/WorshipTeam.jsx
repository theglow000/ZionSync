import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, UserCircle, X, Music2, CheckCircle2, ChevronUp, ChevronDown, AlertCircle, Edit2, Pencil, Database } from 'lucide-react';
import ServiceSongSelector from './ServiceSongSelector';
import MobileWorshipServiceCard from './MobileWorshipServiceCard';
import MobileWorshipSelect from './MobileWorshipSelect';
import useResponsive from '../../hooks/useResponsive';
import Link from 'next/link';

// Dates array
const DATES = [
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
  { date: '6/8/25', day: 'Sunday', title: 'Confirmation Sunday' },
  { date: '6/15/25', day: 'Sunday', title: 'Father\'s Day' },
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
  { date: '10/26/25', day: 'Sunday', title: 'Sunday Worship' },
  { date: '11/2/25', day: 'Sunday', title: 'Sunday Worship' },
  { date: '11/9/25', day: 'Sunday', title: 'Sunday Worship' },
  { date: '11/16/25', day: 'Sunday', title: 'Sunday Worship' },
  { date: '11/23/25', day: 'Sunday', title: 'Sunday Worship' },
  { date: '11/26/25', day: 'Wednesday', title: 'Thanksgiving Eve' },
  { date: '11/30/25', day: 'Sunday', title: 'Advent 1' },
  { date: '12/7/25', day: 'Sunday', title: 'Advent 2' },
  { date: '12/14/25', day: 'Sunday', title: 'Advent 3' },
  { date: '12/21/25', day: 'Sunday', title: 'Advent 4 (Kid\'s Christmas Program)' },
  { date: '12/24/25', day: 'Wednesday', title: 'Christmas Eve Services (3pm & 7pm)' },
  { date: '12/28/25', day: 'Sunday', title: 'Christmas Week 1' }
];

// Add team selection modal
const TeamSelectorModal = ({
  date,
  onClose,
  assignments,
  serviceDetails,
  users,
  currentUser,
  setAssignments,
  setAlertMessage,
  setShowAlert,
  fetchAssignments
}) => {
  const currentAssignment = assignments[date];

  const handleTeamSelect = async (team) => {
    try {
      // First update the UI optimistically
      setAssignments(prev => ({
        ...prev,
        [date]: {
          ...prev[date],
          team: team.name
        }
      }));

      // Make the API call
      const response = await fetch('/api/worship-assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date,
          team: team.name,
          updatedBy: currentUser?.name || 'Unknown'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update team');
      }

      // Show success message
      setAlertMessage('Team updated successfully');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);

      // Fetch fresh data
      await fetchAssignments();

      // Close the modal
      onClose();
    } catch (error) {
      console.error('Error updating team:', error);
      // Revert the optimistic update
      setAssignments(prev => ({
        ...prev,
        [date]: {
          ...prev[date],
          team: currentAssignment?.team
        }
      }));
      setAlertMessage(`Error updating team: ${error.message}`);
      setShowAlert(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-bold text-purple-700">Edit Team Assignment</h3>
            {/* Access the specific service details for this date */}
            <p className="text-sm text-gray-600">{serviceDetails[date]?.title} - {date}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Regular Teams */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Regular Teams</p>
            {users
              .filter(user => user.name.includes('&'))
              .map(team => (
                <button
                  key={team.name}
                  onClick={() => handleTeamSelect(team)}
                  className={`w-full p-3 text-left rounded-lg transition-colors ${currentAssignment?.team === team.name
                    ? 'bg-purple-700 text-white'
                    : 'bg-white text-gray-900 border border-gray-200 hover:bg-purple-50'
                    }`}
                >
                  {team.name}
                </button>
              ))}
          </div>

          {/* Special Teams */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Special Teams</p>
            {users
              .filter(user => (
                user.role === 'special' ||
                user.role === 'pastor' ||
                user.role === 'leader' ||
                user.name.includes('Confirmation') ||
                user.name.includes('Sunday School')
              ))
              .map(team => (
                <button
                  key={team.name}
                  onClick={() => handleTeamSelect(team)}
                  className={`w-full p-3 text-left rounded-lg transition-colors ${currentAssignment?.team === team.name
                    ? 'bg-purple-700 text-white'
                    : 'bg-white text-gray-900 border border-gray-200 hover:bg-purple-50'
                    }`}
                >
                  {team.name}
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const WorshipTeam = ({ serviceDetails, setServiceDetails }) => {
  // All state declarations stay here
  const [currentUser, setCurrentUser] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [alertPosition, setAlertPosition] = useState({ x: 0, y: 0 });
  const [expanded, setExpanded] = useState({});
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [availableSongs, setAvailableSongs] = useState({ hymn: [], contemporary: [] });
  const [showTeamSelector, setShowTeamSelector] = useState(false);
  const [editingDate, setEditingDate] = useState(null);
  const [teams, setTeams] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [users, setUsers] = useState([]);
  const dates = useMemo(() => DATES, []);
  const [customServices, setCustomServices] = useState([]);
  const POLLING_INTERVAL = 30000;

  // Add this hook for responsive detection
  const { isMobile } = useResponsive();

  // Add this useEffect to fetch custom services
  useEffect(() => {
    const fetchCustomServices = async () => {
      try {
        const response = await fetch('/api/custom-services');
        if (!response.ok) throw new Error('Failed to fetch custom services');
        const data = await response.json();
        setCustomServices(data);
      } catch (error) {
        console.error('Error fetching custom services:', error);
      }
    };

    fetchCustomServices();
  }, []);

  // Single fetch for songs on component mount
  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const response = await fetch('/api/songs');
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
        const usersResponse = await fetch('/api/users/worship', {
          signal: controller.signal
        });
        if (!usersResponse.ok) throw new Error('Failed to fetch users');
        const data = await usersResponse.json();

        // Filter and organize users
        const allUsers = data.users || [];
        
        setUsers(allUsers);
        setAvailableUsers(allUsers);

        // Fetch assignments
        const assignmentsResponse = await fetch('/api/worship-assignments', {
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

      } catch (error) {
        if (error.name === 'AbortError') return;
        console.error('Error:', error);
        setAlertMessage('Error loading data: ' + error.message);
        setShowAlert(true);
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
        const response = await fetch('/api/service-details');
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
        const response = await fetch('/api/worship-assignments');
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

  // Add this function in WorshipTeam.jsx
  const handleSongSelection = async (date, songId, songData) => {
    try {
      // First update service-songs collection
      await fetch('/api/service-songs', {
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
      const updatedElements = serviceDetails[date]?.elements.map(element => {
        if (element.type === 'song_hymn' && element.id === songId) {
          return {
            ...element,
            selection: songData
          };
        }
        return element;
      });

      await fetch('/api/service-details', {
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

      // Update local state
      setServiceDetails(prev => ({
        ...prev,
        [date]: {
          ...prev[date],
          elements: updatedElements
        }
      }));

    } catch (error) {
      console.error('Error saving song selection:', error);
      setAlertMessage('Error saving song selection');
      setShowAlert(true);
    }
  };

  return (
    <Card className="w-full h-full mx-auto relative bg-white shadow-lg">
      {showAlert && (
        <Alert
          className="fixed z-[60] w-80 bg-white border-purple-700 shadow-lg rounded-lg"
          style={{
            top: `${alertPosition.y}px`,
            left: `${alertPosition.x}px`,
            transform: 'translate(-50%, -120%)'
          }}
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
                  <img src="/church-logo.png" alt="Church Logo" className="h-10 object-contain" />
                  <img src="/ZionSyncLogo.png" alt="ZionSync Logo" className="h-10 object-contain" />
                </div>
              </div>
              <div className="text-center">
                <h1 className="text-xl font-bold text-purple-700">Worship Team</h1>
                <p className="text-lg font-bold text-gray-600">2025 Service Schedule</p>
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
                    <span>Manage Song Database</span>
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
                        onClick={() => {
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
                        }}
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
            <div className="h-full overflow-y-auto">
              <div className="space-y-4 p-4">
                {/* Desktop View */}
                {!isMobile && dates.map((item) => (
                  <div key={item.date}>
                    <ServiceSongSelector
                      date={item.date}
                      currentUser={currentUser}
                      serviceDetails={serviceDetails[item.date]}
                      setServiceDetails={setServiceDetails}
                      customServices={customServices}
                      availableSongs={availableSongs}
                      team={assignments[item.date]?.team}
                      expanded={expanded[item.date]}
                      onSongSelect={handleSongSelection}
                      onToggleExpand={(date) => {
                        setExpanded(prev => ({
                          ...prev,
                          [date]: !prev[date]
                        }));
                      }}
                      onEditTeam={() => handleEditTeam(item.date)}
                      header={
                        <div className="flex items-center justify-between w-full">
                          {/* Left Side - Service Info */}
                          <div
                            className="flex items-center flex-1 cursor-pointer hover:bg-gray-50 p-2 rounded"
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
                            
                            {/* Team Assignment Badge - More like presentation team */}
                            <div className="flex items-center gap-1">
                              <div className="flex items-center bg-purple-100 rounded px-2 py-0.5">
                                <UserCircle className="w-3 h-3 text-purple-700 mr-1" />
                                <span className="text-xs text-purple-700">
                                  {assignments[item.date]?.team || 'No team assigned'}
                                </span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditTeam(item.date);
                                }}
                                className="p-1 hover:bg-gray-100 rounded"
                                title="Edit team assignment"
                              >
                                <Pencil className="w-3 h-3 text-purple-700" />
                              </button>
                            </div>
                            
                            {/* Expand/Collapse button */}
                            <button
                              onClick={() => setExpanded(prev => ({...prev, [item.date]: !prev[item.date]}))}
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
                ))}
                
                {/* Mobile View */}
                {isMobile && dates.map((item) => (
                  <MobileWorshipServiceCard
                    key={item.date}
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
                ))}
              </div>
            </div>
          </CardContent>
        </div>
      </div>

      {/* Team Selector Modal */}
      {showTeamSelector && editingDate && (
        <TeamSelectorModal
          date={editingDate}
          onClose={() => {
            setShowTeamSelector(false);
            setEditingDate(null);
          }}
          assignments={assignments}
          serviceDetails={serviceDetails}
          users={users}
          currentUser={currentUser}
          setAssignments={setAssignments}
          setAlertMessage={setAlertMessage}
          setShowAlert={setShowAlert}
          fetchAssignments={() => {
            // Add your fetchAssignments logic here if needed
          }}
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
                  onClick={async () => {
                    const name = prompt('Enter new user name:');
                    if (name) {
                      try {
                        await fetch('/api/worship-users', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({ name })
                        });

                        setAvailableUsers(prev => [...prev, { name }]);
                        setAlertMessage('User added successfully');
                        setShowAlert(true);
                        setTimeout(() => setShowAlert(false), 3000);
                      } catch (error) {
                        console.error('Error adding user:', error);
                        setAlertMessage('Error adding user');
                        setShowAlert(true);
                        setTimeout(() => setShowAlert(false), 3000);
                      }
                    }
                  }}
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
                        onClick={async () => {
                          try {
                            await fetch('/api/worship-users', {
                              method: 'DELETE',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({ name: user.name })
                            });
                            setAvailableUsers(prev =>
                              prev.filter(u => u.name !== user.name)
                            );
                            if (user.name === currentUser?.name) {
                              setCurrentUser(null);
                            }
                          } catch (error) {
                            console.error('Error removing user:', error);
                            setAlertMessage('Error removing user');
                            setShowAlert(true);
                            setTimeout(() => setShowAlert(false), 3000);
                          }
                        }}
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
    </Card >
  );
};

export default WorshipTeam;