/**
 * Liturgical Calendar Validation Schemas
 * 
 * Provides Zod validation schemas for liturgical calendar data types.
 * Following Phase 4A validation patterns for consistency.
 */

import { z } from 'zod';

// Valid liturgical season IDs
export const VALID_SEASONS = [
  'ADVENT', 'CHRISTMAS', 'EPIPHANY', 'LENT', 'HOLY_WEEK', 
  'EASTER', 'PENTECOST_DAY', 'TRINITY', 'ORDINARY_TIME',
  'REFORMATION', 'ALL_SAINTS', 'CHRIST_KING'
];

// Valid feast day IDs
export const VALID_FEAST_DAYS = [
  'CHRISTMAS_EVE', 'CHRISTMAS_DAY', 'EPIPHANY_DAY', 'TRANSFIGURATION',
  'ASH_WEDNESDAY', 'PALM_SUNDAY', 'MAUNDY_THURSDAY', 'GOOD_FRIDAY',
  'EASTER_SUNDAY', 'ASCENSION', 'PENTECOST', 'TRINITY_SUNDAY',
  'REFORMATION_SUNDAY', 'ALL_SAINTS_DAY', 'CHRIST_KING'
];

// Date validation schema
export const dateSchema = z.union([
  z.date(),
  z.string().regex(/^\d{1,2}\/\d{1,2}\/\d{2,4}$/, 'Date must be in MM/DD/YY or MM/DD/YYYY format'),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
]).transform(val => {
  if (val instanceof Date) return val;
  
  // Handle MM/DD/YY format
  if (val.includes('/')) {
    const [month, day, year] = val.split('/').map(Number);
    const fullYear = year < 50 ? 2000 + year : (year < 100 ? 1900 + year : year);
    return new Date(fullYear, month - 1, day);
  }
  
  // Handle YYYY-MM-DD format
  return new Date(val);
});

// Year validation schema
export const yearSchema = z.number()
  .int('Year must be an integer')
  .min(1970, 'Year must be 1970 or later')
  .max(2100, 'Year must be 2100 or earlier');

// Season validation schema
export const seasonSchema = z.object({
  seasonId: z.enum(VALID_SEASONS, { 
    errorMap: () => ({ message: 'Invalid liturgical season ID' }) 
  }),
  season: z.object({
    name: z.string().min(1, 'Season name cannot be empty'),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be in hex format (#RRGGBB)')
  }),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be in hex format (#RRGGBB)'),
  specialDayId: z.enum(VALID_FEAST_DAYS).nullable().optional(),
  specialDay: z.object({
    name: z.string(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    description: z.string().optional()
  }).nullable().optional()
});

// Liturgical service request validation
export const liturgicalRequestSchema = z.object({
  date: dateSchema,
  includeSpecialDays: z.boolean().default(true),
  format: z.enum(['full', 'basic']).default('full')
});

// Service liturgical data validation
export const serviceLiturgicalSchema = z.object({
  season: z.enum(VALID_SEASONS),
  seasonName: z.string().min(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  specialDay: z.enum(VALID_FEAST_DAYS).nullable().optional(),
  specialDayName: z.string().nullable().optional()
});

// Migration validation schema
export const migrationDataSchema = z.object({
  date: z.string().regex(/^\d{1,2}\/\d{1,2}\/\d{2,4}$/),
  liturgical: serviceLiturgicalSchema
});

// Validation helper functions
export function validateDate(dateInput) {
  try {
    return dateSchema.parse(dateInput);
  } catch (error) {
    throw new Error(`Invalid date format: ${error.message}`);
  }
}

export function validateSeason(seasonData) {
  try {
    return seasonSchema.parse(seasonData);
  } catch (error) {
    throw new Error(`Invalid liturgical season data: ${error.message}`);
  }
}

export function validateYear(yearInput) {
  try {
    return yearSchema.parse(yearInput);
  } catch (error) {
    throw new Error(`Invalid year: ${error.message}`);
  }
}

export function createValidationResponse(errors, status = 400) {
  return {
    error: 'Validation failed',
    details: errors.map(err => ({
      field: err.path?.join('.') || 'unknown',
      message: err.message
    })),
    status
  };
}
