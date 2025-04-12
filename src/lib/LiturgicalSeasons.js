/**
 * Liturgical Seasons and Colors for ZionSync
 * Contains definitions for the church year seasons and their colors
 */

// Primary Seasons with Colors
export const LITURGICAL_SEASONS = {
  ADVENT: { name: "Advent", color: "#5D3FD3" }, // Purple/Blue
  CHRISTMAS: { name: "Christmas", color: "#D4AF37" }, // Gold
  EPIPHANY: { name: "Epiphany", color: "#008080" }, // Teal
  LENT: { name: "Lent", color: "#800020" }, // Purple
  HOLY_WEEK: { name: "Holy Week", color: "#8B0000" }, // Scarlet
  EASTER: { name: "Easter", color: "#FFF0AA" }, // Gold/White
  PENTECOST_DAY: { name: "Day of Pentecost", color: "#FF3131" }, // Red
  TRINITY: { name: "Holy Trinity", color: "#FFFFFF" }, // White
  ORDINARY_TIME: { name: "Ordinary Time", color: "#556B2F" }, // Green
  REFORMATION: { name: "Reformation", color: "#FF0000" }, // Red
  ALL_SAINTS: { name: "All Saints", color: "#FFFFFF" }, // White
  CHRIST_KING: { name: "Christ the King", color: "#FFFFFF" }, // White
  UNKNOWN: { name: "Ordinary Time", color: "#888888" } // Default fallback
};

// Special feast days that appear in the calendar
export const MAJOR_FEAST_DAYS = {
  CHRISTMAS_EVE: { 
    name: "Christmas Eve", 
    color: "#D4AF37",
    description: "hope, peace, joy, and the anticipation of Christ's birth"
  },
  CHRISTMAS_DAY: { 
    name: "Christmas Day", 
    color: "#D4AF37",
    description: "celebration, joy, and the incarnation of Christ"
  },
  EPIPHANY_DAY: { 
    name: "Feast of the Epiphany", 
    color: "#008080",
    description: "revelation, light, and the manifestation of Christ to the Gentiles"
  },
  TRANSFIGURATION: { 
    name: "Transfiguration of Our Lord", 
    color: "#FFFFFF",
    description: "the revelation of Christ's divine glory before the Passion"
  },
  ASH_WEDNESDAY: { 
    name: "Ash Wednesday", 
    color: "#800020",
    description: "repentance, mortality, and the beginning of Lent"
  },
  PALM_SUNDAY: { 
    name: "Palm Sunday", 
    color: "#8B0000",
    description: "Christ's triumphal entry and the beginning of Holy Week"
  },
  MAUNDY_THURSDAY: { 
    name: "Maundy Thursday", 
    color: "#8B0000",
    description: "service, communion, and Christ's last supper"
  },
  GOOD_FRIDAY: { 
    name: "Good Friday", 
    color: "#000000",
    description: "Christ's sacrifice, suffering, and death on the cross"
  },
  EASTER_SUNDAY: { 
    name: "Easter Sunday", 
    color: "#FFF0AA",
    description: "resurrection, victory, and new life in Christ"
  },
  ASCENSION: { 
    name: "Ascension of Our Lord", 
    color: "#FFFFFF",
    description: "Christ's return to heaven and his continuing presence"
  },
  PENTECOST: { 
    name: "Day of Pentecost", 
    color: "#FF3131",
    description: "the Holy Spirit, the birth of the church, and spiritual gifts"
  },
  TRINITY_SUNDAY: { 
    name: "Holy Trinity", 
    color: "#FFFFFF",
    description: "the mystery of the Trinity and God's three-fold nature"
  },
  REFORMATION: { 
    name: "Reformation Sunday", 
    color: "#FF0000",
    description: "scripture, grace, faith, and Lutheran heritage"
  },
  ALL_SAINTS: { 
    name: "All Saints Day", 
    color: "#FFFFFF",
    description: "remembrance, the communion of saints, and the faithful departed"
  },
  CHRIST_KING: { 
    name: "Christ the King", 
    color: "#FFFFFF",
    description: "Christ's sovereignty, kingship, and the fulfillment of God's kingdom"
  },
  THANKSGIVING: {
    name: "Thanksgiving",
    color: "#556B2F",
    description: "gratitude, harvest, and God's providential care"
  }
};

// CSS Classes for seasons to be used in components
export const SEASON_CSS_CLASSES = {
  ADVENT: "season-advent",
  CHRISTMAS: "season-christmas",
  EPIPHANY: "season-epiphany",
  LENT: "season-lent",
  HOLY_WEEK: "season-holy_week", // Changed to use underscore for consistency
  EASTER: "season-easter",
  PENTECOST_DAY: "season-pentecost_day", // Updated for consistency
  TRINITY: "season-trinity",
  ORDINARY_TIME: "season-ordinary_time", // Changed to use underscore for consistency
  REFORMATION: "season-reformation",
  ALL_SAINTS: "season-all_saints", // Changed to use underscore for consistency
  CHRIST_KING: "season-christ_king", // Changed to use underscore for consistency
  UNKNOWN: "season-unknown"
};

// Helper function to get a season by its name
export function getSeasonByName(name) {
  return Object.values(LITURGICAL_SEASONS).find(season => 
    season.name.toLowerCase() === name.toLowerCase()
  );
}

// Helper function to get a feast day by its name
export function getFeastDayByName(name) {
  return Object.values(MAJOR_FEAST_DAYS).find(feast => 
    feast.name.toLowerCase() === name.toLowerCase()
  );
}