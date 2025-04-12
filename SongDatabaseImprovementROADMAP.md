# ZionSync Song Database Improvement Roadmap

Rule 1: Use best coding practice. Don't make assumptions when offering solutions. Output investigative, powershell commands for the user to input into the terminal to discover relevant information. This may require several rounds to gain enough knowledge to proceed. NEVER guess or say maybe, might, probably in the same sentence as a code solution. INVESTIGATE FIRST, THEN CODE.
Rule 2: Don't take shortcuts when output changes to code. The user will apply code via VS Code editor.
Rule 3: Do not ouput investigative commands and code solutions in the same response. You need to the user to show the results of investigations before offering code solutions.
Rule 4: When providing code solutions, you MUST start each code block with an exact file path comment following this precise format: `// filepath: c:\Users\thegl\Desktop\Tech Projects\zionsync\path\to\file.jsx` or `<!-- filepath: c:\Users\thegl\Desktop\Tech Projects\zionsync\path\to\file.md -->` for markdown files. This ensures the "Apply to..." button appears instead of just "Apply in Editor". Code blocks without this specific filepath comment format are unusable. Format all code as properly structured markdown code blocks using four backticks. Make targeted changes to current files that allow direct application. Do not output whole files greater than 300 lines long!
Rule 5: Be Consistent! For instance, maintain consistent module system usage throughout the project. ZionSync uses ES Modules (ESM) as specified in package.json with "type": "module". Always use import/export syntax and include file extensions (.js) when importing local files.
Rule 6: Recognize that we are working on a few files within a much larger app. Be mindful in naming new files so that it is easy to understand what that file does in the grand scheme of the app.

## Project Vision and Objectives

### Core Problem Statement

Currently, the ZionSync song database lacks liturgical context and intelligent planning tools. Worship teams struggle with:
1. Finding season-appropriate songs for services
2. Avoiding excessive repetition while also intentionally repeating learning songs
3. Discovering forgotten songs in their repertoire
4. Quickly adding songs to upcoming services without disrupting their workflow
5. Accessing a comprehensive library of season-appropriate song possibilities beyond their current repertoire

### Key Objectives

This improvement project aims to:

1. **Integrate Liturgical Awareness**: Connect the song database with the church calendar so worship planning naturally aligns with the liturgical seasons.

2. **Enable Intelligent Song Rotation**: Help worship leaders balance familiarity (through intentional song repetition) with variety (by rediscovering unused songs).

3. **Streamline Song Selection**: Make it faster and easier to add songs to services with contextual awareness of the liturgical season and service needs.

4. **Provide Actionable Analytics**: Present usage data in meaningful ways that inform better worship planning decisions.

5. **Offer Seasonal Song Suggestions**: Provide a curated library of liturgically-appropriate songs for each season to expand the worship team's repertoire.

### Expected Outcomes

When completed, the ZionSync Song Database will offer:

1. **Season-Aware Interface**: All components will display liturgical season information with appropriate color coding, helping worship teams always know which season they're planning for.

2. **Rediscovery Panel**: A dynamic panel showing season-appropriate songs that haven't been used recently, giving worship teams fresh ideas.

3. **Quick Add System**: One-click functionality to add any song to upcoming services, with clear visibility into available slots.

4. **Smart Song Rotation**: Visual indicators showing which songs are currently "in learning" phase and being intentionally repeated.

5. **Enhanced Analytics**: Season-specific usage data showing patterns in song selection across the church year.

6. **Seasonal Song Library**: A comprehensive collection of traditional and contemporary song recommendations organized by liturgical season.

7. **Seasonal Planning Guide**: Context-aware suggestions that provide liturgical background and appropriate song choices for each season.

## Implementation Plan

## 1. Liturgical Calendar Integration
- ✅ **Create LiturgicalCalendarService.js utility**
  - ✅ Implement algorithm-based season calculation for any year `src/lib/LiturgicalCalendarService.js` - *Create algorithm that works for any year, not just the current calendar*
  - ✅ Implement `getCurrentSeason(date)` function `src/lib/LiturgicalCalendarService.js` - *Returns one of 8 primary seasons for any given date*
  - ✅ Implement `getSeasonColor(date)` function `src/lib/LiturgicalCalendarService.js` - *Returns the appropriate color hex code for UI styling*
  - ✅ Add major feast day detection for any year `src/lib/LiturgicalCalendarService.js` - *Identifies special days like Christmas, Easter, Reformation, etc.*
  - ✅ Write unit tests to verify correct season detection `src/lib/LiturgicalCalendarService.test.js` - *Test various dates across years to ensure accuracy*
  
- ✅ **Add season data to service records**
  - ✅ Update service creation/editing to include liturgical season `src/app/api/services/route.js` - *Automatically detect and store season for each service*
  - ✅ Modify existing API endpoints to include season info `src/app/api/service-songs/route.js` - *Return season data with service information*
  - ✅ Create migration script for adding seasons to existing services `src/scripts/add-season-to-services.js` - *Retroactively add season info to past services*

- ✅ **Add liturgical UI elements**
  - ✅ Create color-coded indicators for services based on season `src/components/ui/WorshipTeam.jsx` - *Visual cues showing season in service headers*
  - ✅ Add season name display in relevant components `src/components/ui/ServiceCard.jsx` - *Show season name in service cards*
  - ✅ Create season-themed background subtle effects `src/styles/liturgical-themes.css` - *Custom CSS classes for seasonal styling*

- ✅ **Fix liturgical season display issues**
  - ✅ Update `LiturgicalCalendarService.js` to correctly handle special days `src/lib/LiturgicalCalendarService.js` - *Fixed handling of Ash Wednesday & Easter*
  - ✅ Add Transfiguration Sunday detection and handling `src/lib/LiturgicalCalendarService.js` - *Properly categorize as part of Epiphany season*
  - ✅ Update styling in `LiturgicalStyling.jsx` to apply correct classes `src/components/liturgical/LiturgicalStyling.jsx` - *Ensure UI correctly reflects season*
  - ✅ Create database update script to fix any incorrect season data `src/scripts/fix-liturgical-seasons.js` - *Update all services with correct season information*

## 2. Song Categorization System
- ✅ **Add seasonal tags to song schema**
  - Update songs collection schema to include season appropriateness `src/app/api/songs/route.js` - *Add array of season tags to song documents*
  - Add UI for editing seasonal appropriateness in song editor `src/components/ui/SongDatabase.jsx` - *Allow manual tagging of songs for specific seasons*
  - Create batch tagging tool for existing songs `src/components/ui/SeasonalTaggingTool.jsx` - *Bulk update tool for adding season tags*

- ✅ **Add song repetition tracking**
  - Track consecutive usage of songs `src/app/api/song-usage/route.js` - *Record when songs are used in consecutive services*
  - Identify "learning" songs (used 2+ consecutive services) `src/lib/SongUsageAnalyzer.js` - *Logic to flag songs in learning phase*
  - Create "in rotation" status for frequently used songs `src/components/ui/SongDatabase.jsx` - *Visual indicator for songs in active rotation*

- ✅ **Import seasonal song reference database**
  - ✅ Create data model for reference songs `src/models/ReferenceSong.js` - *Define schema for external song recommendations*
  - ✅ Import curated seasonal song lists `src/scripts/import-seasonal-songs.js` - *Script to import recommendations from markdown files*
  - ✅ Add tagging system to distinguish reference songs from church library `src/lib/SongTaggingService.js` - *Clear separation between library and reference songs*
  - ✅ Create matching algorithm to link reference songs to existing library `src/app/api/reference-songs/import/route.js` - *Identify when a suggested song already exists in library*

## 3. Song Rediscovery Panel
- [✅] **Create basic rediscovery component**
  - [✅] Design UI for rediscovery panel `src/components/ui/SongRediscoveryPanel.jsx` - *Panel showing forgotten/unused songs*
  - [✅] Implement random song selection logic `src/lib/SongSuggestionEngine.js` - *Algorithm for suggesting varied song options*
  - [✅] Add filtering by unused timeframe `src/app/api/song-usage/suggestions/route.js` - *Find songs not used in 6+ months*
  
- [✅] **Add seasonal awareness**
  - [✅] Filter suggestions based on current liturgical season `src/lib/SongSuggestionEngine.js` - *Match song suggestions to current/upcoming season*
  - [✅] Add visual indicators for season appropriateness `src/components/ui/SongRediscoveryPanel.jsx` - *Show how well a song fits the current season*
  - [✅] Implement "variety" algorithm to avoid same suggestions `src/lib/SongSuggestionEngine.js` - *Ensure diverse song suggestions*
  - [✅] Add enhanced seasonal time windows `src/lib/SongSuggestionEngine.js` - *Use yearly liturgical cycle for seasonal songs*
  - [✅] Implement upcoming season detection `src/lib/SongSuggestionEngine.js` - *Show songs for approaching liturgical seasons*
  - [✅] Add service integration for rediscovered songs `src/app/api/services/add-song/route.js` - *Endpoint for adding songs to services*

