'use client';

// Update the import to include Cross
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Check, Calendar, BookOpen, MessageSquare, Music, Music2, Cross, Trash2, UserCircle, CheckCircle, Pencil } from 'lucide-react';
import UserSelectionModal from './UserSelectionModal';

const MobileServiceCard = ({ 
  item,
  signups,
  completed,
  selectedDates,
  serviceDetails,
  availableUsers,
  checkForSelectedSongs,
  checkForOrderOfWorship,
  setSelectedDates,
  onExpand,
  onAssignUser,
  onRemoveAssignment,
  onComplete,
  onSelectDate,
  onServiceDetailChange,
  setAlertMessage,
  setShowAlert,
  setAlertPosition,
  customServices,
  onEditService,
  onDeleteService
}) => {
  // Remove currentUser prop if it's not being used anymore
  const [expanded, setExpanded] = useState(false);
  const [showUserSelection, setShowUserSelection] = useState(false);
  
  // Extract properties from item
  const { date, title, day } = item;
  const isCompleted = completed[date];
  
  // Check if there's a user assigned to this date
  const assignedUser = signups[date];

  // Check if this date is selected for calendar
  const isDateSelected = selectedDates.includes(date);

  // Check for order of worship and songs
  const hasOrderOfWorship = checkForOrderOfWorship ? checkForOrderOfWorship(date) : false;
  const hasSongs = checkForSelectedSongs ? checkForSelectedSongs(date) : false;

  const handleExpandToggle = () => {
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    if (onExpand) {
      onExpand(date);
    }
  };

  // Handle user assignment
  const handleAssign = (userName) => {
    if (onAssignUser) {
      onAssignUser(date, userName);
    }
  };

  // Handle removing assignment
  const handleRemoveAssignment = () => {
    if (onRemoveAssignment) {
      onRemoveAssignment(date);
    }
  };

  // Handle completing service
  const handleCompleted = (e) => {
    e.stopPropagation(); // Prevent card expansion
    if (onComplete) {
      onComplete(date);
    }
  };

  // Handle calendar selection
  const handleCalendarSelection = (e) => {
    e.stopPropagation(); // Prevent card expansion
    if (onSelectDate) {
      onSelectDate(date);
    }
  };

  // Handle pastor edit button click
  const handlePastorEdit = (e) => {
    e.stopPropagation(); // Prevent card expansion
    if (onEditService) {
      onEditService(date);
    }
  };

  // Handle delete service button click
  const handleDeleteService = async (e) => {
    e.stopPropagation(); // Prevent card expansion
    
    // Confirm before deletion
    if (window.confirm('Are you sure you want to delete this service\'s details?')) {
      if (onDeleteService) {
        onDeleteService(date);
      }
    }
  };

  // Show the user selection modal
  const openUserSelection = (e) => {
    if (e) e.stopPropagation(); // Prevent card expansion
    setShowUserSelection(true);
  };

  // Add this helper function near the top of the file
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
    <div className={`
      mb-4 rounded-lg overflow-hidden shadow-md
      ${isCompleted ? 'bg-gray-100' : 'bg-white'}
    `}>
      {/* User Selection Modal */}
      <UserSelectionModal 
        showModal={showUserSelection}
        onClose={() => setShowUserSelection(false)}
        availableUsers={availableUsers}
        initialUserName={assignedUser}
        onSelect={handleAssign}
        onDelete={handleRemoveAssignment}
        title={assignedUser ? "Reassign Service" : "Assign User"}
      />

      {/* Card Header - Always visible */}
      <div 
        className="flex items-center p-4 cursor-pointer"
        onClick={handleExpandToggle}
      >
        {/* Service Info Column */}
        <div className="flex-1 min-w-0">
          {/* Date and Title */}
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-700 mr-2 w-[60px] flex-shrink-0">
              {date}
            </span>
            <span className="font-medium text-black truncate">
              {title}
            </span>
          </div>
          
          {/* Day and Assignment */}
          <div className="flex items-center mt-1">
            <span className="text-xs text-gray-500 w-[80px] flex-shrink-0">
              {day}
            </span>
            
            {assignedUser ? (
              <div className="flex items-center overflow-hidden max-w-[calc(100%-85px)]">
                <UserCircle className="w-3 h-3 text-[#6B8E23] mr-1 flex-shrink-0" />
                <span className="text-xs font-medium text-[#6B8E23] truncate">
                  {assignedUser}
                </span>
              </div>
            ) : (
              <span className="text-xs italic text-gray-400">Unassigned</span>
            )}
          </div>
        </div>
        
        {/* Status Indicators */}
        <div className="flex items-center ml-2">
          <div className="flex space-x-1 mr-3">
            {isCompleted && (
              <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
            )}
            {hasOrderOfWorship && (
              <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center">
                <BookOpen className="w-3 h-3 text-blue-600" />
              </div>
            )}
            {hasSongs && (
              <div className="w-5 h-5 rounded-full bg-purple-50 flex items-center justify-center">
                <Music2 className="w-3 h-3 text-purple-700" />
              </div>
            )}
          </div>
          
          {/* Expand/Collapse */}
          <div className="w-6 h-6 flex items-center justify-center">
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </div>
        </div>
      </div>
      
      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-gray-200">
          {/* Action Bar */}
          <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
            {/* User Assignment Section */}
            <div className="flex-1 flex items-center">
              {!assignedUser ? (
                <button
                  onClick={openUserSelection}
                  disabled={isCompleted}
                  className={`px-3 py-1 text-sm rounded-lg flex items-center ${isCompleted ? 
                    'bg-gray-300 text-gray-700' : 
                    'bg-[#6B8E23] text-white hover:bg-[#556B2F]'}`}
                >
                  <UserCircle className="w-4 h-4 mr-1" />
                  Assign User
                </button>
              ) : (
                <div className="flex items-center flex-1">
                  <div className="flex items-center">
                    <UserCircle className="w-4 h-4 text-[#6B8E23] mr-2" />
                    <span className="text-sm font-medium text-[#6B8E23] truncate mr-2">
                      {assignedUser}
                    </span>
                  </div>
                  <button
                    onClick={openUserSelection}
                    className="ml-2 p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                  >
                    <Pencil className="w-3 h-3 text-gray-600" />
                  </button>
                </div>
              )}
            </div>
            
            {/* Calendar Selection - Only show when assigned */}
            {assignedUser && (
              <div className="flex items-center mr-3 ml-2">
                <input
                  type="checkbox"
                  checked={isDateSelected}
                  onChange={handleCalendarSelection}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm text-black ml-1">Calendar</span>
              </div>
            )}
            
            {/* Completed Checkbox */}
            <div className="flex items-center ml-auto">
              <button
                onClick={handleCompleted}
                className={`w-6 h-6 rounded border ${isCompleted
                  ? 'bg-[#6B8E23] border-[#556B2F]'
                  : 'bg-white border-gray-300'
                } flex items-center justify-center`}
              >
                {isCompleted && <Check className="w-4 h-4 text-white" />}
              </button>
              <span className="text-sm text-black ml-1">Done</span>
            </div>
          </div>

          {/* Order of Worship Section */}
          <div className="p-3">
            {/* Service Type Header */}
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-medium text-[#6B8E23]">Order of Worship</h3>
              {serviceDetails[date]?.type && (
                <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-800 rounded">
                  {serviceDetails[date]?.type === 'communion' ? 'Communion' :
                   serviceDetails[date]?.type === 'no_communion' ? 'No Communion' :
                   serviceDetails[date]?.type === 'communion_potluck' ? 'Communion with Potluck' :
                   customServices?.find(s => s.id === serviceDetails[date]?.type)?.name || 'Not Set'}
                </span>
              )}
            </div>
            
            {/* Service Elements */}
            <div className="space-y-0">
              {serviceDetails[date]?.elements?.map((element, index) => (
                <div key={index} className="flex items-start gap-1 text-sm border-b border-gray-50 last:border-b-0 py-0.5">
                  <div className={`p-0.5 mt-0.5 rounded flex-shrink-0 ${element.type === 'song_hymn' ? 'bg-blue-50 text-blue-600' :
                    element.type === 'reading' ? 'bg-green-50 text-green-600' :
                    element.type === 'message' ? 'bg-purple-50 text-purple-600' :
                    element.type === 'liturgical_song' ? 'bg-amber-50 text-amber-600' :
                    'bg-gray-50 text-gray-600'}`}
                  >
                    {element.type === 'song_hymn' ? <Music className="w-3 h-3" /> :
                     element.type === 'reading' ? <BookOpen className="w-3 h-3" /> :
                     element.type === 'message' ? <MessageSquare className="w-3 h-3" /> :
                     element.type === 'liturgical_song' ? <Music2 className="w-3 h-3" /> :
                     <Cross className="w-3 h-3" />}
                  </div>
                  <div className="flex-1 min-w-0">
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
                      <span className="text-sm text-black inline">
                        {element.content?.includes(':') ? (
                          <>
                            <span className="font-bold">{element.content.split(':')[0]}</span>:
                            <span>{element.content.split(':').slice(1).join(':')}</span>
                          </>
                        ) : (
                          element.content
                        )}
                        {element.selection && (element.type === 'song_hymn' || element.type === 'song_contemporary') && (
                          <span className="text-blue-600 font-medium ml-1 text-xs inline">
                            {/* ...existing selection code... */}
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              
              {(!serviceDetails[date]?.elements || serviceDetails[date]?.elements.length === 0) && (
                <div className="text-black italic py-1 text-sm">
                  No service details available yet.
                </div>
              )}
            </div>
            
            {/* Bottom Action Buttons */}
            <div className="flex justify-between mt-3 pt-2 border-t border-gray-100">
              <button
                onClick={handlePastorEdit}
                className="px-2 py-1 text-xs text-[#6B8E23] border border-[#6B8E23] rounded hover:bg-[#6B8E23] hover:text-white"
              >
                Pastor Edit
              </button>
              
              <button
                onClick={handleDeleteService}
                className="px-2 py-1 text-xs text-red-600 border border-red-600 rounded hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileServiceCard;