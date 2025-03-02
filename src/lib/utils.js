import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Common words that should remain lowercase in titles (unless first or last word)
const LOWERCASE_WORDS = new Set([
  'a', 'an', 'the', 'and', 'but', 'or', 'nor', 'for', 'so', 'yet',
  'to', 'of', 'by', 'at', 'in', 'on', 'with', 'from', 'as', 'into'
]);

// Common prefixes that should be handled specially
const NAME_PREFIXES = {
  'mc': (str) => 'Mc' + capitalizeFirstLetter(str.substring(2)),
  'mac': (str) => 'Mac' + capitalizeFirstLetter(str.substring(3)),
  "o'": (str) => "O'" + capitalizeFirstLetter(str.substring(2)),
  'von': (str) => 'Von' + capitalizeFirstLetter(str.substring(3)),
  'van': (str) => 'Van' + capitalizeFirstLetter(str.substring(3)),
  'de': (str) => 'De' + capitalizeFirstLetter(str.substring(2)),
  'la': (str) => 'La' + capitalizeFirstLetter(str.substring(2)),
  'le': (str) => 'Le' + capitalizeFirstLetter(str.substring(2)),
  'du': (str) => 'Du' + capitalizeFirstLetter(str.substring(2)),
  'st': (str) => 'St' + capitalizeFirstLetter(str.substring(2)),
};

// Helper function to capitalize first letter of a string
function capitalizeFirstLetter(str) {
  if (!str || typeof str !== 'string' || str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Apply title case to a string (for song titles and author names)
export function titleCase(text) {
  if (!text || typeof text !== 'string') return text;
  
  // Preserve intentional capitalization
  // If the text contains any uppercase letters (except first letter of words)
  // assume the user is deliberately using custom capitalization
  const hasIntentionalCapitalization = text.split(' ').some(word => {
    if (word.length < 2) return false;
    for (let i = 1; i < word.length; i++) {
      if (word[i] === word[i].toUpperCase() && word[i].match(/[A-Z]/)) {
        return true;
      }
    }
    return false;
  });
  
  // If it has intentional capitalization, just ensure the first letter of each word is capitalized
  if (hasIntentionalCapitalization) {
    return text.split(' ')
      .map(word => word ? capitalizeFirstLetter(word) : word)
      .join(' ');
  }
  
  // Split into words, preserving spaces
  const words = text.split(/(\s+)/).filter(Boolean);
  
  // Process each word or space
  const result = [];
  let wordIndex = 0;
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    
    // Skip spaces
    if (word.trim() === '') {
      result.push(word); // Preserve original spaces
      continue;
    }
    
    // Process actual word
    const isFirstWord = wordIndex === 0;
    const isLastWord = wordIndex === words.filter(w => w.trim() !== '').length - 1;
    const lowercaseWord = word.toLowerCase();
    
    // Check for special prefixes
    let processed = false;
    for (const prefix in NAME_PREFIXES) {
      if (lowercaseWord.startsWith(prefix)) {
        result.push(NAME_PREFIXES[prefix](lowercaseWord));
        processed = true;
        break;
      }
    }
    
    if (!processed) {
      // Handle hyphenated words
      if (word.includes('-')) {
        result.push(word.split('-')
          .map(part => capitalizeFirstLetter(part.toLowerCase()))
          .join('-'));
      }
      // First and last words are always capitalized
      else if (isFirstWord || isLastWord) {
        result.push(capitalizeFirstLetter(lowercaseWord));
      }
      // Lowercase certain words (articles, conjunctions, prepositions)
      else if (LOWERCASE_WORDS.has(lowercaseWord)) {
        result.push(lowercaseWord);
      }
      // Default: capitalize first letter
      else {
        result.push(capitalizeFirstLetter(lowercaseWord));
      }
    }
    
    wordIndex++;
  }
  
  return result.join('');
}

// Common misspellings in hymn titles and their corrections
const COMMON_MISSPELLINGS = {
  'savior': 'Savior',
  'saviour': 'Saviour',
  'halleljuah': 'Hallelujah',
  'hallelujah': 'Hallelujah',
  'halleluyah': 'Hallelujah',
  'majesty': 'Majesty',
  'sheperd': 'Shepherd',
  'shephard': 'Shepherd',
  'allelujah': 'Alleluia',
  'alleluia': 'Alleluia',
  'emmaus': 'Emmaus',
  'ressurection': 'Resurrection',
  'resurection': 'Resurrection',
  'jesu': 'Jesu',
  'magificat': 'Magnificat',
  'magnifcat': 'Magnificat',
  'hosana': 'Hosanna',
  'hosannah': 'Hosanna',
  'eucharist': 'Eucharist',
  'heavenly': 'Heavenly',
  'hevenly': 'Heavenly',
  'glorius': 'Glorious',
  'glorios': 'Glorious',
  'almighy': 'Almighty',
  'allmighty': 'Almighty',
  'comunion': 'Communion',
  'comunion': 'Communion',
  'wondruous': 'Wondrous',
  'wonderous': 'Wondrous',
  'comunity': 'Community',
  'commuity': 'Community',
  'redeemer': 'Redeemer',
  'redemer': 'Redeemer',
  'everlasting': 'Everlasting',
  'everlastig': 'Everlasting',
};

// Spell check and correct song titles
export function spellCheckAndCorrect(text) {
  if (!text || typeof text !== 'string') return text;
  
  // Apply title case first (with our improved function that respects intentional capitalization)
  let correctedText = titleCase(text);
  
  // Split into words to check each one
  const words = correctedText.split(/\s+/);
  const correctedWords = words.map(word => {
    // Skip short words, words with special characters, or words with intentional capitalization
    if (word.length < 4 || /[^a-zA-Z]/.test(word) || hasIntentionalCapitalization(word)) {
      return word;
    }
    
    // Check against common misspellings
    const lowercaseWord = word.toLowerCase();
    if (COMMON_MISSPELLINGS[lowercaseWord]) {
      return COMMON_MISSPELLINGS[lowercaseWord];
    }
    
    return word;
  });
  
  return correctedWords.join(' ');
}

// Helper function to detect intentional capitalization
function hasIntentionalCapitalization(word) {
  if (!word || word.length < 2) return false;
  
  // Check for mid-word capitals (e.g., "GodSpell", "McDowell")
  for (let i = 1; i < word.length; i++) {
    if (word[i] === word[i].toUpperCase() && word[i].match(/[A-Z]/)) {
      return true;
    }
  }
  
  return false;
}