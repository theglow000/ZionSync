import { z } from 'zod';

// Base song schema with common fields
const baseSongSchema = z.object({
  title: z.string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters")
    .trim(),
  type: z.enum(['hymn', 'contemporary'], {
    errorMap: () => ({ message: "Type must be either 'hymn' or 'contemporary'" })
  }),
  notes: z.string().max(1000, "Notes must be less than 1000 characters").optional().default(''),
  youtubeLink: z.string()
    .url("Invalid YouTube URL")
    .refine(url => url.includes('youtube.com') || url.includes('youtu.be'), {
      message: "Must be a valid YouTube URL"
    })
    .optional()
    .default(''),
  songOrder: z.string()
    .max(500, "Song order must be less than 500 characters")
    .optional()
    .default(''),
  seasonalTags: z.array(z.string()).optional().default([]),
  seasonalTagsConfidence: z.record(z.string(), z.number().min(0).max(1)).optional().default({}),
  _id: z.string().optional() // For updates
});

// Hymn-specific schema
const hymnSpecificSchema = z.object({
  number: z.string().max(10, "Hymn number must be less than 10 characters").optional().default(''),
  hymnal: z.string().max(100, "Hymnal name must be less than 100 characters").optional().default(''),
  hymnaryLink: z.string().url("Invalid Hymnary URL").optional().default('')
});

// Contemporary-specific schema  
const contemporarySpecificSchema = z.object({
  author: z.string().max(200, "Author name must be less than 200 characters").optional().default(''),
  songSelectLink: z.string().url("Invalid SongSelect URL").optional().default('')
});

// Complete song schemas
export const hymnSchema = baseSongSchema.merge(hymnSpecificSchema);
export const contemporarySchema = baseSongSchema.merge(contemporarySpecificSchema);

// Main song validation function
export function validateSongData(data) {
  try {
    if (data.type === 'hymn') {
      return {
        success: true,
        data: hymnSchema.parse(data),
        errors: null
      };
    } else if (data.type === 'contemporary') {
      return {
        success: true, 
        data: contemporarySchema.parse(data),
        errors: null
      };
    } else {
      return {
        success: false,
        data: null,
        errors: ["Type must be either 'hymn' or 'contemporary'"]
      };
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      errors: error.errors?.map(err => `${err.path.join('.')}: ${err.message}`) || [error.message]
    };
  }
}

// Query parameter validation schemas
export const songQuerySchema = z.object({
  recent: z.string().optional().transform(val => val === 'true'),
  months: z.string().optional().transform(val => {
    const num = parseInt(val || '3');
    return isNaN(num) ? 3 : Math.max(1, Math.min(num, 24)); // Limit between 1-24 months
  })
});

export const suggestionQuerySchema = z.object({
  limit: z.string().optional().transform(val => {
    const num = parseInt(val || '10');
    return isNaN(num) ? 10 : Math.max(1, Math.min(num, 100)); // Limit between 1-100
  }),
  unusedMonths: z.string().optional().transform(val => {
    const num = parseInt(val || '6');
    return isNaN(num) ? 6 : Math.max(1, Math.min(num, 24)); // Limit between 1-24 months
  }),
  type: z.string().optional().default('all'),
  season: z.string().optional(),
  refresh: z.string().optional().transform(val => val === 'true')
});

// Song usage validation schema for the existing API format
export const songUsageSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  date: z.string().regex(/^\d{1,2}\/\d{1,2}\/\d{2}$/, "Date must be in MM/DD/YY format"),
  service: z.string().max(100, "Service name must be less than 100 characters").optional().default(''),
  addedBy: z.string().max(100, "Added by must be less than 100 characters").optional().default(''),
  type: z.string().optional(),
  number: z.string().optional(),
  hymnal: z.string().optional(),
  author: z.string().optional(),
  hymnaryLink: z.string().url().optional().or(z.literal('')),
  songSelectLink: z.string().url().optional().or(z.literal('')),
  youtubeLink: z.string().url().optional().or(z.literal('')),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional().default('')
});

// Validation helper functions
export function validateQueryParams(schema, params) {
  try {
    return {
      success: true,
      data: schema.parse(params),
      errors: null
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      errors: error.errors?.map(err => `${err.path.join('.')}: ${err.message}`) || [error.message]
    };
  }
}

export function createValidationResponse(errors, status = 400) {
  return new Response(
    JSON.stringify({ 
      error: "Validation failed", 
      details: errors 
    }),
    { 
      status,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}
