import React from 'react';
import { ChevronDown, ChevronUp, Music2, UserCircle, BookOpen } from 'lucide-react';
import ServiceSongSelector from './ServiceSongSelector';

const MobileWorshipServiceCard = ({
  date,
  title,
  day,
  serviceDetails,
  assignments,
  currentUser,
  onToggleExpand,
  expanded,
  onEditTeam,
  customServices,
  availableSongs,
  setServiceDetails
}) => {
  // Determine service type display
  const serviceType = serviceDetails?.type === 'communion' ? 'Communion' :
                     serviceDetails?.type === 'communion_potluck' ? 'Communion with Potluck' :
                     serviceDetails?.type === 'no_communion' ? 'No Communion' :
                     customServices?.find(s => s.id === serviceDetails?.type)?.name || 'Not Set';

  // Check if all songs are selected
  const hasSongs = serviceDetails?.elements?.some(element => 
    element.type === 'song_hymn' && element.selection?.title
  );

  // Get readings to display in mobile view
  const getReadingSections = () => {
    if (!serviceDetails?.elements) return [];

    return serviceDetails.elements
      .filter(element =>
        element.type === 'reading' ||
        element.type === 'message' ||
        (element.type === 'liturgy' &&
          (element.content?.toLowerCase().includes('reading:') ||
            element.content?.toLowerCase().includes('sermon:') ||
            element.content?.toLowerCase().includes('gospel:')))
      )
      .map((element) => {
        const isSermon = element.type === 'message' ||
          (element.content && element.content.toLowerCase().includes('sermon:'));

        let label = '';
        let content = element.content || '';

        // Split only on first colon
        const colonIndex = content.indexOf(':');
        if (colonIndex !== -1) {
          label = content.substring(0, colonIndex).trim();
          content = content.substring(colonIndex + 1).trim();
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

  const readings = getReadingSections();

  return (
    <div className="mb-4 rounded-lg overflow-hidden shadow-md bg-white">
      {/* Card Header - Always visible */}
      <div 
        className="flex items-center p-4 cursor-pointer"
        onClick={() => onToggleExpand(date)}
      >
        {/* Service Info Column */}
        <div className="flex-1 min-w-0">
          {/* Date and Title - Full width for title */}
          <div className="flex items-center gap-2">
            <span className="text-base font-medium text-gray-700 w-[60px] flex-shrink-0">
              {date}
            </span>
            <span className="font-medium text-black truncate">
              {title}
            </span>
          </div>
          
          {/* Second line with items justified to opposite sides */}
          <div className="flex items-center justify-between mt-1">
            {/* Left side: Day and Service Type */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {day}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                {serviceType}
              </span>
            </div>
            
            {/* Right side: Music icon and Team Badge */}
            <div className="flex items-center gap-2">
              {/* Music icon */}
              {hasSongs && (
                <div className="w-5 h-5 rounded-full bg-purple-50 flex items-center justify-center">
                  <Music2 className="w-3 h-3 text-purple-700" />
                </div>
              )}
              
              {/* Team Badge - clickable, no pencil icon */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onEditTeam) onEditTeam(date);
                }}
                className="flex items-center gap-1 text-xs text-purple-700 bg-purple-100/30 px-2 py-0.5 rounded hover:bg-purple-100/50"
              >
                <UserCircle className="w-3 h-3 text-purple-700" />
                <span>
                  {assignments[date]?.team || 'No team'}
                </span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Right side - Only expand/collapse icon */}
        <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </div>
      </div>
      
      {/* Expanded Content - Reduce padding */}
      {expanded && (
        <div className="border-t border-gray-200 p-2">
          {/* Song Selection Interface - Pass mobile flag */}
          <ServiceSongSelector
            date={date}
            currentUser={currentUser}
            serviceDetails={serviceDetails}
            setServiceDetails={setServiceDetails}
            expanded={true}
            onToggleExpand={() => {}} // No-op since we're using our own expansion
            team={assignments[date]?.team}
            onEditTeam={() => onEditTeam(date)}
            customServices={customServices}
            availableSongs={availableSongs}
            isMobile={true} // Flag to indicate mobile rendering
          />
        </div>
      )}
    </div>
  );
};

export default MobileWorshipServiceCard;
