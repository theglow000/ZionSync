import React from 'react';
import { getMusicalGuidance, getPracticalTips } from '../../data/liturgical-themes.js';

const SeasonalTips = ({ seasonId }) => {
  // Get data for the specified season
  const musicalGuidance = getMusicalGuidance(seasonId);
  const practicalTips = getPracticalTips(seasonId);
  
  if (!musicalGuidance || !practicalTips) {
    return <div>No guidance available for this season</div>;
  }
  
  return (
    <div className="seasonal-tips p-4 bg-white rounded shadow">
      <h3 className="text-lg font-medium mb-3">Worship Planning Tips</h3>
      
      {/* Musical Atmosphere */}
      <div className="mb-4">
        <h4 className="text-md font-medium mb-2">Musical Atmosphere</h4>
        <p className="italic text-gray-700 mb-2">"{musicalGuidance.atmosphere}"</p>
        
        <h5 className="text-sm font-medium text-gray-700 mb-1">Musical Elements to Emphasize:</h5>
        <ul className="list-disc pl-5 text-sm mb-3">
          {musicalGuidance.keyElements.map((element, i) => (
            <li key={i} className="mb-1 text-gray-600">{element}</li>
          ))}
        </ul>
      </div>
      
      {/* Important Caution */}
      <div className="bg-amber-50 p-3 rounded border border-amber-200 mb-4">
        <h4 className="text-sm font-medium text-amber-800 mb-1">Planning Caution</h4>
        <p className="text-sm text-amber-700">{musicalGuidance.caution}</p>
      </div>
      
      {/* Practical Tips */}
      <div>
        <h4 className="text-md font-medium mb-2">Practical Implementation</h4>
        <ul className="list-disc pl-5 text-sm">
          {practicalTips.map((tip, i) => (
            <li key={i} className="mb-2 text-gray-600">{tip}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SeasonalTips;