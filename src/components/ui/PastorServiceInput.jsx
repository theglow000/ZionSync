import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { ChevronDown, X, Edit2, Trash2, ArrowLeft, Save, FileText, Edit3 } from 'lucide-react';
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
const parseServiceContent = (content, existingElements = []) => {
  // If no content provided, return empty array
  if (!content) return [];
  
  // Create a map of existing elements for type lookup and ID preservation
  const existingElementMap = {};
  const existingContentMap = {};
  
  if (existingElements && existingElements.length) {
    existingElements.forEach(el => {
      if (el.content) {
        const key = el.content.toLowerCase().trim();
        existingElementMap[key] = el.type;
        existingContentMap[key] = el;
      }
    });
  }
  
  // Create a unique timestamp for this parsing session
  // This ensures unique IDs even when function is called multiple times in quick succession
  const timestamp = Date.now();
  
  // Track used IDs to ensure uniqueness
  const usedIds = new Set();
  
  // Parse each line of the content
  const elements = content.split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const lineKey = line.toLowerCase().trim();
      
      // First check if this exact line exists in our map to preserve its ID
      const existingElement = existingContentMap[lineKey];
      if (existingElement) {
        return {
          ...existingElement,
          content: line
        };
      }
      
      // If no exact match, use our detection rules
      let type = 'liturgy';
      const lowerLine = line.toLowerCase().trim();
      
      // Special case for Children's Message - explicitly make it liturgy first
      if (
        lowerLine.includes("children's message") ||
        (lowerLine.includes('children') && lowerLine.includes('message'))
      ) {
        type = 'liturgy';
      }
      // Song/Hymn detection - expanded matching
      else if (
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
      // Message/Sermon detection - make sure it's not a children's message
      else if (
        (lowerLine.includes('sermon:') || lowerLine.includes('message:')) && 
        !lowerLine.includes("children's message") &&
        !lowerLine.includes('children')
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
        
      // Generate a unique ID that includes the index to prevent duplicates
      const cleanContent = line.replace(/[^a-zA-Z0-9]/g, '');
      let baseId = `temp_${type}_${cleanContent}`;
      let uniqueId = baseId;
      let counter = 0;
      
      // Ensure the ID is unique by adding a counter if needed
      while (usedIds.has(uniqueId)) {
        counter++;
        uniqueId = `${baseId}_${counter}`;
      }
      
      // Add the final ID to our set of used IDs
      usedIds.add(uniqueId);

      return {
        id: uniqueId,
        type,
        content: line,
        selection: null,
        required: type !== 'liturgy'
      };
    });
    
  return elements;
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
    { content: "Children's Message", type: 'liturgy' },
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
    { content: "Children's Message", type: 'liturgy' },
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
    { content: "Children's Message", type: 'liturgy' },
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
  
  // Special case for Children's Message - check this first
  if (lowerLine.includes("children's message") ||
      (lowerLine.includes('children') && lowerLine.includes('message'))) {
    return 'liturgy';
  }
  
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
  
  // Message/Sermon detection - make sure it's not a children's message
  if ((lowerLine.includes('sermon:') || lowerLine.includes('message:')) && 
      !lowerLine.includes("children's message") &&
      !lowerLine.includes('children')) {
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
  
  // Create refs for dynamic layout adjustments
  const cardRef = useRef(null);
  const editorRef = useRef(null);
  const elementsListRef = useRef(null);
  
  // NEW FUNCTION: Convert current elements back to editable content
  const reconstructContentFromElements = (elements) => {
    if (!elements || !elements.length) return '';
    
    console.log('🔄 PASTOR EDIT: Reconstructing content from current elements:', {
      elementCount: elements.length,
      elementTypes: elements.map(e => e.type)
    });
    
    return elements.map(element => {
      // For song elements with selections, extract just the prefix for editing
      if (element.type === 'song_hymn' || element.type === 'song_contemporary') {
        if (element.selection) {
          // Extract the original prefix from the content
          const prefix = element.content?.split(':')[0]?.trim() || 'Song';
          return `${prefix}:`;
        }
      }
      
      // For readings and messages, include both content and reference if available
      if (element.type === 'reading' || element.type === 'message') {
        let contentLine = element.content || '';
        if (element.reference && !contentLine.includes(element.reference)) {
          // If content doesn't end with colon, add one
          if (!contentLine.endsWith(':')) {
            contentLine += ':';
          }
          contentLine += ` ${element.reference}`;
        }
        return contentLine;
      }
      
      // For all other elements, use content as-is
      return element.content || '';
    }).join('\n');
  };
  
  // State management
  const [selectedType, setSelectedType] = useState(() => getDefaultServiceType(date));
  const [showCustomDropdown, setShowCustomDropdown] = useState(false);
  const [orderOfWorship, setOrderOfWorship] = useState('');
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [customServices, setCustomServices] = useState([]);
  const [hasExistingContent, setHasExistingContent] = useState(false);
  const [isCustomService, setIsCustomService] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false); // NEW: Prevent race conditions
  
  // Add state for the new two-step workflow
  const [currentStep, setCurrentStep] = useState('main'); // 'main', 'editor'
  const [serviceElementLines, setServiceElementLines] = useState([]);
  const [elementDetails, setElementDetails] = useState({});
  
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
  
  // Update useEffect to load service content
  useEffect(() => {
    const loadExistingContent = async () => {
      // Prevent race conditions - only initialize once
      if (isInitialized) {
        console.log('📖 PASTOR EDIT: Already initialized, ignoring prop changes to prevent overwriting user edits');
        return;
      }
      
      // Wait for custom services to be loaded before determining service type
      if (customServices.length === 0) {
        console.log('📖 PASTOR EDIT: Waiting for custom services to load...');
        return;
      }
      
      try {
        // First, check if we have serviceDetails passed as props (EDIT MODE)
        if (serviceDetails && (serviceDetails.elements || serviceDetails.content)) {
          console.log('📖 PASTOR EDIT: Loading existing service from props (EDIT MODE):', {
            type: serviceDetails.type,
            hasContent: !!serviceDetails.content,
            hasElements: !!serviceDetails.elements,
            elementCount: serviceDetails.elements?.length
          });
          
          let editableContent;
          let elementsToUse;
          
          // If we have elements (current state), reconstruct content from them
          if (serviceDetails.elements && serviceDetails.elements.length > 0) {
            console.log('📖 PASTOR EDIT: Reconstructing content from current elements');
            editableContent = reconstructContentFromElements(serviceDetails.elements);
            
            // Create cleaned elements for pastor editing (remove detailed song info)
            elementsToUse = serviceDetails.elements.map(element => {
              if (element.type === 'song_hymn' || element.type === 'song_contemporary') {
                if (element.selection) {
                  // Extract just the prefix for pastor editing
                  const prefix = element.content?.split(':')[0]?.trim() || 'Song';
                  return {
                    ...element,
                    content: `${prefix}:`
                  };
                }
              }
              return element;
            });
          } 
          // Fallback to stored content if no elements
          else if (serviceDetails.content) {
            console.log('📖 PASTOR EDIT: Using stored content as fallback');
            editableContent = serviceDetails.content;
            elementsToUse = parseServiceContent(serviceDetails.content);
          }
          
          setOrderOfWorship(editableContent);
          setSelectedType(serviceDetails.type || getDefaultServiceType(date));
          setHasExistingContent(true);
          const isCustom = customServices.some(s => s.id === serviceDetails.type);
          console.log('📖 PASTOR EDIT: Service type detection:', {
            serviceType: serviceDetails.type,
            customServicesCount: customServices.length,
            isCustom: isCustom
          });
          setIsCustomService(isCustom);
          
          // Use the elements (either existing or parsed)
          setServiceElementLines(elementsToUse);
          
          // Initialize element details from existing elements
          const details = {};
          elementsToUse.forEach(element => {
            details[element.id] = {
              reference: element.reference || '',
              notes: element.notes || '',
              selection: element.selection || null
            };
          });
          
          console.log('🔧 PastorServiceInput: Initial elementDetails from props:', details);
          
          setElementDetails(details);
          setIsInitialized(true); // Mark as initialized
          return; // Exit early - we have the data we need
        }

        // If no props data, fetch from API
        const response = await fetch(`/api/service-details?date=${date}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.content) {
            console.log('📖 PASTOR EDIT: Loading existing service from API:', {
              type: data.type,
              contentLength: data.content?.length,
              hasElements: !!data.elements
            });
            
            // Only update if we have existing content
            setOrderOfWorship(data.content);
            setSelectedType(data.type || getDefaultServiceType(date));
            setHasExistingContent(true);
            const isCustom = customServices.some(s => s.id === data.type);
            setIsCustomService(isCustom);
            
            // Parse the lines to get element types
            const parsedElements = parseServiceContent(data.content, data.elements);
            setServiceElementLines(parsedElements);
            
            // Initialize element details
            const details = {};
            if (data.elements) {
              data.elements.forEach(element => {
                details[element.id] = {
                  reference: element.reference || '',
                  notes: element.notes || '',
                  selection: element.selection || null
                };
              });
            }
            
            console.log('🔧 PastorServiceInput: Initial elementDetails from API:', details);
            
            setElementDetails(details);
          } else if (!hasExistingContent) {
            console.log('📖 PASTOR EDIT: No existing content, using default template');
            // Only set default if we don't have any content
            const defaultType = getDefaultServiceType(date);
            setSelectedType(defaultType);
            const defaultContent = getServiceTemplates()[defaultType];
            setOrderOfWorship(defaultContent);
            
            // Initialize element types for the default content
            const parsedElements = parseServiceContent(defaultContent);
            setServiceElementLines(parsedElements);
            setIsCustomService(false);
          }
        }
        setIsInitialized(true); // Mark as initialized
      } catch (error) {
        console.error('Error loading service content:', error);
        setIsInitialized(true); // Mark as initialized even on error
      }
    };

    loadExistingContent();
  }, [date, customServices]); // Added customServices to ensure proper custom service detection

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
    // Only run if initialized and user explicitly selected a custom service
    if (isInitialized && isCustomService && selectedType && !hasExistingContent) {
      const customService = customServices.find(s => s.id === selectedType);
      if (customService) {
        console.log('📖 PASTOR EDIT: Loading custom service template (user selection)');
        const serviceContent = customService.order || customService.template;
        setOrderOfWorship(serviceContent);
        setHasExistingContent(false);
        
        // Also update the service element lines to display the custom service
        const parsedElements = parseServiceContent(serviceContent);
        setServiceElementLines(parsedElements);
        
        // Reset element details since we're loading a new template
        setElementDetails({});
      }
    }
  }, [isCustomService, selectedType]); // REMOVED: customServices to prevent race conditions

  // Update the handleServiceTypeChange to preserve selections when possible
  const handleServiceTypeChange = (typeId) => {
    if (!hasExistingContent || window.confirm('Changing service type will reset the order of worship. Continue?')) {
      const elements = standardServiceElements[typeId];
      const content = elements.map(el => el.content).join('\n');
      
      setSelectedType(typeId);
      setIsCustomService(false);
      setOrderOfWorship(content);
      setHasExistingContent(false);
      
      // Parse the content into service element lines and update the display
      const parsedElements = parseServiceContent(content);
      setServiceElementLines(parsedElements);
      
      // Reset element details since we're changing service type
      setElementDetails({});
    }
  };

  // Add a function to handle element type changes
  const handleElementTypeChange = (elementIndex, newType) => {
    const updatedElements = [...serviceElementLines]; // Shallow copy of array
    // Create a shallow copy of the element to modify, to avoid direct state mutation before setState
    const elementToModify = { ...updatedElements[elementIndex] };

    // Only proceed if type actually changes
    if (elementToModify.type === newType) {
      return; // Type is the same, no ID change needed
    }

    const oldId = elementToModify.id;
    elementToModify.type = newType; // Update the type on the copied element

    const formattedDate = date.replace(/\//g, '');
    // Use content from the element being modified
    const cleanContent = elementToModify.content.replace(/[^a-zA-Z0-9]/g, '');
    const baseId = `${formattedDate}_${elementToModify.type}_${cleanContent}`;

    let newGeneratedId = baseId;
    let suffix = 0; // Start suffix from 0 for base, 1 for first duplicate, etc.

    // Create a set of IDs from all *other* elements for efficient lookup
    const existingIdsFromOtherElements = new Set();
    updatedElements.forEach((el, idx) => {
      if (idx !== elementIndex) {
        existingIdsFromOtherElements.add(el.id);
      }
    });

    // Ensure newGeneratedId is unique among other elements
    while (existingIdsFromOtherElements.has(newGeneratedId)) {
      suffix++;
      newGeneratedId = `${baseId}_${suffix}`;
    }

    elementToModify.id = newGeneratedId; // Assign the unique ID
    updatedElements[elementIndex] = elementToModify; // Place the modified copied element back into the array

    setElementDetails(prevDetails => {
      const newElementDetails = { ...prevDetails };
      if (oldId !== newGeneratedId) {
        // Transfer details from oldId to newGeneratedId
        newElementDetails[newGeneratedId] = prevDetails[oldId] || {};
        delete newElementDetails[oldId]; // Remove oldId entry
      } else {
        // ID didn't change (e.g., type change resulted in the same ID, which was already unique)
        // Ensure details are correctly associated, though they should be already.
        newElementDetails[oldId] = prevDetails[oldId] || {};
      }
      return newElementDetails;
    });

    setServiceElementLines(updatedElements);
  };

  // Add a function to update element details
  const updateElementDetail = (elementId, field, value) => {
    // This function ensures updates are isolated to the specific element only
    console.log(`🔧 PastorServiceInput: Updating element ${elementId}, field ${field} with value "${value}"`);
    console.log(`🔧 PastorServiceInput: Current elementDetails before update:`, elementDetails);
    
    setElementDetails(prev => {
      // Create a new object to avoid reference issues
      const newDetails = { ...prev };
      
      // Make sure we're updating only the specific element
      newDetails[elementId] = {
        ...(prev[elementId] || {}),
        [field]: value
      };
      
      console.log(`🔧 PastorServiceInput: Updated elementDetails for ${elementId}:`, newDetails[elementId]);
      console.log(`🔧 PastorServiceInput: Full new elementDetails:`, newDetails);
      
      return newDetails;
    });
  };

  // Update the handleSave function to use serviceElementLines when available
  const handleSave = () => {
    if (orderOfWorship) {
      let elements = [];
      const currentLines = orderOfWorship.split('\n').map(line => line.trim()).filter(Boolean);
      
      // Get existing elements and their song selections
      const existingElements = serviceDetails?.[date]?.elements || [];
      
      console.log('🔍 PastorServiceInput: Preparing save data...');
      console.log('🔍 PastorServiceInput: serviceElementLines:', serviceElementLines?.length || 0);
      console.log('🔍 PastorServiceInput: elementDetails AT SAVE TIME:', elementDetails);
      console.log('🔍 PastorServiceInput: elementDetails JSON AT SAVE TIME:', JSON.stringify(elementDetails, null, 2));
      
      // Use the serviceElementLines as they contain pastor-specified types
      elements = serviceElementLines.map(element => {
        // Get any additional details that have been entered
        const details = elementDetails[element.id] || {};
        
        console.log(`🔍 PastorServiceInput: Processing element ${element.id}: element.reference="${element.reference}", details.reference="${details.reference}"`);
        
        const finalElement = {
          id: element.id,
          type: element.type,
          content: element.content,
          reference: details.reference !== undefined ? details.reference : (element.reference || ''),
          notes: details.notes || element.notes || '',
          selection: details.selection || element.selection,
          required: element.required
        };
        
        // Log readings specifically
        if (element.type === 'reading') {
          console.log(`📖 PastorServiceInput: Reading element - "${element.content}" -> reference: "${finalElement.reference}"`);
        }
        
        return finalElement;
      });
      
      // Log final readings
      const finalReadings = elements.filter(el => el.type === 'reading');
      console.log('📖 PastorServiceInput: Final readings to save:', finalReadings.map(r => ({ content: r.content, reference: r.reference })));

      // Apply the same song and reading preservation logic as before
      if (isCustomService) {
        // ... song matching strategies
      }
      
      // Count existing songs with selections
      const existingSongCount = existingElements.filter(el => 
        el.type === 'song_hymn' && el.selection?.title
      ).length;
      
      // Count new song slots in edited worship order
      const newSongCount = elements.filter(el => el.type === 'song_hymn').length;
      
      // Show warning if songs are being removed
      if (existingSongCount > 0 && newSongCount < existingSongCount) {
        const confirmRemove = window.confirm(
          `Warning: Your edit reduces the number of songs from ${existingSongCount} to ${newSongCount}. ` +
          `This may remove song selections that have already been made by the worship team. Continue?`
        );
        
        if (!confirmRemove) {
          return; // Cancel save if user doesn't confirm
        }
      }
      
      console.log('Final elements with details:', elements);

      const saveData = {
        type: selectedType,
        content: orderOfWorship,
        elements: elements
      };
      
      console.log('🚀 PastorServiceInput: About to call onSave with data:', JSON.stringify(saveData, null, 2));
      
      onSave(saveData);
    }  };

  // Function to adjust layout sizes based on available space
  const adjustLayoutSizes = () => {
    if (!cardRef.current) return;
    
    const windowHeight = window.innerHeight;
    const cardHeight = cardRef.current.offsetHeight;
    const headerHeight = 70; // Approximate header height
    const footerHeight = 70; // Approximate footer height
    const serviceTypeHeight = 220; // Approximate height of service type selection
    const orderTitleHeight = 40; // Height of order of worship title
    const padding = 32; // Total vertical padding
    
    // Calculate available height for elements list - use a larger portion of the available space
    const availableHeight = cardHeight - headerHeight - footerHeight - serviceTypeHeight - orderTitleHeight - padding;
    const editorHeight = Math.max(300, Math.min(600, availableHeight));
    
    if (editorRef.current) {
      editorRef.current.style.height = `${editorHeight}px`;
    }
    
    if (elementsListRef.current) {
      // Use more screen space for the elements list
      elementsListRef.current.style.maxHeight = `${Math.max(400, availableHeight)}px`;
      elementsListRef.current.style.height = `${Math.max(400, availableHeight)}px`;
    }
    
    console.log(`Adjusted layout: window: ${windowHeight}, card: ${cardHeight}, available: ${availableHeight}, set: ${Math.max(400, availableHeight)}`);
  };
  
  // Track window resize for optimal layout
  useEffect(() => {
    const handleResize = () => {
      adjustLayoutSizes();
    };
    
    window.addEventListener('resize', handleResize);
    
    // Initial adjustment after component mounts
    setTimeout(adjustLayoutSizes, 100);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isMobile]);

  // Helper functions
  const parseOrderOfWorship = (text, formattedDate) => {
    // ...existing code...
  };

  // Function to handle order editor to main transition
  const saveOrderAndReturnToMain = () => {
    if (orderOfWorship.trim()) {
      // Parse the order of worship text into structured elements
      const formattedDate = date.replace(/\//g, '');
      const parsedElements = parseOrderOfWorship(orderOfWorship, formattedDate);
      
      // Update the service element lines with stable IDs
      const elementsWithStableIds = parsedElements.map((element, index) => {
        const cleanContent = element.content.replace(/[^a-zA-Z0-9]/g, '');
        const stableId = `${formattedDate}_${element.type}_${cleanContent}_${index}`;
        
        return {
          ...element,
          id: stableId
        };
      });
      
      setServiceElementLines(elementsWithStableIds);
    }
    
    // Transition back to main step
    setCurrentStep('main');
  };

  // Function to open the order editor
  const openOrderEditor = () => {
    // If we have existing service elements, convert them back to text format
    if (serviceElementLines.length > 0) {
      const textContent = serviceElementLines.map(element => element.content).join('\n');
      setOrderOfWorship(textContent);
    }
    
    // Transition to editor step
    setCurrentStep('editor');
  };

  // Function to handle custom service selection
  const handleCustomServiceSelection = (service) => {
    console.log('Custom service selected:', service);
    
    // Update the selected type to the custom service ID
    setSelectedType(service.id);
    
    // Mark this as a custom service
    setIsCustomService(true);
    
    // Close the custom dropdown
    setShowCustomDropdown(false);
    
    // Load the custom service template/order into the order of worship
    const serviceContent = service.order || service.template || service.elements?.map(el => el.content).join('\n') || '';
    setOrderOfWorship(serviceContent);
    
    // Reset existing content flag since we're loading a template
    setHasExistingContent(false);
    
    // Parse the content into service element lines and update the display
    const parsedElements = parseServiceContent(serviceContent);
    setServiceElementLines(parsedElements);
    
    // Reset element details since we're changing service type
    setElementDetails({});
    
    console.log('Custom service state updated:', {
      selectedType: service.id,
      isCustomService: true,
      orderOfWorship: serviceContent.substring(0, 50) + '...'
    });
  };

  // Helper function for rendering the editor view
  const renderEditorView = () => (
    <>
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={() => setCurrentStep('main')}
              className="mr-3 p-1 rounded-full hover:bg-gray-100"
              title="Return to main view"
            >
              <ArrowLeft className="w-5 h-5 text-[#6B8E23]" />
            </button>
            <div>
              <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-[#6B8E23]`}>
                Edit Order of Worship
              </h2>
              <p className="text-sm text-gray-500">
                {getSundayInfo(date).formattedDate} | {getSundayInfo(date).sundayInfo}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#6B8E23] hover:bg-[#6B8E23] hover:bg-opacity-20 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden p-4 flex flex-col">
        <div className="mb-3 text-sm text-gray-600">
          <p className="mb-1 font-medium">Enter or paste your complete order of worship below:</p>
          <p>Each line will become a separate element in your service. When you're done, click "Save & Continue" to review and refine element types.</p>
        </div>
        
        <div className="border rounded overflow-hidden flex flex-col flex-1">
          <div className="bg-gray-50 px-3 py-2 border-b flex justify-between items-center">
            <span className="font-medium text-sm">Order of Worship</span>
            <div className="flex gap-2">
              <button
                className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded border text-gray-700"
                onClick={() => {
                  // Reset to default template
                  if (window.confirm('Reset to default template? This will replace your current content.')) {
                    const defaultContent = getServiceTemplates()[selectedType];
                    setOrderOfWorship(defaultContent);
                  }
                }}
              >
                Reset to Template
              </button>
            </div>
          </div>
          <div className="flex-1 flex">
            <textarea
              ref={editorRef}
              value={orderOfWorship}
              onChange={(e) => setOrderOfWorship(e.target.value)}
              className="w-full p-3 border-0 font-mono text-sm focus:ring-0 focus:outline-none"
              style={{ 
                height: '100%',
                flex: '1',
                resize: 'none'
              }}
              placeholder="Enter your order of worship here..."
            />
          </div>
        </div>
      </div>
        <div className={`p-4 border-t bg-[#FFD700] bg-opacity-10 flex justify-between gap-3 ${isMobile ? 'safe-area-bottom' : ''}`}>
        <button
          onClick={() => setCurrentStep('main')}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          onClick={saveOrderAndReturnToMain}
          className="px-4 py-2 bg-[#6B8E23] text-white rounded hover:bg-[#556B2F] flex items-center"
        >
          <Save className="w-4 h-4 mr-1" />
          Save & Continue
        </button>
      </div>
    </>
  );
  
  // Helper function for rendering service element detail fields
  const renderElementDetailFields = (element, index) => {
  const elementId = element.id;
  const details = elementDetails[elementId] || {};
  
  switch (element.type) {
    case 'reading':
      // Now handling reading fields in the main element rendering
      return null;
    
    case 'message':
      // Now handling message fields in the main element rendering
      return null;
      case 'song_hymn':
      return (
        <div className="text-gray-500 text-sm italic">
          Song will be selected by worship team
        </div>
      );
      
    default:
      return null;
  }
  };

  // Helper function for rendering the main view
  const renderMainView = () => (
    <>
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

      <div className="p-4 space-y-4 overflow-y-auto flex-1">
        {!isMobile && (
          <div className="flex justify-end">
            <div className="text-right text-sm text-gray-600 bg-[#FFD700] bg-opacity-10 p-3 rounded">
              <h4 className="font-medium text-[#6B8E23] mb-1">Standard Schedule:</h4>
              <p>1st Sunday: Communion & Sing Lord's Prayer</p>
              <p>3rd Sunday: Communion with Potluck</p>
            </div>
          </div>
        )}

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

          <h3 className="text-base font-bold text-[#6B8E23] mb-2">Or Select Custom Service</h3>
          <div className="relative mb-5">
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

        {/* Order of Worship Section */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-bold text-[#6B8E23]">Order of Worship</h3>
            <button
              onClick={openOrderEditor}
              className="px-3 py-1.5 bg-[#6B8E23] text-white rounded-md hover:bg-[#556B2F] flex items-center text-sm"
            >
              <FileText className="w-4 h-4 mr-1" />
              Edit Order
            </button>
          </div>

          {serviceElementLines.length === 0 ? (
            <div className="bg-gray-50 border rounded p-4 text-center">
              <p className="text-gray-500 mb-2">No order of worship has been created yet</p>
              <button
                onClick={openOrderEditor}
                className="px-4 py-2 bg-[#6B8E23] text-white rounded hover:bg-[#556B2F]"
              >
                Create Order of Worship
              </button>
            </div>          ) : (
            <div className="border rounded overflow-hidden" ref={elementsListRef}>
              <div className="bg-gray-50 px-3 py-2 border-b">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm">Service Elements</span>
                  <span className="text-xs text-gray-500">{serviceElementLines.length} items</span>
                </div>
              </div>              <div className="divide-y overflow-y-auto" style={{ maxHeight: "calc(100vh - 250px)", minHeight: "500px" }}>
                {serviceElementLines.map((element, index) => {
                  // Use the element's existing stable ID, or create one with index for uniqueness
                  const elementId = element.id || `${date.replace(/\//g, '')}_${element.type}_${element.content.replace(/[^a-zA-Z0-9]/g, '')}_${index}`;
                  
                  return (
                    <div key={elementId} className="py-2 px-2 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm flex items-center space-x-2">
                            <span>{element.content}</span>
                            {(element.type === 'reading' || element.type === 'message') && (
                              <input
                                type="text"
                                value={(elementDetails[elementId] || {}).reference || ''}
                                onChange={(e) => updateElementDetail(elementId, 'reference', e.target.value)}
                                className="border-gray-200 focus:ring-[#6B8E23] focus:border-[#6B8E23] rounded-sm text-sm ml-2 w-64"
                                placeholder={element.type === 'reading' ? 
                                  "Enter scripture reference (e.g. John 3:16-21)" : 
                                  "Enter sermon title"}
                              />
                            )}
                          </div>
                        </div>
                        <div className="ml-2">
                          <select
                            value={element.type}
                            onChange={(e) => handleElementTypeChange(index, e.target.value)}
                            className="text-xs border border-gray-300 rounded focus:border-[#6B8E23] focus:ring-[#6B8E23] h-8 font-medium"
                            style={{
                              backgroundColor: 
                                element.type === 'song_hymn' ? '#f0f9e8' :
                                element.type === 'reading' ? '#f0f0f9' :                                element.type === 'message' ? '#f9f0e8' :
                                element.type === 'liturgical_song' ? '#e8f0f9' :
                                '#f9f9f9'
                            }}
                          >
                            <option value="liturgy">Liturgy</option>
                            <option value="song_hymn">Song/Hymn</option>
                            <option value="liturgical_song">Liturgical Song</option>
                            <option value="reading">Reading</option>
                            <option value="message">Message/Sermon</option>
                          </select>
                        </div>                        <div> 
                          {(element.type === 'song_hymn' || element.type === 'liturgical_song') && (
                            <div className="mt-1 pl-2">
                              {renderElementDetailFields(element, index)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Icon legend removed to declutter the interface */}
            </div>
          )}
        </div>
      </div>
      <div className={`p-4 border-t bg-[#FFD700] bg-opacity-10 flex justify-end gap-3 ${isMobile ? 'safe-area-bottom' : ''}`}>
        <button
          onClick={onClose}
          className="px-4 py-2 border border-[#6B8E23] text-[#6B8E23] rounded hover:bg-[#6B8E23] hover:text-white"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-[#6B8E23] text-white rounded hover:bg-[#556B2F] flex items-center"
          disabled={serviceElementLines.length === 0}        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Save Service Details
        </button>
      </div>
    </>
  );

  // Main component return
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[200]">
      <Card 
        ref={cardRef} 
        className={`w-full ${isMobile ? 'max-w-full' : 'max-w-4xl'} bg-white shadow-xl flex flex-col ${isMobile ? 'rounded-none' : 'rounded-lg'}`}
        style={isMobile ? { marginBottom: "56px", height: "calc(100vh - 20px)" } : { maxHeight: "90vh", height: "min(90vh, 90%)" }}
      >
        {currentStep === 'editor' ? renderEditorView() : renderMainView()}
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
