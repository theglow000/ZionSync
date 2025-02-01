import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { ChevronDown, X, Edit2, Trash2 } from 'lucide-react';
import AddCustomService from './AddCustomService';

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

const PastorServiceInput = ({ date, onClose, onSave }) => {
  // State management
  const [selectedType, setSelectedType] = useState(() => getDefaultServiceType(date));
  const [showCustomDropdown, setShowCustomDropdown] = useState(false);
  const [orderOfWorship, setOrderOfWorship] = useState('');
  const [liturgicalSetting, setLiturgicalSetting] = useState('1');
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [customServices, setCustomServices] = useState([]);
  const [hasExistingContent, setHasExistingContent] = useState(false);

  // Effects
  useEffect(() => {
    const fetchExistingContent = async () => {
      try {
        const response = await fetch(`/api/service-details?date=${date}`);
        if (response.ok) {
          const data = await response.json();
          // Check if we have existing content for this date
          if (data && data.content) {
            setOrderOfWorship(data.content);
            setSelectedType(data.type || getDefaultServiceType(date));
            setLiturgicalSetting(data.setting || '1');
          } else {
            // Only set default template if there's no existing content
            const defaultType = getDefaultServiceType(date);
            setSelectedType(defaultType);
            const templates = liturgicalSetting === '1' ? setting1Templates : setting3Templates;
            setOrderOfWorship(templates[defaultType]);
          }
        }
      } catch (error) {
        console.error('Error fetching existing content:', error);
      }
    };

    fetchExistingContent();
  }, [date]);

  // Service Templates
  const setting1Templates = {
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
  };

  const setting3Templates = {
    no_communion: ``, // Add Setting 3 template when available
    communion: ``,    // Add Setting 3 template when available
    communion_potluck: `` // Add Setting 3 template when available
  };

  const mainServiceTypes = [
    { id: 'no_communion', name: 'No Communion' },
    { id: 'communion', name: 'Communion' },
    { id: 'communion_potluck', name: 'Communion with Potluck' }
  ];

  // Fetch custom services
  useEffect(() => {
    const fetchCustomServices = async () => {
      try {
        const response = await fetch('/api/custom-services');
        if (response.ok) {
          const data = await response.json();
          setCustomServices(data);
        }
      } catch (error) {
        console.error('Error fetching custom services:', error);
      }
    };

    fetchCustomServices();
  }, []);

  // Initial load and content fetch
  useEffect(() => {
    const fetchExistingContent = async () => {
      try {
        const response = await fetch(`/api/service-details?date=${date}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Fetched service details:', data); // Debug log

          if (data && data.content) {
            // We have existing content, use it
            setOrderOfWorship(data.content);
            setSelectedType(data.type || getDefaultServiceType(date));
            setLiturgicalSetting(data.setting || '1');
            setHasExistingContent(true);
          } else {
            // No existing content, use template
            const defaultType = getDefaultServiceType(date);
            setSelectedType(defaultType);
            setLiturgicalSetting('1'); // Default to Setting 1
            const templates = setting1Templates;
            setOrderOfWorship(templates[defaultType]);
            setHasExistingContent(false);
          }
        }
      } catch (error) {
        console.error('Error fetching existing content:', error);
        // On error, set default template
        const defaultType = getDefaultServiceType(date);
        setSelectedType(defaultType);
        setOrderOfWorship(setting1Templates[defaultType]);
        setHasExistingContent(false);
      }
    };

    fetchExistingContent();
  }, [date]); // Only re-run when date changes

  // Handle service type changes
  useEffect(() => {
    const handleServiceTypeChange = async () => {
      if (hasExistingContent) {
        const confirmed = window.confirm('Changing service type will reset the order of worship. Continue?');
        if (!confirmed) {
          // Revert to previous type if user cancels
          const response = await fetch(`/api/service-details?date=${date}`);
          if (response.ok) {
            const data = await response.json();
            if (data && data.type) {
              setSelectedType(data.type);
              return;
            }
          }
        }
      }

      // Apply new template
      const templates = liturgicalSetting === '1' ? setting1Templates : setting3Templates;
      if (templates[selectedType]) {
        setOrderOfWorship(templates[selectedType]);
        setHasExistingContent(false);
      } else {
        const customService = customServices.find(service => service.id === selectedType);
        if (customService) {
          setOrderOfWorship(customService.template);
          setHasExistingContent(false);
        }
      }
    };

    handleServiceTypeChange();
  }, [selectedType, liturgicalSetting]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl bg-white rounded-lg shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-[#6B8E23]">{getSundayInfo(date).formattedDate}</h2>
              <p className="text-lg text-[#6B8E23]">{getSundayInfo(date).sundayInfo}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-[#6B8E23] hover:bg-[#6B8E23] hover:bg-opacity-20 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          {/* Liturgical Setting */}
          <div>
            <label className="block text-sm font-medium text-[#6B8E23] mb-2">
              Liturgical Setting
            </label>
            <select
              value={liturgicalSetting}
              onChange={(e) => setLiturgicalSetting(e.target.value)}
              className="w-40 p-2 border rounded text-black"
            >
              <option value="1">Setting 1</option>
              <option value="3">Setting 3</option>
            </select>
          </div>

          {/* Service Type Selection */}
          <div>
            <h3 className="text-base font-bold text-[#6B8E23] mb-2">Select Service Type</h3>
            <div className="grid grid-cols-3 gap-3">
              {mainServiceTypes.map(type => (
                <label
                  key={type.id}
                  className={`flex items-center p-2 border rounded cursor-pointer ${selectedType === type.id
                      ? 'bg-[#6B8E23] text-white'
                      : 'text-black hover:bg-[#FFD700] hover:bg-opacity-20'
                    }`}
                >
                  <input
                    type="radio"
                    name="serviceType"
                    checked={selectedType === type.id}
                    onChange={() => {
                      if (!hasExistingContent || window.confirm('Changing service type will reset the order of worship. Continue?')) {
                        setSelectedType(type.id);
                        setHasExistingContent(false);
                      }
                    }}
                    className="w-4 h-4 mr-2"
                  />
                  {type.name}
                </label>
              ))}
            </div>
          </div>

          {/* Custom Service Selection */}
          <div>
            <h3 className="text-base font-bold text-[#6B8E23] mb-2">Or Select Custom Service</h3>
            <div className="relative">
              <button
                onClick={() => setShowCustomDropdown(!showCustomDropdown)}
                className="w-full p-2 border rounded text-left flex items-center justify-between text-black hover:bg-[#FFD700] hover:bg-opacity-20"
              >
                <span>Select custom service...</span>
                <ChevronDown className="w-5 h-5" />
              </button>

              {showCustomDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded shadow-lg z-10">
                  {customServices.map(service => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between p-2 hover:bg-[#FFD700] hover:bg-opacity-20"
                    >
                      <button
                        onClick={() => {
                          if (!hasExistingContent || window.confirm('Changing service type will reset the order of worship. Continue?')) {
                            setSelectedType(service.id);
                            setHasExistingContent(false);
                            setShowCustomDropdown(false);
                          }
                        }}
                        className="flex-1 text-left text-black"
                      >
                        {service.name}
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingService(service);
                            setShowAddCustom(true);
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
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({ id: service.id })
                                });
                                const response = await fetch('/api/custom-services');
                                const data = await response.json();
                                setCustomServices(data);
                              } catch (error) {
                                console.error('Error deleting custom service:', error);
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

          {/* Order of Worship Editor */}
          <div>
            <h3 className="text-base font-bold text-[#6B8E23] mb-2">Order of Worship</h3>
            <textarea
              value={orderOfWorship}
              onChange={(e) => setOrderOfWorship(e.target.value)}
              className="w-full h-[calc(100vh-500px)] min-h-[300px] p-3 border rounded font-mono text-sm resize-none text-black hover:border-[#6B8E23] focus:border-[#6B8E23] focus:ring-1 focus:ring-[#6B8E23]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-[#FFD700] bg-opacity-10 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-[#6B8E23] text-[#6B8E23] rounded hover:bg-[#6B8E23] hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (orderOfWorship) {
                onSave({
                  type: selectedType,
                  setting: liturgicalSetting,
                  content: orderOfWorship
                });
              }
            }}
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
          onSave={async (serviceData) => {
            try {
              const method = editingService ? 'PUT' : 'POST';
              await fetch('/api/custom-services', {
                method,
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(serviceData)
              });

              const response = await fetch('/api/custom-services');
              const data = await response.json();
              setCustomServices(data);

              setShowAddCustom(false);
              setEditingService(null);
            } catch (error) {
              console.error('Error saving custom service:', error);
            }
          }}
        />
      )}
    </div>
  );
};

export default PastorServiceInput;