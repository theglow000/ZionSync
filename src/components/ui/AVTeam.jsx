import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, UserCircle, X, Trash2, Edit2 } from 'lucide-react';
import MobileAVTeamCard from './MobileAVTeamCard';
import useResponsive from '../../hooks/useResponsive';
import UserSelectionModal from './UserSelectionModal';

const AVTeam = () => {
    const [assignments, setAssignments] = useState({});
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [showUserManagement, setShowUserManagement] = useState(false);
    const [usersToDelete, setUsersToDelete] = useState([]);
    const [alertPosition, setAlertPosition] = useState({ x: 0, y: 0 });
    // Track which position is being edited
    const [editingPosition, setEditingPosition] = useState(null); // { date, position, currentMember }

    // Add useResponsive hook
    const { isMobile } = useResponsive();

    // Update rotation members list: replace Laila with Justin
    const rotationMembers = ['Doug', 'Jaimes', 'Justin', 'Brett'];
    
    // In AVTeam.jsx, update the initializeUsers function
    useEffect(() => {
        const initializeUsers = async () => {
            try {
                // First fetch existing users
                const response = await fetch('/api/av-users');
                if (!response.ok) {
                    throw new Error('Failed to fetch AV users');
                }

                const existingUsers = await response.json();
                const currentUsers = Array.isArray(existingUsers) ? existingUsers : [];

                // List of required team members - update to include Justin, keep Laila
                const initialMembers = ['Ben', 'Doug', 'Jaimes', 'Laila', 'Brett', 'Justin'];

                // Add any missing members
                for (const member of initialMembers) {
                    if (!currentUsers.some(user => user.name === member)) {
                        const addResponse = await fetch('/api/av-users', {
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
                const finalResponse = await fetch('/api/av-users');
                if (!finalResponse.ok) {
                    throw new Error('Failed to fetch final AV users list');
                }

                const finalUsers = await finalResponse.json();
                setAvailableUsers(Array.isArray(finalUsers) ? finalUsers : []);
                setIsLoading(false);

            } catch (error) {
                console.error('Error initializing users:', error);
                setIsLoading(false);
                setAlertMessage('Error loading users. Please try again.');
                setShowAlert(true);
            }
        };

        initializeUsers();
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

    const getRotationMember = (index) => {
        return rotationMembers[index % rotationMembers.length];
    };

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch assignments
                const assignmentsResponse = await fetch('/api/av-team');
                const assignmentsData = await assignmentsResponse.json();
                if (assignmentsResponse.ok) {
                    setAssignments(assignmentsData.assignments.reduce((acc, curr) => {
                        acc[curr.date] = {
                            team_member_1: curr.team_member_1,
                            team_member_2: curr.team_member_2,
                            team_member_3: curr.team_member_3
                        };
                        return acc;
                    }, {}));
                }

                // Fetch users
                const usersResponse = await fetch('/api/av-users');
                if (usersResponse.ok) {
                    const usersData = await usersResponse.json();
                    // Add initial team members if they don't exist
                    const initialMembers = ['Ben', 'Doug', 'Jaimes', 'Laila', 'Brett', 'Justin'];
                    const newUsers = [...usersData];
                    initialMembers.forEach(member => {
                        if (!newUsers.find(user => user.name === member)) {
                            newUsers.push({ name: member });
                        }
                    });
                    setAvailableUsers(newUsers);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // Handle user signup
    const handleSignup = async (date, position = 3, userName) => {
        try {
            const response = await fetch('/api/av-team', {
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

            setAlertMessage('Successfully signed up!');
            setShowAlert(true);
            setTimeout(() => setShowAlert(false), 3000);
        } catch (error) {
            console.error('Error signing up:', error);
            setAlertMessage('Error saving signup. Please try again.');
            setShowAlert(true);
            setTimeout(() => setShowAlert(false), 3000);
        }
    };

    // Handle removing assignment
    const handleRemoveAssignment = async (date) => {
        try {
            const response = await fetch('/api/av-team', {
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

            setAlertMessage('Assignment removed successfully');
            setShowAlert(true);
            setTimeout(() => setShowAlert(false), 3000);
        } catch (error) {
            console.error('Error removing assignment:', error);
            setAlertMessage('Error removing assignment. Please try again.');
            setShowAlert(true);
            setTimeout(() => setShowAlert(false), 3000);
        }
    };

    // User management handlers
    const handleAddUser = async () => {
        const name = prompt('Enter new user name:');
        if (name) {
            try {
                await fetch('/api/av-users', {
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
    };

    const handleAssignment = async (date, position, name) => {
        try {
            const response = await fetch('/api/av-team', {
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

            setAssignments(prev => ({
                ...prev,
                [date]: {
                    ...prev[date],
                    [`team_member_${position}`]: name
                }
            }));

            setAlertMessage('Assignment updated successfully');
            setShowAlert(true);
            setTimeout(() => setShowAlert(false), 3000);
        } catch (error) {
            console.error('Error updating assignment:', error);
            setAlertMessage('Error updating assignment. Please try again.');
            setShowAlert(true);
            setTimeout(() => setShowAlert(false), 3000);
        }
    };

    const isPastDate = (dateStr) => {
        const [month, day, year] = dateStr.split('/').map(Number);
        const dateToCheck = new Date(2000 + year, month - 1, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return dateToCheck < today;
    };

    // Handle user selection from modal
    const handleUserSelect = (userName) => {
        if (!editingPosition) return;
        
        const { date, position } = editingPosition;
        
        if (position === 3) {
            handleSignup(date, position, userName);
        } else {
            handleAssignment(date, position, userName);
        }
        
        // Close the modal
        setEditingPosition(null);
    };

    // Update this function to only handle position 3
    const handleDeleteFromModal = () => {
        if (!editingPosition || editingPosition.position !== 3) return;
        
        const { date } = editingPosition;
        handleRemoveAssignment(date);
        
        // Close the modal
        setEditingPosition(null);
    };

    return (
        <Card className="w-full h-full mx-auto relative bg-white shadow-lg">
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
                                <h1 className="text-xl font-bold text-red-700">Audio/Video Team</h1>
                                <p className="text-lg font-bold text-gray-600">2025 Service Schedule</p>
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
                        <div className="h-full">
                            {/* Desktop Table View */}
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
                                                    <tr key={item.date} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
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
                                        <MobileAVTeamCard
                                            key={item.date}
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
                                            setAlertMessage={setAlertMessage}
                                            setShowAlert={setShowAlert}
                                            setAlertPosition={setAlertPosition}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
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
                                            onClick={() => {
                                                if (user.name === currentUser?.name) {
                                                    setCurrentUser(null);
                                                }
                                                setAvailableUsers(prev => prev.filter(u => u.name !== user.name));
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
        </Card>
    );
};

export default AVTeam;