- [✅] **Create seasonal song suggestions tab**
  - [✅] Design tabbed interface for rediscovery panel `src/components/ui/ReferenceSongPanel.jsx` - *UI for browsing reference songs by season and type*
  - [✅] Implement filtering system for reference songs `src/components/ui/ReferenceSongPanel.jsx` - *Add search, season and type filters*
  - [✅] Add song preview functionality `src/components/ui/ReferenceSongPanel.jsx` - *Display song details with type indicators*
  - [✅] Create import capability for reference songs `src/app/api/reference-songs/import/route.js` - *Enable adding reference songs to services while checking library*
  - [✅] Add UI for selecting services and positions `src/components/ui/ReferenceSongPanel.jsx` - *Clear interface for choosing where to add songs*
  - [✅] Implement library integration for reference songs `src/app/api/reference-songs/import/route.js` - *Check if song exists in library before adding*
  - [✅] Add song usage tracking for imported songs `src/app/api/reference-songs/import/route.js` - *Update usage tracking when using reference songs*

- [HOLD FOR NOW] **Add special service preparation tab**
  - Design special service tab interface `src/components/ui/SpecialServiceTab.jsx` - *Create tab alongside seasonal suggestions*
  - Implement special service detection logic `src/lib/SpecialServiceDetector.js` - *Detect approaching special days*
  - Create countdown indicators for approaching services `src/components/ui/SpecialServiceCountdown.jsx` - *Visual timeline*
  - Add special day song recommendations `src/data/special-service-songs.js` - *Define song databases for special services*
  - Implement liturgical role categorization `src/components/ui/SpecialServiceSongList.jsx` - *Group songs by function*
  - Create print/export capabilities for planning `src/components/ui/SpecialServiceExport.jsx` - *Generate planning sheets*

- [✅] **Implement Quick Add button functionality**
  - [✅] Design Quick Add button UI `src/components/ui/ReferenceSongPanel.jsx` - *One-click button for song addition*
  - [✅] Create modal for service selection `src/components/ui/ReferenceSongPanel.jsx` - *Modal showing upcoming services*
  - [✅] Add song slot selection interface `src/components/ui/ReferenceSongPanel.jsx` - *UI for selecting which slot to add song to*
  - [✅] Implement service integration in SongRediscoveryPanel `src/components/ui/SongRediscoveryPanel.jsx` - *Add songs to services from rediscovery panel*

## 4. Seasonal Planning Guide
- [✅] **Create seasonal planning component**
  - [✅] Design collapsible guide panel `src/components/ui/SeasonalPlanningGuide.jsx` - *Context-aware panel with theological guidance*
  - [✅] Add rich liturgical content `src/data/liturgical-themes.js` - *Detailed theological descriptions and scriptural themes*
  - [✅] Implement season-specific worship planning tips `src/components/ui/SeasonalPlanningGuide.jsx` - *Practical liturgical guidance integrated directly*

- [✅] **Create planning resources**
  - [✅] Develop service structure recommendations `src/data/liturgical-themes.js` - *Templates integrated with season data*
  - [✅] Create worship atmosphere guidance `src/components/ui/SeasonalPlanningGuide.jsx` - *Tips on creating appropriate seasonal feel*
  - [✅] Add scripture selection suggestions `src/data/liturgical-themes.js` - *Recommended readings for each season*

- [✅] **Add educational elements**
  - [✅] Create theological background component `src/components/ui/SeasonalPlanningGuide.jsx` - *Educational content about each season*
  - [✅] Add historical context section `src/data/liturgical-themes.js` - *Background on the development of each season*
  - [✅] Implement clean UI design with simplified layout `src/components/ui/SeasonalPlanningGuide.jsx` - *Well-organized planning guide with proper information hierarchy*

## 5. Quick Add Modal Implementation
- [✅] **Create service selection interface**
  - [✅] Design modal layout showing upcoming services `src/components/ui/ReferenceSongPanel.jsx` - *Shows services with dates and types*
  - [✅] Add liturgical season color coding for services `src/components/ui/ReferenceSongPanel.jsx` - *Color-code services by season*
  - [✅] Show upcoming service dates with types `src/app/api/services/upcoming/route.js` - *API endpoint to fetch upcoming services*
  
- [✅] **Implement song slot visualization**
  - [✅] Display current song selections for each service `src/components/ui/ReferenceSongPanel.jsx` - *Show existing songs in each slot*
  - [✅] Highlight empty slots available for new songs `src/components/ui/ReferenceSongPanel.jsx` - *Visually emphasize open slots*
  - [✅] Add replace functionality for filled slots `src/components/ui/SongRediscoveryPanel.jsx` - *Allow replacing existing songs*
  
- [✅] **Add service interaction functionality**
  - [✅] Implement song addition to selected service `src/app/api/service-songs/quick-add/route.js` - *Backend endpoint for adding song to service*
  - [✅] Add confirmation for song replacement `src/components/ui/ReferenceSongPanel.jsx` - *Confirmation dialog for replacing songs*
  - [✅] Create success/error feedback system `src/components/ui/ReferenceSongPanel.jsx` - *Visual feedback on add/replace actions*

