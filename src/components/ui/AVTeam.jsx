import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, UserCircle, X, Trash2, Edit2 } from 'lucide-react';
import MobileAVTeamCard from './MobileAVTeamCard';
import useResponsive from '../../hooks/useResponsive';
import { useDebounce } from '../../hooks/useDebounce';
import { useAlertManager } from '../../hooks';
import { useConfirm } from '../../hooks/useConfirm';
import { LoadingSpinner, YearSelector } from '../shared';
import { ERROR_MESSAGES, SUCCESS_MESSAGES, createErrorHandler, createSuccessHandler } from '../../utils/errorHandler';
import { POLLING_INTERVAL, AV_ROTATION_MEMBERS, COLOR_THEMES, API_ENDPOINTS } from '../../lib/constants';
import { fetchWithTimeout, fetchWithRetry, parseJSON, apiPost, apiGet, apiDelete, apiPut } from '../../lib/api-utils';
import UserSelectionModal from './UserSelectionModal';
import AddUserModal from './AddUserModal';

const AVTeam = ({ selectedYear, setSelectedYear, availableYears }) => {
    const [assignments, setAssignments] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [showUserManagement, setShowUserManagement] = useState(false);
    const [usersToDelete, setUsersToDelete] = useState([]);
    // Track which position is being edited
    const [editingPosition, setEditingPosition] = useState(null); // { date, position, currentMember }
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [pendingActions, setPendingActions] = useState({}); // Track pending debounced actions

    // Refs for auto-scrolling to current date (consolidated for both views)
    const dateRefs = React.useRef({});
    const componentRootRef = React.useRef(null);

    // Add useResponsive and useAlertManager hooks
    const { isMobile } = useResponsive();
    const { 
        showAlert, 
        alertMessage, 
        alertPosition, 
        setAlertPosition, 
        showAlertWithTimeout 
    } = useAlertManager();
    
    // Use confirm dialog hook
    const { confirm, ConfirmDialog } = useConfirm();

    // Centralized error and success handlers
    const handleError = useMemo(
        () => createErrorHandler('A/V Team', (message) => showAlertWithTimeout(message)),
        [showAlertWithTimeout]
    );
    
    const handleSuccess = useMemo(
        () => createSuccessHandler((message) => showAlertWithTimeout(message)),
        [showAlertWithTimeout]
    );

    // Use rotation members from constants
    const rotationMembers = useMemo(() => AV_ROTATION_MEMBERS, []);

    // Sprint 4.2: Dynamic dates from API
    const [dates, setDates] = useState([]);
    const [datesLoading, setDatesLoading] = useState(false);

    // Memoize rotation member calculation
    const getRotationMember = useCallback((index) => {
        return rotationMembers[index % rotationMembers.length];
    }, [rotationMembers]);

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

    // Consolidated data fetching - matches pattern from SignupSheet and WorshipTeam
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch users first
                const usersResponse = await fetchWithTimeout(API_ENDPOINTS.AV_USERS);
                if (!usersResponse.ok) throw new Error('Failed to fetch AV users');
                const existingUsers = await usersResponse.json();
                const currentUsers = Array.isArray(existingUsers) ? existingUsers : [];

                // Initialize required team members if they don't exist
                const initialMembers = ['Ben', 'Doug', 'Jaimes', 'Laila', 'Brett', 'Justin'];
                
                for (const member of initialMembers) {
                    if (!currentUsers.some(user => user.name === member)) {
                        const addResponse = await fetchWithTimeout(API_ENDPOINTS.AV_USERS, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ name: member })
                        });
                        if (!addResponse.ok) {
                            console.error(`Failed to add user ${member}`);
                        }
                    }
                }

                // Fetch final user list
                const finalUsersResponse = await fetchWithTimeout(API_ENDPOINTS.AV_USERS);
                if (!finalUsersResponse.ok) throw new Error('Failed to fetch final user list');
                const finalUsers = await finalUsersResponse.json();
                setAvailableUsers(Array.isArray(finalUsers) ? finalUsers : []);

                // Fetch assignments
                const assignmentsResponse = await fetchWithTimeout(API_ENDPOINTS.AV_TEAM);
                if (!assignmentsResponse.ok) throw new Error('Failed to fetch assignments');
                const assignmentsData = await assignmentsResponse.json();
                
                if (assignmentsData.assignments) {
                    setAssignments(assignmentsData.assignments.reduce((acc, curr) => {
                        acc[curr.date] = {
                            team_member_1: curr.team_member_1,
                            team_member_2: curr.team_member_2,
                            team_member_3: curr.team_member_3
                        };
                        return acc;
                    }, {}));
                }

            } catch (error) {
                console.error('Error fetching data:', error);
                handleError(error, 'Error loading data');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // Handle user signup with useCallback optimization
    const handleSignup = useCallback(async (date, position = 3, userName) => {
        try {
            const response = await fetchWithTimeout(API_ENDPOINTS.AV_TEAM, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'signup',
                    date,
                    position,
                    name: userName
                })
            });

            if (!response.ok) throw new Error('Failed to save signup');

            setAssignments(prev => ({
                ...prev,
                [date]: {
                    ...prev[date],
                    team_member_3: userName
                }
            }));

            handleSuccess('Successfully signed up!');
        } catch (error) {
            console.error('Error signing up:', error);
            handleError(error, 'Error saving signup');
        }
    }, []);

    // Handle removing assignment with useCallback optimization
    const handleRemoveAssignment = useCallback(async (date) => {
        try {
            const response = await fetchWithTimeout(API_ENDPOINTS.AV_TEAM, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'signup',
                    date,
                    position: 3,
                    name: null
                })
            });

            if (!response.ok) throw new Error('Failed to remove signup');

            setAssignments(prev => {
                const newAssignments = { ...prev };
                if (newAssignments[date]) {
                    delete newAssignments[date].team_member_3;
                }
                return newAssignments;
            });

            handleSuccess('Assignment removed successfully');
        } catch (error) {
            console.error('Error removing assignment:', error);
            handleError(error, 'Error removing assignment');
        }
    }, []);

    // User management handlers
    const handleAddUser = () => {
        setShowAddUserModal(true);
    };

    const handleAddUserSubmit = async (name) => {
        try {
            await apiPost(API_ENDPOINTS.AV_USERS, { name });

            setAvailableUsers(prev => [...prev, { name }]);
            setShowAddUserModal(false);
            handleSuccess(SUCCESS_MESSAGES.USER_ADDED);
        } catch (error) {
            handleError(error, { operation: 'addUser', name }, ERROR_MESSAGES.USER_ADD_ERROR);
            throw error; // Re-throw to let modal handle error display
        }
    };

    // Handle assignment updates with useCallback optimization
    const handleAssignment = useCallback(async (date, position, name) => {
        // Store previous state for rollback
        const previousAssignment = assignments[date]?.[`team_member_${position}`];
        
        // OPTIMISTIC UPDATE: Update UI immediately
        setAssignments(prev => ({
            ...prev,
            [date]: {
                ...prev[date],
                [`team_member_${position}`]: name
            }
        }));
        
        try {
            const response = await fetchWithTimeout(API_ENDPOINTS.AV_TEAM, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'signup',
                    date,
                    position,
                    name
                })
            });

            if (!response.ok) throw new Error('Failed to update assignment');

            handleSuccess(SUCCESS_MESSAGES.ASSIGNMENT_SAVED);
        } catch (error) {
            // ROLLBACK: Restore previous state on error
            setAssignments(prev => ({
                ...prev,
                [date]: {
                    ...prev[date],
                    [`team_member_${position}`]: previousAssignment
                }
            }));
            
            handleError(error, { operation: 'updateAssignment', date, position }, ERROR_MESSAGES.ASSIGNMENT_ERROR);
        } finally {
            // Clear pending state
            setPendingActions(prev => {
                const newState = { ...prev };
                delete newState[`assignment-${date}-${position}`];
                return newState;
            });
        }
    }, [assignments, handleSuccess, handleError]); // Add error handlers

    // Debounced version of handleAssignment
    const [debouncedAssignment] = useDebounce((date, position, name) => {
        setPendingActions(prev => ({ ...prev, [`assignment-${date}-${position}`]: true }));
        handleAssignment(date, position, name);
    }, 300);

    // Check if date is in the past with useCallback optimization
    const isPastDate = useCallback((dateStr) => {
        const [month, day, year] = dateStr.split('/').map(Number);
        const dateToCheck = new Date(2000 + year, month - 1, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return dateToCheck < today;
    }, []);

    // Handle user selection from modal with useCallback optimization
    const handleUserSelect = useCallback((userName) => {
        if (!editingPosition) return;
        
        const { date, position } = editingPosition;
        
        if (position === 3) {
            handleSignup(date, position, userName);
        } else {
            debouncedAssignment(date, position, userName);
        }
        
        // Close the modal
        setEditingPosition(null);
    }, [editingPosition, handleSignup, debouncedAssignment]);

    // Handle deletion from modal with useCallback optimization
    const handleDeleteFromModal = useCallback(() => {
        if (!editingPosition || editingPosition.position !== 3) return;
        
        const { date } = editingPosition;
        handleRemoveAssignment(date);
        
        // Close the modal
        setEditingPosition(null);
    }, [editingPosition, handleRemoveAssignment]);

    return (
        <Card ref={componentRootRef} className="w-full h-full mx-auto relative bg-white shadow-lg">
            {showAlert && (
                <Alert
                    className="fixed z-[60] w-80 bg-white border-red-700 shadow-lg rounded-lg"
                    style={{
                        top: `${alertPosition.y}px`,
                        left: `${alertPosition.x}px`,
                        transform: 'translate(-50%, -120%)'
                    }}
                >
                    <div className="flex items-center gap-2 p-2">
                        <Mail className="w-5 h-5 text-red-700" />
                        <AlertDescription className="text-black font-medium">
                            {alertMessage}
                        </AlertDescription>
                    </div>
                </Alert>
            )}

            <div className="flex flex-col h-full">
                {/* Sticky Header Section */}
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
                                <h1 className="text-3xl font-bold text-center text-red-700">Audio/Video Team</h1>
                                <div className="flex items-center justify-center mt-2">
                                    <YearSelector 
                                        selectedYear={selectedYear}
                                        setSelectedYear={setSelectedYear}
                                        availableYears={availableYears}
                                        teamColor="#DC2626"
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
                                <h1 className="text-xl font-bold text-red-700">Audio/Video Team</h1>
                                <div className="flex items-center justify-center mt-2">
                                    <YearSelector 
                                        selectedYear={selectedYear}
                                        setSelectedYear={setSelectedYear}
                                        availableYears={availableYears}
                                        teamColor="#DC2626"
                                        textSize="text-lg"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    {/* Simplified header with just Manage Users button */}
                    <div className="p-4 border-b border-gray-200 flex justify-end">
                        <button
                            onClick={() => setShowUserManagement(true)}
                            className="px-3 py-2 rounded border border-red-700 text-red-700 hover:bg-red-50"
                        >
                            Manage Users
                        </button>
                    </div>
                </div>

                {/* Scrollable Content Section */}
                <div className="flex-1 overflow-hidden">
                    <CardContent className="h-full p-0">
                        {(isLoading || datesLoading) ? (
                            <LoadingSpinner 
                                message={datesLoading ? `Loading ${selectedYear} services...` : "Loading A/V Team schedule..."} 
                                color="red-700" 
                            />
                        ) : dates.length === 0 ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="text-center">
                                    <p className="text-gray-600 text-lg mb-2">No services found for {selectedYear}</p>
                                    <p className="text-gray-500 text-sm">Services may not be generated yet.</p>
                                </div>
                            </div>
                        ) : (
                        <div className="h-full">{/* Desktop Table View */}
                            <div className="hidden md:block h-full">
                                <div className="relative h-full">
                                    <div className="overflow-y-auto h-full">
                                        <table className="w-full">
                                            <thead className="sticky top-0 z-10">
                                                <tr className="bg-[#FFEBEB]">
                                                    <th style={{ width: '110px' }} className="p-2 text-center font-bold text-red-700">Date</th>
                                                    <th style={{ width: '120px' }} className="p-2 text-center font-bold text-red-700">Day</th>
                                                    <th style={{ width: '35%' }} className="p-2 text-left font-bold text-red-700">Service</th>
                                                    <th style={{ width: '16%' }} className="p-2 text-center font-bold text-red-700">Team Member 1</th>
                                                    <th style={{ width: '16%' }} className="p-2 text-center font-bold text-red-700">Team Member 2</th>
                                                    <th style={{ width: '16%' }} className="p-2 text-center font-bold text-red-700">Team Member 3</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {dates.map((item, index) => (
                                                    <tr 
                                                        key={item.date} 
                                                        ref={el => dateRefs.current[item.date] = el}
                                                        style={{ scrollMarginTop: '60px' }}
                                                        className={index % 2 === 0 ? 'bg-gray-50' : ''}
                                                    >
                                                        <td style={{ width: '110px' }} className="p-2 border-r border-gray-300 text-center">{item.date}</td>
                                                        <td style={{ width: '120px' }} className="p-2 border-r border-gray-300 text-center">{item.day}</td>
                                                        <td style={{ width: '35%' }} className="p-2 border-r border-gray-300">{item.title}</td>
                                                        <td style={{ width: '16%' }} className="p-2 border-r border-gray-300">
                                                            <div className={`p-2 rounded bg-red-700 ${isPastDate(item.date) ? 'opacity-50' : 'bg-opacity-20'} flex justify-between items-center`}>
                                                                <span className="flex-1 text-center pr-2">{assignments[item.date]?.team_member_1 || 'Ben'}</span>
                                                                <button
                                                                    onClick={(e) => {
                                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                                        setAlertPosition({
                                                                            x: rect.left + (rect.width / 2),
                                                                            y: rect.top
                                                                        });
                                                                        setEditingPosition({
                                                                            date: item.date,
                                                                            position: 1,
                                                                            currentMember: assignments[item.date]?.team_member_1 || 'Ben'
                                                                        });
                                                                    }}
                                                                    className="text-red-500 hover:text-red-700 flex-shrink-0">
                                                                    <Edit2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td style={{ width: '16%' }} className="p-2 border-r border-gray-300">
                                                            <div className={`p-2 rounded bg-red-700 ${isPastDate(item.date) ? 'opacity-50' : 'bg-opacity-20'} flex justify-between items-center`}>
                                                                <span className="flex-1 text-center pr-2">{assignments[item.date]?.team_member_2 || getRotationMember(index)}</span>
                                                                <button
                                                                    onClick={(e) => {
                                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                                        setAlertPosition({
                                                                            x: rect.left + (rect.width / 2),
                                                                            y: rect.top
                                                                        });
                                                                        setEditingPosition({
                                                                            date: item.date,
                                                                            position: 2,
                                                                            currentMember: assignments[item.date]?.team_member_2 || getRotationMember(index)
                                                                        });
                                                                    }}
                                                                    className="text-red-500 hover:text-red-700 flex-shrink-0"
                                                                >
                                                                    <Edit2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>

                                                        {/* Team Member 3 */}
                                                        <td style={{ width: '16%' }} className="p-2">
                                                            {assignments[item.date]?.team_member_3 ? (
                                                                <div className={`p-2 rounded bg-red-700 ${isPastDate(item.date) ? 'opacity-50' : 'bg-opacity-20'} flex justify-between items-center`}>
                                                                    <span className="flex-1 text-center pr-2">{assignments[item.date].team_member_3}</span>
                                                                    <button
                                                                        onClick={() => handleRemoveAssignment(item.date)}
                                                                        className="text-red-500 hover:text-red-700 flex-shrink-0"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={(e) => {
                                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                                        setAlertPosition({
                                                                            x: rect.left + (rect.width / 2),
                                                                            y: rect.top
                                                                        });
                                                                        setEditingPosition({
                                                                            date: item.date,
                                                                            position: 3
                                                                        });
                                                                    }}
                                                                    className={`w-full p-2 border rounded text-red-700 border-red-700 hover:bg-red-50 ${isPastDate(item.date) ? 'opacity-50' : ''
                                                                        }`}
                                                                >
                                                                    Sign Up
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Mobile View */}
                            {isMobile && (
                                <div className="p-4 overflow-y-auto h-full">
                                    {dates.map((item, index) => (
                                        <div key={item.date} ref={el => dateRefs.current[item.date] = el} style={{ scrollMarginTop: '20px' }}>
                                            <MobileAVTeamCard
                                                item={item}
                                            index={index}
                                            assignments={assignments}
                                            rotationMembers={rotationMembers}
                                            isPastDate={isPastDate}
                                            onSignup={(date) => {
                                                setEditingPosition({
                                                    date,
                                                    position: 3
                                                });
                                            }}
                                            onRemoveAssignment={handleRemoveAssignment}
                                            onEditMember={(date, position, currentMember) => {
                                                setEditingPosition({
                                                    date,
                                                    position,
                                                    currentMember
                                                });
                                            }}
                                            showAlertWithTimeout={showAlertWithTimeout}
                                            setAlertPosition={setAlertPosition}
                                        />
                                        </div>
                                    ))}
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
                    <div className="bg-white p-6 rounded-lg w-96">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-red-700">Manage Users</h2>
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
                                className="w-full px-3 py-2 rounded border border-red-700 text-red-700 hover:bg-red-50"
                            >
                                + Add New User
                            </button>
                            <div className="space-y-2">
                                {availableUsers.map(user => (
                                    <div key={user.name} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                                        <span className="text-gray-900">{user.name}</span>
                                        <button
                                            onClick={async () => {
                                                const confirmed = await confirm({
                                                    title: 'Remove User',
                                                    message: `Remove ${user.name} from the A/V team?`,
                                                    details: ['This will permanently delete them from the users list'],
                                                    variant: 'danger',
                                                    confirmText: 'Remove',
                                                    cancelText: 'Cancel'
                                                });
                                                
                                                if (confirmed) {
                                                    try {
                                                        await apiDelete(API_ENDPOINTS.AV_USERS, {
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ name: user.name })
                                                        });
                                                        
                                                        setAvailableUsers(prev => prev.filter(u => u.name !== user.name));
                                                        handleSuccess('User removed successfully');
                                                    } catch (error) {
                                                        console.error('Error removing user:', error);
                                                        handleError(error, 'Error removing user');
                                                    }
                                                }
                                            }}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* User Selection Modal */}
            <UserSelectionModal
                showModal={editingPosition !== null}
                onClose={() => setEditingPosition(null)}
                availableUsers={availableUsers}
                initialUserName={editingPosition?.currentMember}
                onSelect={handleUserSelect}
                onDelete={handleDeleteFromModal}
                title={editingPosition?.position === 3 ? 
                    "Sign Up for Service" : 
                    `Edit Team Member ${editingPosition?.position}`}
                showDeleteButton={editingPosition?.position === 3 && !!editingPosition?.currentMember}
                // Add these two new props:
                currentAssignments={editingPosition?.date ? assignments[editingPosition.date] || {} : {}}
                currentPosition={editingPosition?.position}
            />
            
            <AddUserModal
                isOpen={showAddUserModal}
                onClose={() => setShowAddUserModal(false)}
                onSubmit={handleAddUserSubmit}
                teamColor="#DC2626"
                teamName="A/V"
            />
            
            {/* Confirmation Dialog */}
            <ConfirmDialog />
        </Card>
    );
};

export default AVTeam;