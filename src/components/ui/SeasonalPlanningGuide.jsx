import React, { useState, useEffect } from 'react';
import { LITURGICAL_THEMES, getSeasonThemes, getMusicalGuidance, getPracticalTips } from '../../data/liturgical-themes.js';
import { getCurrentSeason, getNextLiturgicalSeason, getSeasonDateRange, getSeasonProgressPercentage } from '../../lib/LiturgicalCalendarService.js';
import { ChevronDown, Music, Calendar, Tag, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';
import { format } from 'date-fns';

// Add this color mapping function at the top of the file, after imports
const getSeasonColor = (seasonId) => {
  // Use the standardized liturgical colors from the ReferenceSongPanel
  const seasonColors = {
    'ADVENT': '#4b0082',      // Purple/Indigo
    'CHRISTMAS': '#b8860b',   // Darkgoldenrod (instead of white for better visibility)
    'EPIPHANY': '#006400',    // Dark Green
    'LENT': '#800080',        // Purple
    'HOLY_WEEK': '#8b0000',   // Dark Red
    'TRIDUUM': '#8b0000',     // Dark Red (same as Holy Week)
    'EASTER': '#ffd700',      // Gold
    'PENTECOST': '#FF4500',   // Red
    'ORDINARY_TIME': '#008000' // Green
  };
  
  return seasonColors[seasonId] || seasonColors['ORDINARY_TIME'];
};

// Select Dropdown Component with improved positioning
const SelectDropdown = ({ value, onChange, options, currentSeasonId }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const selected = options.find(opt => opt.id === value) || options[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleDropdown}
        className="flex items-center justify-between w-[180px] h-9 text-sm border rounded-md px-3 py-2 bg-white shadow-sm hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center">
          {selected && (
            <>
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: selected.color }}
              ></div>
              <span className="truncate">{selected.name}</span>
            </>
          )}
        </div>
        <ChevronDown className="h-4 w-4 ml-2 text-gray-500" />
      </button>

      {isOpen && (
        <div 
          className="fixed z-50 mt-1 w-[220px] max-h-[400px] overflow-y-auto bg-white border rounded-md shadow-lg"
          style={{
            top: 'auto',
            right: 'auto',
            left: window.innerWidth <= 768 ? '50%' : 'auto',
            transform: window.innerWidth <= 768 ? 'translateX(-50%)' : 'none'
          }}
        >
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option.id}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors"
                onClick={() => handleSelect(option.id)}
              >
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: getSeasonColor(option.id) }}
                  ></div>
                  <span>{option.name}</span>
                  {option.id === value && (
                    <CheckIcon className="h-4 w-4 ml-2 text-green-500" />
                  )}
                  {option.id === currentSeasonId && (
                    <span className="ml-2 text-xs text-gray-500">(Current)</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const CheckIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const SeasonalPlanningGuide = () => {
  const [currentSeasonId, setCurrentSeasonId] = useState('ORDINARY_TIME');
  const [selectedSeasonId, setSelectedSeasonId] = useState('ORDINARY_TIME'); // Initialize with a default value instead of null
  const [nextSeasonId, setNextSeasonId] = useState(null);
  const [seasonProgress, setSeasonProgress] = useState({
    percentage: 0,
    daysRemaining: 0,
    daysElapsed: 0,
    totalDays: 0,
    startDate: null,
    endDate: null
  });

  useEffect(() => {
    const today = new Date();
    const season = getCurrentSeason(today);
    setCurrentSeasonId(season);
    setSelectedSeasonId(season); // Still set it to match current season on init
  }, []);

  const activeSeasonId = selectedSeasonId || currentSeasonId;
  const seasonData = LITURGICAL_THEMES[activeSeasonId] || LITURGICAL_THEMES.ORDINARY_TIME;
  const themeData = getSeasonThemes(activeSeasonId);
  const musicalData = getMusicalGuidance(activeSeasonId);
  const practicalTips = getPracticalTips(activeSeasonId);

  useEffect(() => {
    const today = new Date();
    // Get next season for current season (for "next season" alert)
    if (currentSeasonId) {
      try {
        const nextSeason = getNextLiturgicalSeason(currentSeasonId);
        setNextSeasonId(nextSeason);
      } catch (error) {
        console.error("Error getting next liturgical season:", error);
      }
    }
    
    // Calculate dates for whichever season is actively selected
    const seasonToDisplay = selectedSeasonId || currentSeasonId;
    try {
      const { startDate, endDate } = getSeasonDateRange(seasonToDisplay, today);
      if (startDate && endDate) {
        const msPerDay = 1000 * 60 * 60 * 24;
        const totalDays = Math.round((endDate.getTime() - startDate.getTime()) / msPerDay);
        const daysElapsed = Math.max(0, Math.round((today.getTime() - startDate.getTime()) / msPerDay));
        const daysRemaining = Math.max(0, Math.round((endDate.getTime() - today.getTime()) / msPerDay));
        const progress = getSeasonProgressPercentage(seasonToDisplay, today);
        setSeasonProgress({
          percentage: progress,
          daysRemaining,
          daysElapsed,
          totalDays,
          startDate,
          endDate
        });
      }
    } catch (error) {
      console.error("Error calculating season progress:", error);
    }
  }, [currentSeasonId, selectedSeasonId]);

  const handleSeasonChange = (value) => {
    setSelectedSeasonId(value);
  };

  const seasonOptions = Object.entries(LITURGICAL_THEMES)
    .map(([id, season]) => ({
      id,
      name: season.name,
      color: season.color
    }))
    .filter(season => season.id !== 'UNKNOWN' && season.id !== 'PENTECOST')
    .sort((a, b) => {
      // Put current season first
      if (a.id === currentSeasonId) return -1;
      if (b.id === currentSeasonId) return 1;
      
      // For remaining seasons, follow liturgical calendar order from current season forward
      const liturgicalOrder = [
        'ADVENT', 'CHRISTMAS', 'EPIPHANY', 
        'LENT', 'HOLY_WEEK', 'TRIDUUM', 'EASTER', 
        'ORDINARY_TIME'
      ];
      
      // Find index of current season
      const currentIndex = liturgicalOrder.indexOf(currentSeasonId);
      
      // Get relative position from current season (considering circular nature)
      const getRelativePosition = (seasonId) => {
        const seasonIndex = liturgicalOrder.indexOf(seasonId);
        // If season comes after current in the cycle
        if (seasonIndex > currentIndex) {
          return seasonIndex - currentIndex;
        }
        // If season comes before current in the cycle (wrap around)
        return liturgicalOrder.length + seasonIndex - currentIndex;
      };
      
      // Compare based on relative position from current season
      return getRelativePosition(a.id) - getRelativePosition(b.id);
    });

  return (
    <div className="seasonal-planning-guide max-w-5xl mx-auto">
      {/* Condensed non-current season notice with reduced padding */}
      {activeSeasonId !== currentSeasonId && (
        <div className="bg-blue-50 text-blue-700 border border-blue-200 rounded-md px-3 py-1 mb-3 text-xs flex justify-between items-center">
          <span className="flex items-center">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Viewing <strong className="mx-1">{seasonData.name}</strong> season
          </span>
          <Button
            onClick={() => handleSeasonChange(currentSeasonId)}
            variant="link"
            className="text-blue-600 p-0 h-auto text-xs font-medium"
          >
            Back to current
          </Button>
        </div>
      )}

      {/* Improved Header with season selector and description */}
      <div 
        className="rounded-lg overflow-hidden mb-6 shadow-md"
      >
        <div
          className="px-6 py-4"
          style={{
            backgroundColor: `${getSeasonColor(activeSeasonId)}20`,
            borderTop: `6px solid ${getSeasonColor(activeSeasonId)}`
          }}
        >
          <div className="flex justify-between items-start">
            <div className="max-w-3xl">
              <h1 className="text-2xl font-bold flex items-center">
                <span>{seasonData.name}</span>
                {activeSeasonId === currentSeasonId && (
                  <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-800">Current Season</span>
                )}
              </h1>

              {seasonProgress.startDate && (
                <div className="text-sm text-gray-600 mt-1 font-medium">
                  {format(seasonProgress.startDate, 'MMM d')} – {format(seasonProgress.endDate, 'MMM d, yyyy')}
                </div>
              )}
              
              {/* Integrated season description */}
              <p className="text-sm text-gray-700 mt-3 leading-relaxed">
                {seasonData.description}
              </p>
            </div>

            <div>
              <SelectDropdown
                value={activeSeasonId}
                onChange={handleSeasonChange}
                options={seasonOptions}
                currentSeasonId={currentSeasonId}
              />
            </div>
          </div>
        </div>

        {/* Next season alert - only for current season */}
        {activeSeasonId === currentSeasonId && nextSeasonId && (
          <div
            className="px-6 py-3 border-t flex items-center justify-between"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
          >
            <div className="flex items-center">
              <div className="flex items-center mr-3">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: getSeasonColor(nextSeasonId) }}
                ></div>
                <span className="font-medium text-sm">{LITURGICAL_THEMES[nextSeasonId]?.name}</span>
              </div>

              <span className="text-sm text-gray-600">
                begins in <span className="font-medium">{seasonProgress.daysRemaining}</span> days
              </span>
            </div>

            <Button
              onClick={() => handleSeasonChange(nextSeasonId)}
              variant="outline"
              className="text-xs font-medium h-8 px-3 bg-white border-gray-300 hover:bg-gray-50"
            >
              Preview
            </Button>
          </div>
        )}
      </div>

      {/* Season focus - 3 essential cards in one row with enhanced visual distinction */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border-l-4 border-blue-500 shadow-md rounded-md p-4 hover:shadow-lg transition-shadow">
          <h4 className="font-semibold text-sm flex items-center mb-2 text-blue-700">
            <Tag className="h-4 w-4 mr-2" />
            <span>Primary Focus</span>
          </h4>
          <p className="text-sm leading-relaxed text-gray-800">
            {themeData?.primaryThemes[0] || "No primary theme defined"}
          </p>
        </div>

        <div className="bg-white border-l-4 border-purple-500 shadow-md rounded-md p-4 hover:shadow-lg transition-shadow">
          <h4 className="font-semibold text-sm flex items-center mb-2 text-purple-700">
            <Music className="h-4 w-4 mr-2" />
            <span>Musical Character</span>
          </h4>
          <p className="text-sm leading-relaxed text-gray-800 italic">
            "{musicalData?.atmosphere || "No musical character defined"}"
          </p>
        </div>

        <div className="bg-white border-l-4 border-amber-500 shadow-md rounded-md p-4 hover:shadow-lg transition-shadow">
          <h4 className="font-semibold text-sm flex items-center mb-2 text-amber-700">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <span>Planning Caution</span>
          </h4>
          <p className="text-sm leading-relaxed text-gray-800">
            {musicalData?.caution || "No special cautions for this season"}
          </p>
        </div>
      </div>

      {/* Main planning guides - two columns side by side with improved styling */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Left column - Music Planning Guidance */}
        <div className="bg-white rounded-md shadow-md h-full border border-gray-100">
          <div className="bg-purple-50 border-b border-purple-100 px-4 py-3">
            <h3 className="font-semibold text-purple-800 flex items-center text-base">
              <Music className="h-4 w-4 mr-2" />
              <span>Music Planning Guidance</span>
            </h3>
          </div>
          
          <div className="p-4">
            <h4 className="text-xs font-semibold uppercase text-gray-500 mb-3">Key Elements to Include</h4>
            <ul className="space-y-2 mb-6">
              {musicalData?.keyElements.map((element, i) => (
                <li key={i} className="text-sm flex items-start">
                  <span className="text-purple-600 mr-2 mt-0.5 text-lg">•</span>
                  <span className="text-gray-800 leading-relaxed">{element}</span>
                </li>
              ))}
            </ul>

            <h4 className="text-xs font-semibold uppercase text-gray-500 mb-3">Practical Implementation</h4>
            <ul className="space-y-2">
              {practicalTips?.map((tip, i) => (
                <li key={i} className="text-sm flex items-start">
                  <span className="text-gray-400 mr-2 mt-0.5 text-lg">•</span>
                  <span className="text-gray-700 leading-relaxed">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right column - Theological Themes */}
        <div className="bg-white rounded-md shadow-md h-full border border-gray-100">
          <div className="bg-blue-50 border-b border-blue-100 px-4 py-3">
            <h3 className="font-semibold text-blue-800 flex items-center text-base">
              <Tag className="h-4 w-4 mr-2" />
              <span>Theological Themes</span>
            </h3>
          </div>
          
          <div className="p-4">
            <h4 className="text-xs font-semibold uppercase text-gray-500 mb-3">Primary Themes</h4>
            <ul className="space-y-2 mb-6">
              {themeData?.primaryThemes.map((theme, i) => (
                <li key={i} className="text-sm flex items-start">
                  <span className="text-blue-600 mr-2 mt-0.5 text-lg">•</span>
                  <span className="text-gray-800 leading-relaxed">{theme}</span>
                </li>
              ))}
            </ul>

            <h4 className="text-xs font-semibold uppercase text-gray-500 mb-3">Secondary Themes</h4>
            <ul className="space-y-2 mb-6">
              {themeData?.secondaryThemes.map((theme, i) => (
                <li key={i} className="text-sm flex items-start">
                  <span className="text-gray-400 mr-2 mt-0.5 text-lg">•</span>
                  <span className="text-gray-700 leading-relaxed">{theme}</span>
                </li>
              ))}
            </ul>

            {themeData?.scriptureThemes?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase text-gray-500 mb-3">Key Scripture References</h4>
                <div className="grid grid-cols-3 gap-2">
                  {themeData?.scriptureThemes.map((item, i) => (
                    <div key={i} className="text-sm bg-gray-50 px-2 py-1 rounded border border-gray-100 text-center">
                      {item.reference}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Improved progress bar with better visual presentation */}
      {activeSeasonId === currentSeasonId && seasonProgress.startDate && (
        <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              <span className="font-medium">Season Progress: <span className="text-blue-600">{Math.round(seasonProgress.percentage)}%</span></span>
            </div>
            <div className="bg-gray-100 px-3 py-1 rounded-full text-xs font-medium">
              {seasonProgress.daysRemaining} days remaining ({seasonProgress.daysElapsed} elapsed)
            </div>
          </div>

          <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
            <div
              className="h-full rounded-full transition-all duration-500 ease-in-out"
              style={{
                width: `${seasonProgress.percentage}%`,
                backgroundColor: getSeasonColor(seasonData.id || activeSeasonId)
              }}
            ></div>
          </div>
          
          <div className="flex justify-between text-xs mt-2 text-gray-500">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full mr-1 bg-gray-400"></div>
              <span>Start: {format(seasonProgress.startDate, 'MMM d')}</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: seasonData.color }}></div>
              <span>End: {format(seasonProgress.endDate, 'MMM d')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeasonalPlanningGuide;