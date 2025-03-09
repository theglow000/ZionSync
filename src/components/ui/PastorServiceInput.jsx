import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { ChevronDown, X, Edit2, Trash2 } from 'lucide-react';
import AddCustomService from './AddCustomService';
import useResponsive from '../../hooks/useResponsive';

// Helper functions
const getSundayInfo = (dateStr) => {
  const [month, day] = dateStr.split('/');
  const fullDate = new Date(2025, month - 1, parseInt(day));
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const firstDay = new Date(fullDate.getFullYear(), fullDate.getMonth(), 1);
  const firstSunday = 1 + (7 - firstDay.getDay()) % 7;
  const sundayNumber = Math.ceil((fullDate.getDate() - firstSunday + 1) / 7);
  const isSunday = fullDate.getDay() === 0;

  const nthDay = (n) => {
    if (n > 3 && n < 21) return 'th';
    switch (n % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  return {
    sundayNumber,
    isSunday,
    formattedDate: `${months[fullDate.getMonth()]} ${day}${nthDay(parseInt(day))}, 2025`,
    sundayInfo: `${sundayNumber}${nthDay(sundayNumber)} Sunday of the Month`
  };
};

// Update the parseServiceContent function to be more specific with song detection
const parseServiceContent = (content) => {
  return content.split('\n').map(line => {
    let type = 'liturgy';
    const lowerLine = line.toLowerCase().trim();
    
    // Song/Hymn detection - expanded matching
    if (
      lowerLine.includes('hymn:') ||
      lowerLine.includes('hymn of the day') ||
      lowerLine.includes('opening hymn') ||
      lowerLine.includes('sending song') ||
      lowerLine.includes('anthem:') ||
      lowerLine.includes('song:')
    ) {
      type = 'song_hymn';
    }
    // Reading detection
    else if (
      lowerLine.includes('reading:') ||
      lowerLine.includes('lesson:') ||
      lowerLine.includes('psalm:') ||
      lowerLine.includes('gospel:')
    ) {
      type = 'reading';
    }
    // Message/Sermon detection
    else if (
      lowerLine.includes('sermon:') ||
      lowerLine.includes('message:') ||
      lowerLine.includes('children')
    ) {
      type = 'message';
    }
    // Liturgical song detection
    else if (
      lowerLine.includes('kyrie') ||
      lowerLine.includes('alleluia') ||
      lowerLine.includes('create in me') ||
      lowerLine.includes('lamb of god') ||
      lowerLine.includes('this is the feast') ||
      lowerLine.includes('glory to god') ||
      lowerLine.includes('change my heart')
    ) {
      type = 'liturgical_song';
    }

    return {
      type,
      content: line,
      selection: null,
      required: type !== 'liturgy'
    };
  });
};

const getDefaultServiceType = (dateStr) => {
  const { sundayNumber, isSunday } = getSundayInfo(dateStr);
  if (!isSunday) return 'no_communion';
  if (sundayNumber === 3) return 'communion_potluck';
  if (sundayNumber === 1) return 'communion';
  return 'no_communion';
};

const getLordsPrayerFormat = (dateStr) => {
  const { sundayNumber } = getSundayInfo(dateStr);
  return sundayNumber === 1 ? 'The Lord\'s Prayer-Sung' : 'The Lord\'s Prayer';
};

const mainServiceTypes = [
  { id: 'no_communion', name: 'No Communion' },
  { id: 'communion', name: 'Communion' },
  { id: 'communion_potluck', name: 'Communion with Potluck' }
];

const getStandardServiceElements = (date) => ({
  no_communion: [
    { content: 'Prelude & Lighting of Candles', type: 'liturgy' },
    { content: 'Welcome & Announcements', type: 'liturgy' },
    { content: 'Opening Hymn:', type: 'song_hymn' },
    { content: 'Confession and Forgiveness (pg. 94-96)', type: 'liturgy' },
    { content: 'Greeting', type: 'liturgy' },
    { content: 'Kyrie & Hymn of Praise', type: 'liturgical_song' },
    { content: 'Prayer of the Day', type: 'liturgy' },
    { content: "Children's Message", type: 'message' },
    { content: 'First Reading:', type: 'reading' },
    { content: 'Psalm Reading:', type: 'reading' },
    { content: 'Second Reading:', type: 'reading' },
    { content: 'Gospel Acclamation - Alleluia (pg. 102)', type: 'liturgical_song' },
    { content: 'Gospel Reading:', type: 'reading' },
    { content: 'Sermon:', type: 'message' },
    { content: 'Hymn of the Day:', type: 'song_hymn' },
    { content: "The Apostle's Creed", type: 'liturgy' },
    { content: 'Prayers of the Church', type: 'liturgy' },
    { content: 'Sharing of the Peace', type: 'liturgy' },
    { content: 'Offering & Offertory - "Create In Me" (#186)', type: 'liturgical_song' },
    { content: 'Offering Prayer', type: 'liturgy' },
    { content: 'Blessing', type: 'liturgy' },
    { content: 'Sending Song:', type: 'song_hymn' },
    { content: 'Dismissal', type: 'liturgy' },
    { content: 'Postlude', type: 'liturgy' }
  ],
  
  communion: [
    { content: 'Prelude & Lighting of Candles', type: 'liturgy' },
    { content: 'Welcome & Announcements', type: 'liturgy' },
    { content: 'Opening Hymn:', type: 'song_hymn' },
    { content: 'Confession and Forgiveness (pg. 94-96)', type: 'liturgy' },
    { content: 'Greeting', type: 'liturgy' },
    { content: 'Kyrie & Hymn of Praise', type: 'liturgical_song' },
    { content: 'Prayer of the Day', type: 'liturgy' },
    { content: "Children's Message", type: 'message' },
    { content: 'First Reading:', type: 'reading' },
    { content: 'Psalm Reading:', type: 'reading' },
    { content: 'Second Reading:', type: 'reading' },
    { content: 'Gospel Acclamation - Alleluia (pg. 102)', type: 'liturgical_song' },
    { content: 'Gospel Reading:', type: 'reading' },
    { content: 'Sermon:', type: 'message' },
    { content: 'Hymn of the Day:', type: 'song_hymn' },
    { content: "The Apostle's Creed", type: 'liturgy' },
    { content: 'Prayers of the Church', type: 'liturgy' },
    { content: 'Sharing of the Peace', type: 'liturgy' },
    { content: 'Offering & Offertory -"Create In Me" (#186)', type: 'liturgical_song' },
    { content: 'Offering Prayer', type: 'liturgy' },
    { content: 'Words of Institution', type: 'liturgy' },
    { content: getLordsPrayerFormat(date), type: 'liturgical_song' },
    { content: 'Communion Preparation Hymn - "Change My Heart O God" (#801 Cranberry)', type: 'liturgical_song' },
    { content: 'Distribution of Communion', type: 'liturgy' },
    { content: 'Blessing', type: 'liturgy' },
    { content: 'Sending Song:', type: 'song_hymn' },
    { content: 'Dismissal', type: 'liturgy' },
    { content: 'Postlude', type: 'liturgy' }
  ],

  communion_potluck: [
    { content: 'Prelude & Lighting of Candles', type: 'liturgy' },
    { content: 'Welcome & Announcements', type: 'liturgy' },
    { content: 'Opening Hymn:', type: 'song_hymn' },
    { content: 'Confession and Forgiveness (pg. 94-96)', type: 'liturgy' },
    { content: 'Greeting', type: 'liturgy' },
    { content: 'Kyrie & Hymn of Praise', type: 'liturgical_song' },
    { content: 'Prayer of the Day', type: 'liturgy' },
    { content: "Children's Message", type: 'message' },
    { content: 'First Reading:', type: 'reading' },
    { content: 'Psalm Reading:', type: 'reading' },
    { content: 'Second Reading:', type: 'reading' },
    { content: 'Gospel Acclamation - Alleluia (pg. 102)', type: 'liturgical_song' },
    { content: 'Gospel Reading:', type: 'reading' },
    { content: 'Sermon:', type: 'message' },
    { content: 'Hymn of the Day:', type: 'song_hymn' },
    { content: "The Apostle's Creed", type: 'liturgy' },
    { content: 'Prayers of the Church', type: 'liturgy' },
    { content: 'Sharing of the Peace', type: 'liturgy' },
    { content: 'Offering & Offertory -"Create In Me" (#186)', type: 'liturgical_song' },
    { content: 'Offering Prayer', type: 'liturgy' },
    { content: 'Words of Institution', type: 'liturgy' },
    { content: getLordsPrayerFormat(date), type: 'liturgical_song' },
    { content: 'Communion Preparation Hymn - "Change My Heart O God" (#801 Cranberry)', type: 'liturgical_song' },
    { content: 'Distribution of Communion', type: 'liturgy' },
    { content: 'Blessing', type: 'liturgy' },
    { content: 'Sending Song:', type: 'song_hymn' },
    { content: 'Table Prayer', type: 'liturgy' },
    { content: 'Dismissal', type: 'liturgy' },
    { content: 'Postlude', type: 'liturgy' }
  ]
});

const determineElementType = (line) => {
  const lowerLine = line.toLowerCase().trim();
  
  // Song/Hymn detection
  if (lowerLine.includes('hymn:') || 
      lowerLine.includes('hymn of the day') ||
      lowerLine.includes('opening hymn') ||
      lowerLine.includes('sending song') ||
      lowerLine.includes('anthem:') ||
      lowerLine.includes('song:')) {
    return 'song_hymn';
  }
  
  // Reading detection
  if (lowerLine.includes('reading:') ||
      lowerLine.includes('lesson:') ||
      lowerLine.includes('psalm:') ||
      lowerLine.includes('gospel:')) {
    return 'reading';
  }
  
  // Message/Sermon detection
  if (lowerLine.includes('sermon:') ||
      lowerLine.includes('message:') ||
      lowerLine.includes('children')) {
    return 'message';
  }
  
  // Liturgical song detection
  if (lowerLine.includes('kyrie') ||
      lowerLine.includes('alleluia') ||
      lowerLine.includes('create in me') ||
      lowerLine.includes('lamb of god') ||
      lowerLine.includes('this is the feast') ||
      lowerLine.includes('glory to god') ||
      lowerLine.includes('change my heart')) {
    return 'liturgical_song';
  }
  
  // Default to liturgy
  return 'liturgy';
};

const PastorServiceInput = ({ date, onClose, onSave, serviceDetails }) => {
  // Add the responsive hook
  const { isMobile } = useResponsive();
  
  // State management
  const [selectedType, setSelectedType] = useState(() => getDefaultServiceType(date));
  const [showCustomDropdown, setShowCustomDropdown] = useState(false);
  const [orderOfWorship, setOrderOfWorship] = useState('');
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [customServices, setCustomServices] = useState([]);
  const [hasExistingContent, setHasExistingContent] = useState(false);
  const [isCustomService, setIsCustomService] = useState(false);

  // Add this at the start of the component
  const standardServiceElements = getStandardServiceElements(date);

  // Service Templates
  const getServiceTemplates = () => ({
    no_communion: `Prelude & Lighting of Candles
Welcome & Announcements
Opening Hymn: 
Confession and Forgiveness (pg. 94-96)
Greeting
Kyrie & Hymn of Praise
Prayer of the Day
Children's Message
First Reading: 
Psalm Reading:
Second Reading: 
Gospel Acclamation - Alleluia (pg. 102)
Gospel Reading: 
Sermon: 
Hymn of the Day: 
The Apostle's Creed
Prayers of the Church
Sharing of the Peace
Offering & Offertory - "Create In Me" (#186)
Offering Prayer
Blessing
Sending Song: 
Dismissal
Postlude`,

    communion: `Prelude & Lighting of Candles
Welcome & Announcements
Opening Hymn: 
Confession and Forgiveness (pg. 94-96)
Greeting
Kyrie & Hymn of Praise
Prayer of the Day
Children's Message
First Reading: 
Psalm Reading:
Second Reading: 
Gospel Acclamation - Alleluia (pg. 102)
Gospel Reading: 
Sermon: 
Hymn of the Day: 
The Apostle's Creed
Prayers of the Church
Sharing of the Peace
Offering & Offertory -"Create In Me" (#186)
Offering Prayer
Words of Institution
${getLordsPrayerFormat(date)}
Communion Preparation Hymn - "Change My Heart O God" (#801 Cranberry)
Distribution of Communion
Blessing
Sending Song: 
Dismissal
Postlude`,

    communion_potluck: `Prelude & Lighting of Candles
Welcome & Announcements
Opening Hymn: 
Confession and Forgiveness (pg. 94-96)
Greeting
Kyrie & Hymn of Praise
Prayer of the Day
Children's Message
First Reading: 
Psalm Reading:
Second Reading: 
Gospel Acclamation - Alleluia (pg. 102)
Gospel Reading: 
Sermon: 
Hymn of the Day: 
The Apostle's Creed
Prayers of the Church
Sharing of the Peace
Offering & Offertory -"Create In Me" (#186)
Offering Prayer
Words of Institution
${getLordsPrayerFormat(date)}
Communion Preparation Hymn - "Change My Heart O God" (#801 Cranberry)
Distribution of Communion
Blessing
Sending Song: 
Table Prayer
Dismissal
Postlude`
  });

  // Fetch custom services
  useEffect(() => {
    const fetchCustomServices = async () => {
      try {
        const response = await fetch('/api/custom-services');
        if (response.ok) {
          const data = await response.json();
          console.log('Custom services data:', data);
          setCustomServices(data);
        }
      } catch (error) {
        console.error('Error fetching custom services:', error);
      }
    };

    fetchCustomServices();
  }, []);

  // Effects
  useEffect(() => {
    const fetchExistingContent = async () => {
      try {
        const response = await fetch(`/api/service-details?date=${date}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.content) {
            // Only update if we have existing content
            setOrderOfWorship(data.content);
            setSelectedType(data.type || getDefaultServiceType(date));
            setHasExistingContent(true);
            const isCustom = customServices.some(s => s.id === data.type);
            setIsCustomService(isCustom);
          } else if (!hasExistingContent) {
            // Only set default if we don't have any content
            const defaultType = getDefaultServiceType(date);
            setSelectedType(defaultType);
            setOrderOfWorship(getServiceTemplates()[defaultType]);
            setIsCustomService(false);
          }
        }
      } catch (error) {
        console.error('Error fetching existing content:', error);
      }
    };

    // Only fetch if we don't have a custom service selected
    if (!isCustomService) {
      fetchExistingContent();
    }
  }, [date, customServices]);

  // Add a cleanup effect when the component unmounts
  useEffect(() => {
    return () => {
      // Reset states when component unmounts
      setSelectedType(getDefaultServiceType(date));
      setIsCustomService(false);
      setOrderOfWorship('');
      setHasExistingContent(false);
    };
  }, []);

  // Add this effect to persist custom service selection
  useEffect(() => {
    if (isCustomService && selectedType) {
      const customService = customServices.find(s => s.id === selectedType);
      if (customService) {
        setOrderOfWorship(customService.order || customService.template);
        setHasExistingContent(false);
      }
    }
  }, [isCustomService, selectedType, customServices]);

  // Add this near your other useEffects
  useEffect(() => {
    console.log('State changed:', {
      selectedType,
      isCustomService,
      orderOfWorship: orderOfWorship?.substring(0, 50) + '...',
      hasExistingContent
    });
  }, [selectedType, isCustomService, orderOfWorship, hasExistingContent]);

  // Update the handleServiceTypeChange to preserve selections when possible
  const handleServiceTypeChange = (typeId) => {
    if (!hasExistingContent || window.confirm('Changing service type will reset the order of worship. Continue?')) {
      const elements = standardServiceElements[typeId];
      const content = elements.map(el => el.content).join('\n');
      
      setSelectedType(typeId);
      setIsCustomService(false);
      setOrderOfWorship(content);
      setHasExistingContent(false);
    }
  };

  // Add this effect to prevent unwanted state resets
  useEffect(() => {
    if (isCustomService && selectedType && orderOfWorship) {
      // Prevent the default service type from overriding custom service
      return;
    }
    // ... rest of your existing fetchExistingContent effect
  }, [date, customServices]);

  // Replace the custom service selection handler
  const handleCustomServiceSelection = (service) => {
    if (!hasExistingContent || window.confirm('Changing service type will reset the order of worship. Continue?')) {
      setSelectedType(service.id);
      setIsCustomService(true);
      // Use order to preserve selections, fall back to template for new services
      setOrderOfWorship(service.order || service.template);
      setShowCustomDropdown(false);
    }
  };

  // Replace the existing custom service effect
  useEffect(() => {
    if (isCustomService && selectedType && !hasExistingContent) {
      const customService = customServices.find(s => s.id === selectedType);
      if (customService) {
        setOrderOfWorship(customService.order || customService.template);
      }
    }
  }, [isCustomService, selectedType, customServices, hasExistingContent]);

  // 2. Update the save button handler
  const handleSave = () => {
    if (orderOfWorship) {
      const currentLines = orderOfWorship.split('\n').map(line => line.trim()).filter(Boolean);
      let elements = [];
      
      if (isCustomService) {
        const customService = customServices.find(s => s.id === selectedType);
        
        elements = currentLines.map(line => {
          const templateElement = customService.elements.find(el => 
            line.startsWith(el.content.split(' - ')[0])
          );

          const existingElement = serviceDetails?.[date]?.elements?.find(
            e => e.content.split(' - ')[0].trim() === line.split(' - ')[0].trim()
          );

          return {
            ...(templateElement || { type: determineElementType(line) }),
            content: line,
            selection: existingElement?.selection || null
          };
        });
      } else {
        // Similar approach for standard services
        elements = currentLines.map(line => {
          const standardElement = standardServiceElements[selectedType].find(el => 
            line.startsWith(el.content.split(' - ')[0])
          );

          const existingElement = serviceDetails?.[date]?.elements?.find(
            e => e.content.split(' - ')[0].trim() === line.split(' - ')[0].trim()
          );

          return {
            ...(standardElement || { type: determineElementType(line) }),
            content: line,
            selection: existingElement?.selection || null
          };
        });
      }

      onSave({
        type: selectedType,
        content: orderOfWorship,
        elements: elements
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[200]">
      <Card className={`w-full ${isMobile ? 'max-w-full max-h-[calc(100vh-56px)]' : 'max-w-2xl max-h-[90vh]'} bg-white shadow-xl flex flex-col ${isMobile ? 'rounded-none' : 'rounded-lg'}`}
           style={isMobile ? { marginBottom: "56px" } : {}}>
        {/* Header - Adjusted for mobile */}
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-[#6B8E23]`}>
                {getSundayInfo(date).formattedDate}
              </h2>
              <p className={`${isMobile ? 'text-base' : 'text-lg'} text-[#6B8E23]`}>
                {getSundayInfo(date).sundayInfo}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-[#6B8E23] hover:bg-[#6B8E23] hover:bg-opacity-20 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content - Adjusted for mobile scrolling */}
        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          {/* Liturgical Setting - Hidden on mobile to save space */}
          {!isMobile && (
            <div className="flex justify-end items-start">
              <div className="text-right text-sm text-gray-600 bg-[#FFD700] bg-opacity-10 p-3 rounded">
                <h4 className="font-medium text-[#6B8E23] mb-1">Standard Schedule:</h4>
                <p>1st Sunday: Communion & Sing Lord's Prayer</p>
                <p>3rd Sunday: Communion with Potluck</p>
              </div>
            </div>
          )}

          {/* Service Type Selection - Adjusted grid for mobile */}
          <div>
            <h3 className="text-base font-bold text-[#6B8E23] mb-2">Service Type</h3>
            <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-3'} gap-3 mb-4`}>
              {mainServiceTypes.map(type => (
                <label
                  key={type.id}
                  className={`flex items-center p-2 border rounded cursor-pointer ${selectedType === type.id && !isCustomService
                    ? 'bg-[#6B8E23] text-white'
                    : 'text-black hover:bg-[#FFD700] hover:bg-opacity-20'
                    }`}
                >
                  <input
                    type="radio"
                    name="serviceType"
                    checked={selectedType === type.id && !isCustomService}
                    onChange={() => handleServiceTypeChange(type.id)}
                    className="w-4 h-4 mr-2"
                  />
                  {type.name}
                </label>
              ))}
            </div>

            {/* Custom Service Selection */}
            <h3 className="text-base font-bold text-[#6B8E23] mb-2">Or Select Custom Service</h3>
            <div className="relative">
              <button
                onClick={() => setShowCustomDropdown(!showCustomDropdown)}
                className={`w-full p-2 border rounded text-left flex items-center justify-between ${isCustomService
                  ? 'bg-[#6B8E23] bg-opacity-20 border-[#6B8E23]'
                  : 'text-black hover:bg-[#FFD700] hover:bg-opacity-20'
                  }`}
              >
                <span className={isCustomService ? 'text-[#6B8E23] font-medium' : ''}>
                  {isCustomService
                    ? customServices.find(s => s.id === selectedType)?.name
                    : 'Select custom service...'}
                </span>
                <ChevronDown className={`w-5 h-5 ${isCustomService ? 'text-[#6B8E23]' : ''}`} />
              </button>

              {showCustomDropdown && (
                <div className={`absolute top-full left-0 right-0 mt-1 bg-white border rounded shadow-lg z-10 ${isMobile ? 'max-h-48 overflow-y-auto' : ''}`}>
                  {customServices.map(service => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between p-2 hover:bg-[#FFD700] hover:bg-opacity-20"
                    >
                      <button
                        onClick={() => handleCustomServiceSelection(service)}
                        className="flex-1 text-left text-black font-normal"
                      >
                        {service.name}
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingService(service);
                            setShowAddCustom(true);
                            setShowCustomDropdown(false);
                          }}
                          className="p-1 hover:bg-[#6B8E23] hover:bg-opacity-20 rounded"
                        >
                          <Edit2 className="w-4 h-4 text-[#6B8E23]" />
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (confirm(`Delete ${service.name}?`)) {
                              try {
                                await fetch('/api/custom-services', {
                                  method: 'DELETE',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ id: service.id })
                                });
                                setCustomServices(prev => prev.filter(s => s.id !== service.id));
                                if (selectedType === service.id) {
                                  setSelectedType('no_communion');
                                  setIsCustomService(false);
                                  setOrderOfWorship(getServiceTemplates().no_communion);
                                }
                                setShowCustomDropdown(false);
                              } catch (error) {
                                console.error('Error deleting custom service:', error);
                                alert('Error deleting custom service. Please try again.');
                              }
                            }
                          }}
                          className="p-1 hover:bg-red-100 rounded"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    className="w-full p-2 text-[#6B8E23] text-left border-t hover:bg-[#FFD700] hover:bg-opacity-20"
                    onClick={() => {
                      setEditingService(null);
                      setShowAddCustom(true);
                      setShowCustomDropdown(false);
                    }}
                  >
                    + Add New Custom Service
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Order of Worship Editor - Adjusted height for mobile */}
          <div>
            <h3 className="text-base font-bold text-[#6B8E23] mb-2">Order of Worship</h3>
            <div className="text-sm text-gray-600 mb-2">
              Note: Song selections must be made in the Worship Team tab
            </div>
            <textarea
              value={orderOfWorship}
              onChange={(e) => setOrderOfWorship(e.target.value)}
              className={`w-full ${
                isMobile ? 'h-[calc(100vh-450px)]' : 'h-[calc(100vh-500px)]'
              } min-h-[150px] p-3 border rounded font-mono text-sm resize-none text-black hover:border-[#6B8E23] focus:border-[#6B8E23] focus:ring-1 focus:ring-[#6B8E23]`}
              style={{ fontSize: isMobile ? '14px' : '16px' }}
            />
          </div>
        </div>
        
        {/* Footer */}
        <div className={`p-4 border-t bg-[#FFD700] bg-opacity-10 flex justify-end gap-3 ${isMobile ? 'safe-area-bottom' : ''}`}>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-[#6B8E23] text-[#6B8E23] rounded hover:bg-[#6B8E23] hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-[#6B8E23] text-white rounded hover:bg-[#556B2F]"
          >
            Save Service Details
          </button>
        </div>
      </Card>

      {/* Custom Service Modal */}
      {showAddCustom && (
        <AddCustomService
          existingService={editingService}
          onClose={() => {
            setShowAddCustom(false);
            setEditingService(null);
          }}
          setSelectedType={setSelectedType}
          setIsCustomService={setIsCustomService}
          setOrderOfWorship={setOrderOfWorship}
          setHasExistingContent={setHasExistingContent}
          setCustomServices={setCustomServices}
          onSave={async (serviceData) => {
            try {
              console.log('Saving custom service:', serviceData);
              const method = editingService ? 'PUT' : 'POST';
              const response = await fetch('/api/custom-services', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(serviceData),
              });

              if (response.ok) {
                const savedService = await response.json();
                console.log('Service saved successfully:', savedService);

                // First update the custom services list
                const updatedServices = await fetch('/api/custom-services').then(res => res.json());
                setCustomServices(updatedServices);

                // Then batch the state updates to prevent race conditions
                Promise.resolve().then(() => {
                  // Set custom service flag first
                  setIsCustomService(true);
                  // Then update the type and content
                  setSelectedType(serviceData.id);
                  setOrderOfWorship(serviceData.order);
                  setHasExistingContent(false);
                  // Finally close the modal
                  setShowAddCustom(false);
                  setEditingService(null);
                });

                return true;
              }
              return false;
            } catch (error) {
              console.error('Error saving custom service:', error);
              return false;
            }
          }}
        />
      )}
    </div>
  );
};

export default PastorServiceInput;