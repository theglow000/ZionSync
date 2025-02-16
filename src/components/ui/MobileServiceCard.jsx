import React from 'react';
import { ChevronDown, ChevronUp, Check, Trash2, Music2 } from 'lucide-react';
import { Music, BookOpen, MessageSquare, Cross } from 'lucide-react';

const MobileServiceCard = ({
    item,
    checkForSelectedSongs,
    checkForOrderOfWorship,
    expanded,
    completed,
    signups,
    currentUser,
    selectedDates,
    serviceDetails,
    setSignups,
    setSignupDetails,
    setSelectedDates,
    alertPosition,
    setAlertPosition,
    setAlertMessage,
    setShowAlert,
    setShowPastorInput,
    setEditingDate,
    onExpand,
    onRemove,
    onComplete,
    onSelectDate,
}) => {
    return (
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-2">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="font-medium text-black">{item.title}</h3>
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
                        <div className="text-sm text-gray-600">{item.day}, {item.date}</div>
                    </div>
                    <div className="flex items-center gap-3">
                        {signups[item.date] === currentUser?.name && (
                            <div className="flex flex-col items-center">
                                <input
                                    type="checkbox"
                                    checked={selectedDates.includes(item.date)}
                                    onChange={() => onSelectDate(item.date)}
                                    className="w-4 h-4 rounded border-gray-300"
                                />
                                <span className="text-[10px] text-gray-900 text-center leading-tight">Add to{"\n"}calendar</span>
                            </div>
                        )}
                        <div className="flex flex-col items-center">
                            <button
                                onClick={() => onComplete(item.date)}
                                className={`w-4 h-4 rounded border ${completed[item.date]
                                    ? 'bg-[#6B8E23] border-[#556B2F]'
                                    : 'bg-white border-gray-300'
                                    } flex items-center justify-center`}
                            >
                                {completed[item.date] && <Check className="w-3 h-3 text-white" />}
                            </button>
                            <span className="text-[10px] text-gray-900">Complete</span>
                        </div>
                    </div>
                </div>

                {/* Signup Section */}
                <div className="flex items-center justify-between mb-2">
                    {signups[item.date] ? (
                        <div className="flex items-center justify-between w-full p-2 rounded bg-[#6B8E23] bg-opacity-20">
                            <span className="text-gray-900 font-medium">{signups[item.date]}</span>
                            {signups[item.date] === currentUser?.name && (
                                <button
                                    onClick={() => onRemove(item.date)}
                                    className="text-red-500 hover:text-red-700"
                                    title="Remove reservation"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ) : (
                        <button
                            onClick={(e) => {
                                if (!currentUser) {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setAlertPosition({
                                        x: rect.left + (rect.width / 2),
                                        y: rect.top
                                    });

                                    setAlertMessage('Please select a user first');
                                    setShowAlert(true);
                                    setTimeout(() => setShowAlert(false), 3000);
                                    const button = e.currentTarget;
                                    button.style.borderColor = '#EF4444';
                                    setTimeout(() => {
                                        button.style.borderColor = '';
                                    }, 1000);
                                    return;
                                }

                                try {
                                    fetch('/api/signups', {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({
                                            date: item.date,
                                            name: currentUser.name
                                        })
                                    }).then(response => {
                                        if (!response.ok) throw new Error('Failed to save signup');
                                        setSignups(prev => ({
                                            ...prev,
                                            [item.date]: currentUser.name
                                        }));
                                        setSignupDetails(prev => ({
                                            ...prev,
                                            [item.date]: {
                                                name: currentUser.name
                                            }
                                        }));

                                        const [itemMonth, itemDay, shortYear] = item.date.split('/').map(num => parseInt(num, 10));
                                        const itemYear = 2000 + shortYear;
                                        const itemDate = new Date(itemYear, itemMonth - 1, itemDay);
                                        const today = new Date('2025-01-14');
                                        today.setHours(0, 0, 0, 0);

                                        if (itemDate > today) {
                                            setSelectedDates(prev => [...prev, item.date]);
                                        }

                                        setAlertMessage('Successfully signed up!');
                                        setShowAlert(true);
                                        setTimeout(() => setShowAlert(false), 3000);
                                    });
                                } catch (error) {
                                    console.error('Error saving signup:', error);
                                    setAlertMessage('Error saving signup. Please try again.');
                                    setShowAlert(true);
                                    setTimeout(() => setShowAlert(false), 3000);
                                }
                            }}
                            className="w-full p-2 border rounded-md text-[#6B8E23] border-[#6B8E23] hover:bg-[#6B8E23] hover:text-white transition-colors duration-300"
                        >
                            Sign Up
                        </button>
                    )}
                </div>

                {/* Order of Worship Section */}
                <div>
                    <div className={`${expanded[item.date] ? 'sticky top-0 bg-white z-10 border-b pb-2' : ''}`}>
                        <button
                            onClick={() => onExpand(item.date)}
                            className="flex items-center gap-1 text-sm text-[#6B8E23] w-full justify-between px-2 py-1 rounded-md hover:bg-[#6B8E23] hover:bg-opacity-10"
                        >
                            <span>Order of Worship</span>
                            {expanded[item.date] ? (
                                <ChevronUp className="w-4 h-4" />
                            ) : (
                                <ChevronDown className="w-4 h-4" />
                            )}
                        </button>
                    </div>

                    {expanded[item.date] && (
                        <div className="mt-3 space-y-2">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-base font-bold text-[#6B8E23]">Order of Worship</h3>
                                <div className="flex gap-2">
                                    <button
                                        className="px-2 py-0.5 text-sm text-[#6B8E23] border border-[#6B8E23] rounded hover:bg-[#6B8E23] hover:text-white"
                                        onClick={() => {
                                            setEditingDate(item.date);
                                            setShowPastorInput(true);
                                        }}
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

                                                    if (!response.ok) {
                                                        throw new Error('Failed to delete service details');
                                                    }

                                                    // Update the local state by removing service details
                                                    setServiceDetails(prev => ({
                                                        ...prev,
                                                        [item.date]: {
                                                            ...prev[item.date],
                                                            elements: [],
                                                            content: null,
                                                            type: null
                                                        }
                                                    }));

                                                    setAlertMessage('Service details deleted successfully');
                                                    setShowAlert(true);
                                                    setTimeout(() => setShowAlert(false), 3000);
                                                } catch (error) {
                                                    console.error('Error deleting service details:', error);
                                                    setAlertMessage('Error deleting service details. Please try again.');
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

                            {/* Service Elements */}
                            {expanded[item.date] && serviceDetails[item.date]?.elements?.map((element, index) => (
                                <div key={index} className="flex items-center gap-1 text-sm leading-tight">
                                    <div className={`p-0.5 rounded ${element.type === 'hymn' ? 'bg-blue-50 text-blue-600' :
                                        element.type === 'reading' ? 'bg-green-50 text-green-600' :
                                            element.type === 'message' ? 'bg-purple-50 text-purple-600' :
                                                'bg-amber-50 text-amber-600'
                                        }`}>
                                        {element.type === 'hymn' ? <Music className="w-4 h-4" /> :
                                            element.type === 'reading' ? <BookOpen className="w-4 h-4" /> :
                                                element.type === 'message' ? <MessageSquare className="w-4 h-4" /> :
                                                    <Cross className="w-4 h-4" />}
                                    </div>
                                    <div className="flex-1 text-gray-900">
                                        {element.content}
                                    </div>
                                </div>
                            ))}

                            {/* Fallback for no elements */}
                            {expanded[item.date] && (!serviceDetails[item.date]?.elements ||
                                serviceDetails[item.date]?.elements.length === 0) && (
                                    <div className="text-gray-500 italic">
                                        No service details available yet.
                                        </div>
                                )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MobileServiceCard;