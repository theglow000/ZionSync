import React from 'react';
import { ChevronDown, ChevronUp, Check, Trash2 } from 'lucide-react';

const MobileServiceCard = ({
    item,
    expanded,
    completed,
    signups,
    currentUser,
    selectedDates,
    serviceDetails,
    onExpand,
    onSignup,
    onRemove,
    onComplete,
    onSelectDate,
    onServiceDetailChange
}) => {
    return (
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-2">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div>
                    <div className="font-medium text-gray-900">{item.title}</div>
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
                        onClick={() => onSignup(item.date)}
                        className="w-full p-2 border rounded-md text-[#6B8E23] border-[#6B8E23] hover:bg-[#6B8E23] hover:text-white transition-colors"
                    >
                        Sign Up
                    </button>
                )}
            </div>

            {/* Details Section */}
            <button
                onClick={() => onExpand(item.date)}
                className="flex items-center gap-1 text-sm text-[#6B8E23] w-full justify-between px-2 py-1 rounded-md hover:bg-[#6B8E23] hover:bg-opacity-10"
            >
                <span>Service Details</span>
                {expanded[item.date] ? (
                    <ChevronUp className="w-4 h-4" />
                ) : (
                    <ChevronDown className="w-4 h-4" />
                )}
            </button>

            {expanded[item.date] && (
                <div className="mt-3 space-y-3 text-gray-900">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-900">Sermon Title</label>
                        <input
                            type="text"
                            className="w-full p-2 border rounded text-gray-900"
                            value={serviceDetails[item.date]?.sermonTitle || ''}
                            onChange={(e) => onServiceDetailChange(item.date, 'sermonTitle', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-900">1st Reading</label>
                        <input
                            type="text"
                            className="w-full p-2 border rounded text-gray-900"
                            value={serviceDetails[item.date]?.firstReading || ''}
                            onChange={(e) => onServiceDetailChange(item.date, 'firstReading', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-900">Psalm Reading</label>
                        <input
                            type="text"
                            className="w-full p-2 border rounded text-gray-900"
                            value={serviceDetails[item.date]?.psalmReading || ''}
                            onChange={(e) => onServiceDetailChange(item.date, 'psalmReading', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-900">2nd Reading</label>
                        <input
                            type="text"
                            className="w-full p-2 border rounded text-gray-900"
                            value={serviceDetails[item.date]?.secondReading || ''}
                            onChange={(e) => onServiceDetailChange(item.date, 'secondReading', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-900">Gospel Reading</label>
                        <input
                            type="text"
                            className="w-full p-2 border rounded text-gray-900"
                            value={serviceDetails[item.date]?.gospelReading || ''}
                            onChange={(e) => onServiceDetailChange(item.date, 'gospelReading', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-900">Hymn #1</label>
                        <input
                            type="text"
                            className="w-full p-2 border rounded text-gray-900"
                            value={serviceDetails[item.date]?.hymnOne || ''}
                            onChange={(e) => onServiceDetailChange(item.date, 'hymnOne', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-900">Sermon Hymn</label>
                        <input
                            type="text"
                            className="w-full p-2 border rounded text-gray-900"
                            value={serviceDetails[item.date]?.sermonHymn || ''}
                            onChange={(e) => onServiceDetailChange(item.date, 'sermonHymn', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-900">Closing Hymn</label>
                        <input
                            type="text"
                            className="w-full p-2 border rounded text-gray-900"
                            value={serviceDetails[item.date]?.closingHymn || ''}
                            onChange={(e) => onServiceDetailChange(item.date, 'closingHymn', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-900">Notes</label>
                        <textarea
                            className="w-full p-2 border rounded text-gray-900"
                            rows="2"
                            value={serviceDetails[item.date]?.notes || ''}
                            onChange={(e) => onServiceDetailChange(item.date, 'notes', e.target.value)}
                            placeholder="Add any special instructions or notes..."
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default MobileServiceCard;