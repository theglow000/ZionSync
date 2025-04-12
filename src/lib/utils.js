import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes conditionally
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format date to locale string
 */
export function formatDate(input) {
  const date = input instanceof Date ? input : new Date(input);
  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format a number as a currency
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

/**
 * Truncate text to specified length
 */
export function truncateText(text, length = 100) {
  if (!text) return "";
  return text.length > length ? `${text.substring(0, length)}...` : text;
}

/**
 * Check if an item exists in an array
 */
export function arrayIncludes(array, item) {
  return array?.includes(item) ?? false;
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