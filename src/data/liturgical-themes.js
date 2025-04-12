// Simplified Song Selection Guide by Season
// A resource to help worship teams select songs that match each liturgical season

// Main liturgical seasons data with colors
export const LITURGICAL_THEMES = {
    ADVENT: {
      name: "Advent",
      color: "#614080", // Purple
      description: "A season of hopeful waiting and preparation for Christ's birth. Songs should build anticipation and prepare hearts for Christmas."
    },
    CHRISTMAS: {
      name: "Christmas",
      color: "#FFFFFF", // White
      description: "Celebration of Christ's birth and God becoming human. Songs should express joy and wonder at the incarnation."
    },
    EPIPHANY: {
      name: "Epiphany",
      color: "#118AB2", // Blue
      description: "Christ revealed to all nations. Songs should focus on Jesus as light of the world and our response to his revelation."
    },
    LENT: {
      name: "Lent",
      color: "#7F0000", // Deep Red/Purple
      description: "A 40-day season of reflection before Easter. Songs should focus on God's mercy, our spiritual journey, and preparing for Easter."
    },
    HOLY_WEEK: {
      name: "Holy Week",
      color: "#000000", // Black
      description: "The final week before Easter. Songs should follow Jesus' journey from triumphant entry to crucifixion."
    },
    EASTER: {
      name: "Easter",
      color: "#FFD700", // Gold
      description: "A 50-day celebration of Christ's resurrection. Songs should express joy, victory, and the power of new life."
    },
    PENTECOST: {
      name: "Pentecost",
      color: "#FF4500", // Red
      description: "Celebrating the Holy Spirit's coming. Songs should focus on the Spirit's power, gifts, and the church's mission."
    },
    ORDINARY_TIME: {
      name: "Ordinary Time",
      color: "#228B22", // Green
      description: "The growing season between major festivals. Songs should focus on discipleship, everyday faith, and living out God's word."
    },
    UNKNOWN: {
      name: "Unknown Season",
      color: "#808080", // Gray
      description: "Season information not available."
    }
  };
  
  // Get the song themes for each season
  export function getSeasonThemes(seasonId) {
    switch(seasonId) {
      case 'ADVENT':
        return {
          primaryThemes: [
            "Waiting with hope for Christ's coming"
          ],
          secondaryThemes: [
            "Hope in darkness",
            "Preparing our hearts",
            "Longing for God's presence",
            "Peace, hope, joy, love"
          ],
          scriptureThemes: [
            { reference: "Isaiah 9:6-7" },
            { reference: "Matthew 1:18-25" },
            { reference: "Luke 1:26-38" }
          ]
        };
      
      case 'CHRISTMAS':
        return {
          primaryThemes: [
            "Jesus born as God-with-us"
          ],
          secondaryThemes: [
            "Light shining in darkness",
            "Joy at Christ's birth",
            "The gift of salvation",
            "Good news for all people"
          ],
          scriptureThemes: [
            { reference: "Luke 2:1-20" },
            { reference: "John 1:1-14" },
            { reference: "Matthew 2:1-12" }
          ]
        };
      
      case 'EPIPHANY':
        return {
          primaryThemes: [
            "Christ revealed to all nations"
          ],
          secondaryThemes: [
            "Light of Christ in the world",
            "Following God's guidance",
            "Jesus' baptism and identity",
            "Our call to share God's light"
          ],
          scriptureThemes: [
            { reference: "Matthew 2:1-12" },
            { reference: "Matthew 3:13-17" },
            { reference: "John 2:1-11" }
          ]
        };
      
      case 'LENT':
        return {
          primaryThemes: [
            "Repentance and spiritual renewal"
          ],
          secondaryThemes: [
            "God's mercy and forgiveness",
            "Honest self-reflection",
            "Wilderness and testing times",
            "Jesus' journey toward Jerusalem"
          ],
          scriptureThemes: [
            { reference: "Matthew 4:1-11" },
            { reference: "Psalm 51" },
            { reference: "Joel 2:12-14" }
          ]
        };
      
      case 'HOLY_WEEK':
        return {
          primaryThemes: [
            "Jesus' sacrificial love and path to the cross"
          ],
          secondaryThemes: [
            "Triumph and suffering",
            "Servant leadership",
            "Costly love",
            "Faithfulness in darkness"
          ],
          scriptureThemes: [
            { reference: "Mark 11:1-11" },
            { reference: "John 13:1-17" },
            { reference: "Luke 23:26-49" }
          ]
        };
      
      case 'EASTER':
        return {
          primaryThemes: [
            "Christ's victory over death and sin"
          ],
          secondaryThemes: [
            "New life and transformation",
            "Hope overcoming fear",
            "Jesus alive and present now",
            "God's power to save"
          ],
          scriptureThemes: [
            { reference: "Matthew 28:1-10" },
            { reference: "John 20:1-18" },
            { reference: "1 Cor 15:1-11" }
          ]
        };
      
      case 'PENTECOST':
        return {
          primaryThemes: [
            "The Holy Spirit empowering believers"
          ],
          secondaryThemes: [
            "God's presence with and in us",
            "The birth of the church",
            "Spiritual gifts for service",
            "Unity across differences"
          ],
          scriptureThemes: [
            { reference: "Acts 2:1-21" },
            { reference: "1 Cor 12:4-13" },
            { reference: "John 14:15-27" }
          ]
        };
      
      case 'ORDINARY_TIME':
        return {
          primaryThemes: [
            "Growing as disciples in everyday life"
          ],
          secondaryThemes: [
            "Living out our faith daily",
            "Building community",
            "Serving others as Jesus served",
            "Finding God in ordinary moments"
          ],
          scriptureThemes: [
            { reference: "Matthew 5-7" },
            { reference: "Romans 12:1-21" },
            { reference: "James 2:14-26" }
          ]
        };
      
      default:
        return {
          primaryThemes: ["Please select a season"],
          secondaryThemes: [],
          scriptureThemes: []
        };
    }
  }
  
  // Get song selection guidance for each season
  export function getMusicalGuidance(seasonId) {
    switch(seasonId) {
      case 'ADVENT':
        return {
          atmosphere: "Hopeful waiting that builds toward joy",
          keyElements: [
            "Songs about waiting, watching, and preparing",
            "Lyrics about hope and light coming into darkness",
            "Songs mentioning God's promises and faithfulness",
            "Traditional Advent songs like 'O Come, O Come Emmanuel'"
          ],
          caution: "Save Christmas songs for the Christmas season - focus on anticipation now"
        };
      
      case 'CHRISTMAS':
        return {
          atmosphere: "Joyful celebration of the incarnation",
          keyElements: [
            "Familiar Christmas carols everyone knows and loves",
            "Songs about the wonder of God becoming human",
            "Lyrics about light, angels, or good news",
            "Upbeat, celebratory songs with strong melodies"
          ],
          caution: "Look beyond just the manger scene to the meaning of incarnation"
        };
      
      case 'EPIPHANY':
        return {
          atmosphere: "Bright and revealing, with a focus on mission",
          keyElements: [
            "Songs about Jesus as the light of the world",
            "Music about following Jesus or responding to his call",
            "Songs mentioning all nations or peoples coming to God",
            "Lyrics connecting to baptism or Jesus' identity"
          ],
          caution: "This season has its own character - it's not just extended Christmas"
        };
      
      case 'LENT':
        return {
          atmosphere: "Reflective and honest, but not gloomy",
          keyElements: [
            "Songs about God's mercy and our need for grace",
            "Music with themes of returning to God",
            "Lyrics about spiritual journey or wilderness",
            "Quieter, more meditative songs"
          ],
          caution: "Include lyrics about God's grace - Lent isn't about feeling bad"
        };
      
      case 'HOLY_WEEK':
        return {
          atmosphere: "Solemn and moving toward the cross",
          keyElements: [
            "Palm Sunday: blend triumph with foreboding",
            "Maundy Thursday: focus on love, service, and communion",
            "Good Friday: emphasize Christ's sacrifice",
            "Songs that clearly tell the Holy Week story"
          ],
          caution: "Match your song's mood to the specific day in Holy Week"
        };
      
      case 'EASTER':
        return {
          atmosphere: "Triumphant joy and celebration",
          keyElements: [
            "Upbeat, victorious songs with strong choruses",
            "Songs with 'Alleluia' or that mention resurrection",
            "Lyrics about new life, transformation, or victory",
            "Classic Easter hymns everyone knows"
          ],
          caution: "Emphasize that Easter is about today, not just a historical event"
        };
      
      case 'PENTECOST':
        return {
          atmosphere: "Dynamic, empowering, and forward-looking",
          keyElements: [
            "Songs specifically about the Holy Spirit",
            "Music mentioning power, fire, wind, or spiritual gifts",
            "Songs about the church's mission in the world",
            "Lyrics about God's presence and power within us"
          ],
          caution: "Include both songs about spiritual power and spiritual fruit"
        };
      
      case 'ORDINARY_TIME':
        return {
          atmosphere: "Grounded faith for everyday life",
          keyElements: [
            "Songs connecting to weekly scripture readings",
            "Music about discipleship, growth, and following Jesus",
            "Lyrics that challenge us to live our faith",
            "A mix of familiar songs and newer selections"
          ],
          caution: "Vary your selections during this long season to prevent monotony"
        };
      
      default:
        return {
          atmosphere: "Please select a season",
          keyElements: [],
          caution: ""
        };
    }
  }
  
  // Get direct song examples and song types for each season
  export function getPracticalTips(seasonId) {
    switch(seasonId) {
      case 'ADVENT':
        return [
          "Examples: 'Come Thou Long Expected Jesus', 'O Come O Come Emmanuel', 'Waiting Here For You'",
          "Look for lyrics about: waiting, preparation, hope, promises, watchfulness",
          "Early Advent: more reflective, focus on waiting and longing",
          "Late Advent: more joyful, focus on anticipation and expectation"
        ];
      
      case 'CHRISTMAS':
        return [
          "Examples: 'Joy To The World', 'O Come All Ye Faithful', 'What Child Is This', 'Born Is The King'",
          "Look for lyrics about: incarnation, light, joy, angels, glory, good news",
          "Traditional carols work well alongside contemporary Christmas songs",
          "Songs that speak to the meaning of Jesus' birth, not just the nativity scene"
        ];
      
      case 'EPIPHANY':
        return [
          "Examples: 'We Three Kings', 'This Little Light of Mine', 'Shine Jesus Shine', 'Here I Am Lord'",
          "Look for lyrics about: light, revelation, following, mission, nations",
          "Songs about Jesus' baptism work well early in this season",
          "Songs about discipleship and following Jesus' call fit this season well"
        ];
      
      case 'LENT':
        return [
          "Examples: 'Lord I Need You', 'Create in Me a Clean Heart', 'Mercy', 'Broken Vessels'",
          "Look for lyrics about: mercy, renewal, return, wilderness, honesty, grace",
          "Songs that allow for reflection and personal examination",
          "Music that acknowledges struggles but points to God's grace"
        ];
      
      case 'HOLY_WEEK':
        return [
          "Palm Sunday: 'Hosanna', 'All Glory Laud and Honor', then shift to more somber songs",
          "Maundy Thursday: 'The Servant King', 'The Basin and the Towel', communion songs",
          "Good Friday: 'Were You There', 'O Sacred Head Now Wounded', 'How Deep the Father's Love'",
          "Songs that follow the narrative of Jesus' final week and focus on his sacrifice"
        ];
      
      case 'EASTER':
        return [
          "Examples: 'Christ the Lord Is Risen Today', 'Forever', 'Happy Day', 'Resurrecting'",
          "Look for lyrics about: resurrection, victory, new life, joy, salvation",
          "Songs with strong 'Alleluia' sections and triumphant choruses",
          "Music that connects Christ's resurrection to our own spiritual renewal"
        ];
      
      case 'PENTECOST':
        return [
          "Examples: 'Holy Spirit', 'Spirit of the Living God', 'Consuming Fire', 'Set a Fire'",
          "Look for lyrics about: Holy Spirit, fire, wind, power, gifts, unity, mission",
          "Songs that specifically mention the Spirit's presence and work",
          "Music that inspires action and moving out in mission"
        ];
      
      case 'ORDINARY_TIME':
        return [
          "Examples vary based on weekly themes - connect to scripture readings",
          "Look for lyrics about: discipleship, growth, service, community, daily faith",
          "A good balance of teaching songs and response/praise songs",
          "Songs that connect Sunday worship to everyday living"
        ];
      
      default:
        return [];
    }
  }
  
  export default { LITURGICAL_THEMES, getSeasonThemes, getMusicalGuidance, getPracticalTips };