## 6. Integration Points
- [✅] **Add Quick Add button to Song Library**
  - [✅] Add button to song detail view `src/components/ui/SongDatabase.jsx` - *Add button in song details panel*
  - [✅] Connect to Quick Add modal `src/components/ui/SongDatabase.jsx` - *Link button to open Quick Add modal*
  - [✅] Handle song data passing `src/components/ui/SongDatabase.jsx` - *Pass selected song data to modal*

- [✅] **Connect to WorshipTeam.jsx**
  - [✅] Share liturgical season data `src/components/ui/WorshipTeam.jsx` - *Ensure consistency in season display*
  - [✅] Update service header styling `src/components/ui/WorshipTeam.jsx` - *Apply seasonal colors to headers*
  - [✅] Ensure consistent color schemes `src/components/ui/ServiceSongSelector.jsx` - *Maintain visual consistency*

- [✅] **Update SongSection.jsx**
  - [✅] Add season indicators to song selection `src/components/ui/SongSection.jsx` - *Show season appropriateness while selecting songs*
  - [✅] Connect to rediscovery suggestions `src/components/ui/SongSection.jsx` - *Link to rediscovery panel*
  - [✅] Implement song rotation indicators `src/components/ui/SongSection.jsx` - *Show whether songs are in learning phase*
  - [✅] Add seasonal suggestion integration `src/components/ui/SongSection.jsx` - *Make seasonal song suggestions accessible during song selection*

## 7. Analytics Enhancements
DISCONTINUED

## 8. Testing & Refinement
- ✅ **Comprehensive testing**
  - ✅ Test liturgical season detection with edge cases `src/lib/LiturgicalCalendarService.test.js` - *Test boundary dates between seasons*
  - ✅ Fix issues with Transfiguration, Ash Wednesday and Easter seasons `src/lib/LiturgicalCalendarService.js` - *Correct season detection for key dates*
  - ✅ Verify seasonal color styling for all major feasts `src/styles/liturgical-themes.css` - *Ensure all special days have appropriate styling*
  - ✅ Create database migration script to correct any season issues `src/scripts/fix-liturgical-seasons.js` - *Update all services with corrected season info*
  - ✅ Verify Quick Add functionality `src/components/ui/QuickAddModal.test.jsx` - *Test service selection and song addition*
  - ✅ Test rediscovery suggestions `src/lib/SongSuggestionEngine.test.js` - *Verify song suggestion algorithm*
  - ✅ Validate seasonal song recommendations `src/lib/SongSuggestionEngine.test.js` - *Test seasonal song filtering and suggestion logic*
  - ✅ Test upcoming services API `src/app/api/upcoming-services/route.test.js` - *Verify API returns properly formatted upcoming services*
  - ✅ Test add song to service API `src/app/api/services/add-song/route.test.js` - *Verify API correctly adds songs to services*
  - ✅ Test reference song import API `src/app/api/reference-songs/import/route.test.js` - *Verify API properly imports reference songs*
  - ✅ Create LiturgicalCalendarService integration test `src/lib/LiturgicalCalendarService.integration.test.js` - *Test season data integration with database records*
  - ✅ Test SongSuggestionEngine performance `src/lib/SongSuggestionEngine.performance.test.js` - *Verify engine performs well with large datasets*
  - ✅ Add end-to-end test for Quick Add workflow `src/tests/quickAddWorkflow.e2e.test.js` - *Test the complete song discovery to service addition flow*

- [ ] **Performance optimization**
  - ✅ Add caching for liturgical calendar data `src/lib/LiturgicalCalendarService.js` - *Cache season calculations*
  - [ ] Ensure responsive performance on mobile `src/components/ui/SongDatabase.jsx` - *Test and optimize mobile UI*
  - [ ] Implement lazy loading for reference song data `src/components/ui/SongRediscoveryPanel.jsx` - *Load seasonal suggestions only when tab is active*

- [ ] **User experience refinement**
  - ✅ Fix liturgical season display issues for special days `src/lib/LiturgicalCalendarService.js` - *Correct season calculation for special days like Transfiguration*
  - [ ] Gather worship team feedback `(user testing document)` - *Collect feedback from actual users*
  - [ ] Make UI adjustments based on usage patterns `src/components/ui/SongDatabase.jsx` - *Refine based on feedback*
  - [ ] Create onboarding guidance for new features `src/components/ui/OnboardingGuide.jsx` - *Help documentation for users*
  - [ ] Add progressive disclosure for seasonal features `src/components/ui/ProgressiveDisclosure.jsx` - *Gradually introduce features to avoid overwhelming users*