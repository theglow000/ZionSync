/**
 * ServiceCalendar Model
 * 
 * Stores generated service dates for a given year with liturgical metadata.
 * This replaces the hardcoded DATES_2025 array with a database-driven approach.
 */

import mongoose from 'mongoose';

const ServiceDateSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  dateString: {
    type: String,  // MM/DD/YY format for backward compatibility
    required: true
  },
  dayOfWeek: {
    type: String,
    enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    required: true
  },
  // Liturgical Information
  season: {
    type: String,
    enum: [
      'ADVENT', 'CHRISTMAS', 'EPIPHANY', 'LENT', 'HOLY_WEEK', 'EASTER',
      'PENTECOST_DAY', 'TRINITY', 'ORDINARY_TIME', 'REFORMATION',
      'ALL_SAINTS', 'CHRIST_KING'
    ],
    required: true
  },
  seasonName: {
    type: String,
    required: true
  },
  seasonColor: {
    type: String,
    required: true
  },
  specialDay: {
    type: String,
    enum: [
      'CHRISTMAS_EVE', 'CHRISTMAS_DAY', 'EPIPHANY_DAY', 'BAPTISM_OF_OUR_LORD',
      'TRANSFIGURATION', 'ASH_WEDNESDAY', 'PALM_SUNDAY', 'MAUNDY_THURSDAY',
      'GOOD_FRIDAY', 'EASTER_SUNDAY', 'ASCENSION', 'PENTECOST_SUNDAY',
      'TRINITY_SUNDAY', 'REFORMATION_SUNDAY', 'ALL_SAINTS_DAY',
      'CHRIST_THE_KING', 'THANKSGIVING', 'ADVENT_1'
    ],
    default: null
  },
  specialDayName: {
    type: String,
    default: null
  },
  // Service Type
  isRegularSunday: {
    type: Boolean,
    default: true
  },
  isSpecialWeekday: {
    type: Boolean,
    default: false
  },
  // Override capabilities
  isOverridden: {
    type: Boolean,
    default: false
  },
  overrideReason: {
    type: String,
    default: null
  },
  overriddenBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  overriddenAt: {
    type: Date,
    default: null
  }
}, { _id: false });

const ServiceCalendarSchema = new mongoose.Schema({
  year: {
    type: Number,
    required: true,
    unique: true,
    min: 2024,
    max: 2100
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  algorithmVersion: {
    type: String,
    default: '1.0.0',  // Track which version of the algorithm generated this
    required: true
  },
  services: [ServiceDateSchema],
  metadata: {
    totalServices: {
      type: Number,
      default: 0
    },
    regularSundays: {
      type: Number,
      default: 0
    },
    specialWeekdays: {
      type: Number,
      default: 0
    },
    overriddenCount: {
      type: Number,
      default: 0
    }
  },
  // Key liturgical dates for quick reference
  keyDates: {
    adventStart: Date,
    christmasEve: Date,
    christmasDay: Date,
    epiphany: Date,
    ashWednesday: Date,
    palmSunday: Date,
    maundyThursday: Date,
    goodFriday: Date,
    easter: Date,
    ascension: Date,
    pentecost: Date,
    trinity: Date,
    reformationSunday: Date,
    allSaintsDay: Date,
    christTheKing: Date,
    thanksgiving: Date
  },
  // Validation
  validated: {
    type: Boolean,
    default: false
  },
  validationErrors: [{
    type: String
  }],
  validationWarnings: [{
    type: String
  }]
}, {
  timestamps: true,
  collection: 'serviceCalendar'
});

// Indexes for efficient querying
ServiceCalendarSchema.index({ year: 1 });
ServiceCalendarSchema.index({ 'services.date': 1 });
ServiceCalendarSchema.index({ 'services.season': 1 });

// Virtual for getting services by date range
ServiceCalendarSchema.methods.getServicesByDateRange = function(startDate, endDate) {
  return this.services.filter(service => {
    const serviceDate = new Date(service.date);
    return serviceDate >= startDate && serviceDate <= endDate;
  });
};

// Virtual for getting services by season
ServiceCalendarSchema.methods.getServicesBySeason = function(seasonId) {
  return this.services.filter(service => service.season === seasonId);
};

// Virtual for getting special days only
ServiceCalendarSchema.methods.getSpecialDays = function() {
  return this.services.filter(service => service.specialDay !== null);
};

// Static method to find or create year
ServiceCalendarSchema.statics.findOrCreate = async function(year) {
  let calendar = await this.findOne({ year });
  if (!calendar) {
    calendar = new this({ year, services: [] });
  }
  return calendar;
};

// Pre-save middleware to calculate metadata
ServiceCalendarSchema.pre('save', function(next) {
  if (this.services && this.services.length > 0) {
    this.metadata.totalServices = this.services.length;
    this.metadata.regularSundays = this.services.filter(s => s.isRegularSunday).length;
    this.metadata.specialWeekdays = this.services.filter(s => s.isSpecialWeekday).length;
    this.metadata.overriddenCount = this.services.filter(s => s.isOverridden).length;
  }
  next();
});

const ServiceCalendar = mongoose.models.ServiceCalendar || mongoose.model('ServiceCalendar', ServiceCalendarSchema);

export default ServiceCalendar;
