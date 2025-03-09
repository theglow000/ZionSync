import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function titleCase(str) {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(word => {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
}

export function spellCheckAndCorrect(str) {
  if (!str) return '';
  
  // Start with title case
  let result = titleCase(str);
  
  // Common correction mappings
  const corrections = {
    'And': 'and',
    'The': 'the',
    'Of': 'of',
    'In': 'in',
    'For': 'for',
    'To': 'to',
    'With': 'with',
    'By': 'by',
    'On': 'on',
    'At': 'at',
    'As': 'as',
    'But': 'but',
    'Or': 'or',
    'Nor': 'nor',
    'Yet': 'yet',
    'So': 'so'
  };
  
  // Split into words for processing
  let words = result.split(' ');
  
  // Always capitalize first and last words
  if (words.length > 0) {
    words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
  }
  
  // Apply corrections to non-first words
  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    if (corrections[word]) {
      words[i] = corrections[word];
    }
  }
  
  // Capitalize last word
  if (words.length > 1) {
    const lastIdx = words.length - 1;
    words[lastIdx] = words[lastIdx].charAt(0).toUpperCase() + words[lastIdx].slice(1);
  }
  
  return words.join(' ');
}