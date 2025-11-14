# Testing Strategy Guide

## Overview

ZionSync implements a comprehensive, multi-layered testing strategy designed to ensure reliability, performance, and liturgical accuracy across all system components. The testing approach prioritizes component stability, API reliability, and user workflow validation.

## Table of Contents

- [Testing Architecture](#testing-architecture)
- [Configuration & Setup](#configuration--setup)
- [Unit Testing Patterns](#unit-testing-patterns)
- [Integration Testing Approach](#integration-testing-approach)
- [API Testing Strategy](#api-testing-strategy)
- [End-to-End Testing](#end-to-end-testing)
- [Performance Testing](#performance-testing)
- [Mocking Strategies](#mocking-strategies)
- [Test Organization](#test-organization)
- [Running Tests](#running-tests)
- [Coverage & Quality Metrics](#coverage--quality-metrics)
- [Troubleshooting](#troubleshooting)

## Testing Architecture

### Testing Pyramid

ZionSync follows a well-balanced testing pyramid that emphasizes different types of tests:

```
┌─────────────────────────────────────────────────────────────┐
│                    Testing Pyramid                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐        E2E Tests                      │
│  │   Few, Slow     │    - Complete workflows              │
│  │   High Value    │    - Cross-team scenarios            │
│  └─────────────────┘    - User journey validation         │
│                                                             │
│  ┌─────────────────────────────┐   Integration Tests       │
│  │      Medium Volume          │   - API routes            │
│  │      Medium Speed           │   - Database operations   │
│  │      High Confidence        │   - Service coordination  │
│  └─────────────────────────────┘                           │
│                                                             │
│  ┌─────────────────────────────────────────┐  Unit Tests   │
│  │           High Volume                   │  - Components │
│  │           Fast Execution                │  - Functions  │
│  │           Immediate Feedback            │  - Algorithms │
│  └─────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

### Test Categories

1. **Unit Tests**: 70% - Fast, isolated component and function testing
2. **Integration Tests**: 20% - API routes, database operations, service coordination
3. **End-to-End Tests**: 10% - Complete user workflows and cross-team scenarios

## Configuration & Setup

### Jest Configuration

**File**: `jest.config.js`

```javascript
module.exports = {
  testEnvironment: "jest-environment-jsdom",
  transform: {
    "^.+\\.jsx?$": ["babel-jest", { configFile: "./babel.config.jest.json" }],
  },
  moduleFileExtensions: ["js", "jsx", "json"],
  testMatch: ["**/?(*.)+(spec|test).[jt]s?(x)"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    // Handle CSS imports (with CSS modules)
    "^.+\\.module\\.(css|sass|scss)$": "identity-obj-proxy",

    // Handle CSS imports (without CSS modules)
    "^.+\\.(css|sass|scss)$": "<rootDir>/__mocks__/styleMock.js",

    // Handle image imports
    "^.+\\.(jpg|jpeg|png|gif|webp|avif|svg)$":
      "<rootDir>/__mocks__/fileMock.js",

    // Handle module aliases
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};
```

### Babel Configuration

**File**: `babel.config.jest.json`

```json
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "targets": {
          "node": "current"
        }
      }
    ],
    "@babel/preset-react"
  ]
}
```

### Test Setup

**File**: `jest.setup.js`

```javascript
import "@testing-library/jest-dom";
```

### Dependencies

**Package.json** testing dependencies:

```json
{
  "devDependencies": {
    "@babel/core": "^7.26.10",
    "@babel/preset-env": "^7.26.9",
    "@babel/preset-react": "^7.26.3",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.3.0",
    "babel-jest": "^29.7.0",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0"
  }
}
```

## Unit Testing Patterns

### Component Testing

ZionSync uses React Testing Library for component testing with focus on user interactions and accessibility.

#### Basic Component Test Structure

```javascript
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { act } from "react";
import Component from "./Component";

describe("Component Name", () => {
  beforeEach(() => {
    // Reset mocks and state
    jest.clearAllMocks();
  });

  test("renders correctly with props", () => {
    render(<Component prop="value" />);
    expect(screen.getByText("Expected Text")).toBeInTheDocument();
  });

  test("handles user interactions", async () => {
    render(<Component onAction={mockAction} />);

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(mockAction).toHaveBeenCalled();
    });
  });
});
```

#### QuickAddModal Test Example

**File**: `src/components/ui/QuickAddModal.test.jsx`

```javascript
describe("QuickAddModal Component", () => {
  beforeEach(() => {
    fetch.mockClear();
    confirm.mockClear();

    // Mock successful responses for API calls
    fetch.mockImplementation((url) => {
      if (url.includes("/api/services/upcoming")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ services: mockUpcomingServices }),
        });
      }
      // Additional URL handlers...
    });
  });

  test("loads upcoming services on open", async () => {
    const mockSong = {
      _id: "song1",
      title: "Test Song",
      type: "hymn",
    };

    await act(async () => {
      render(
        <QuickAddModal isOpen={true} onClose={() => {}} song={mockSong} />,
      );
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/services/upcoming",
        expect.any(Object),
      );
    });

    const serviceElements = await screen.findAllByText("Sunday Service");
    expect(serviceElements.length).toBeGreaterThan(0);
  });
});
```

### Library Testing

Testing business logic and algorithms with comprehensive test cases.

#### SongSuggestionEngine Test Example

**File**: `src/lib/SongSuggestionEngine.test.js`

```javascript
describe("SongSuggestionEngine", () => {
  let engine;

  const mockSongs = [
    {
      _id: "song1",
      title: "Amazing Grace",
      type: "hymn",
      seasonalTags: ["Lent", "Easter"],
    },
    {
      _id: "song2",
      title: "How Great Thou Art",
      type: "hymn",
      seasonalTags: ["Pentecost", "Ordinary"],
    },
  ];

  const mockUsageData = {
    serviceSongs: [{ songTitle: "Amazing Grace", date: "2023-12-25" }],
    frequency: [
      { title: "Amazing Grace", count: 5, lastUsed: new Date("2023-12-25") },
    ],
  };

  beforeEach(() => {
    engine = new SongSuggestionEngine();
    getLiturgicalInfo.mockClear();
    getLiturgicalInfo.mockReturnValue({
      season: "Easter",
      color: "#FFFFFF",
      seasonName: "Easter",
    });

    // Mock internal methods if needed
    engine.balanceSongTypes = jest.fn((songs) => songs);
    engine.applyVarietyAlgorithm = jest.fn((songs) => songs);
  });

  test("returns unused songs first", async () => {
    const result = await engine.getSuggestions({
      allSongs: mockSongs,
      usageData: mockUsageData,
      type: "all",
      limit: 10,
    });

    expect(result.length).toBeGreaterThan(0);

    // Verify unused songs are prioritized
    const unusedSong = result.find((s) => s._id === "song2");
    expect(unusedSong).toBeDefined();
  });
});
```

### Liturgical Accuracy Testing

Critical testing for date calculations and seasonal determinations.

#### LiturgicalCalendarService Test Example

**File**: `src/lib/LiturgicalCalendarService.test.js`

```javascript
describe("LiturgicalCalendarService", () => {
  beforeEach(() => {
    clearCache();
  });

  describe("calculateEaster", () => {
    test("calculates Easter 2024 correctly (leap year)", () => {
      const easter2024 = calculateEaster(2024);
      expect(easter2024.getFullYear()).toBe(2024);
      expect(easter2024.getMonth()).toBe(2); // March
      expect(easter2024.getDate()).toBe(31); // March 31, 2024
    });

    test("calculates Easter 2025 correctly", () => {
      const easter2025 = calculateEaster(2025);
      expect(easter2025.getFullYear()).toBe(2025);
      expect(easter2025.getMonth()).toBe(3); // April
      expect(easter2025.getDate()).toBe(20); // April 20, 2025
    });
  });

  describe("getCurrentSeason", () => {
    test("identifies Advent correctly", () => {
      const date = new Date(2025, 11, 1); // December 1, 2025
      expect(getCurrentSeason(date)).toBe("ADVENT");
    });

    test("identifies Christmas correctly", () => {
      const date = new Date(2025, 11, 25); // December 25, 2025
      expect(getCurrentSeason(date)).toBe("CHRISTMAS");
    });
  });
});
```

## Integration Testing Approach

### Database Integration Testing

Tests that verify service integration with MongoDB operations.

#### LiturgicalCalendarService Integration Test

**File**: `src/lib/LiturgicalCalendarService.integration.test.js`

```javascript
// Service Details collection mock
const mockServiceDetailsCollection = {
  findOne: jest.fn(),
  updateOne: jest.fn(),
};

// Mock MongoDB client for integration testing
jest.mock("@/lib/mongodb", () => {
  const mockDb = {
    collection: jest.fn().mockImplementation((collectionName) => {
      if (collectionName === "serviceDetails") {
        return mockServiceDetailsCollection;
      }
      return {
        findOne: jest.fn(),
        updateOne: jest.fn(),
      };
    }),
  };

  const mockClient = {
    db: jest.fn().mockReturnValue(mockDb),
  };

  return {
    __esModule: true,
    default: Promise.resolve(mockClient),
    _mockClient: mockClient,
    _mockDb: mockDb,
  };
});

describe("LiturgicalCalendarService Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("enhances Christmas service with correct liturgical information", async () => {
    mockServiceDetailsCollection.findOne.mockResolvedValueOnce({
      date: "12/25/24",
      title: "Christmas Day Service",
      elements: [],
    });

    mockServiceDetailsCollection.updateOne.mockResolvedValueOnce({
      modifiedCount: 1,
    });

    const enhancedService = await enhanceServiceWithLiturgicalInfo("12/25/24");

    // Verify database queries
    expect(mockClient.db).toHaveBeenCalledWith("church");
    expect(mockDb.collection).toHaveBeenCalledWith("serviceDetails");

    // Verify liturgical enhancement
    expect(enhancedService).toHaveProperty("liturgical");
    expect(enhancedService.liturgical).toHaveProperty("season", "CHRISTMAS");
    expect(enhancedService.liturgical).toHaveProperty("color", "#D4AF37");
    expect(enhancedService.liturgical).toHaveProperty(
      "specialDay",
      "CHRISTMAS_DAY",
    );
  });
});
```

## API Testing Strategy

### Next.js Route Testing

Comprehensive testing of API endpoints with proper mocking and error handling.

#### API Route Test Pattern

**File**: `src/app/api/services/add-song/route.test.js`

```javascript
import { POST } from "./route";
import { NextResponse } from "next/server";

// Mock Next.js dependencies
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({ data, options })),
  },
}));

// MongoDB mock with factory function
jest.mock("@/lib/mongodb.js", () => {
  const mockDb = {
    collection: jest.fn().mockImplementation((collectionName) => {
      if (collectionName === "songs") {
        return {
          findOne: jest.fn().mockImplementation(({ _id }) => {
            if (_id === "123") {
              return Promise.resolve({
                _id: "123",
                title: "Amazing Grace",
                lyrics: "Amazing grace, how sweet the sound",
                type: "hymn",
              });
            }
            return Promise.resolve(null);
          }),
        };
      }
      // Additional collection handlers...
    }),
  };

  const mockClient = {
    db: jest.fn().mockReturnValue(mockDb),
  };

  return {
    __esModule: true,
    default: Promise.resolve(mockClient),
    _mockClient: mockClient,
    _mockDb: mockDb,
  };
});

// Console mocking for cleaner test output
jest.spyOn(console, "log").mockImplementation(() => {});
jest.spyOn(console, "error").mockImplementation(() => {});

describe("POST /api/services/add-song", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("adds a song to a service successfully", async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        songId: "123",
        serviceDate: "3/15/25",
        position: "opening",
        notes: "Play in G",
      }),
    };

    const response = await POST(mockRequest);

    // Verify database queries
    expect(mockClient.db).toHaveBeenCalledWith("church");
    expect(mockDb.collection).toHaveBeenCalledWith("songs");
    expect(mockDb.collection).toHaveBeenCalledWith("service_details");

    // Verify response
    expect(NextResponse.json).toHaveBeenCalled();
    expect(response).toBeDefined();
  });

  test("returns 400 when required fields are missing", async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        songId: "123",
        position: "opening",
        // Missing serviceDate
      }),
    };

    await POST(mockRequest);

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "Missing required fields" },
      { status: 400 },
    );
  });

  test("handles database errors gracefully", async () => {
    mockClient.db.mockImplementationOnce(() => {
      throw new Error("Database connection error");
    });

    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        songId: "123",
        serviceDate: "3/15/25",
        position: "opening",
      }),
    };

    await POST(mockRequest);

    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.any(String) }),
      { status: 500 },
    );
  });
});
```

### API Test Coverage

Current API test coverage includes:

- **Service Management**: `/api/services/add-song`, `/api/upcoming-services`
- **Song Operations**: `/api/songs/*`, `/api/reference-songs/import`
- **Usage Analytics**: `/api/song-usage/*`
- **Error Handling**: 400, 404, 500 status codes
- **Database Integration**: MongoDB operation validation

## End-to-End Testing

### Workflow Testing

Testing complete user journeys from start to finish.

#### Quick Add Workflow E2E Test

**File**: `src/tests/quickAddWorkflow.e2e.test.js`

```javascript
describe("Quick Add Workflow E2E Test", () => {
  const mockSongs = [
    {
      _id: "song1",
      title: "Amazing Grace",
      type: "hymn",
      seasonalTags: ["Lent", "Easter"],
      usageCount: 5,
      lastUsed: "2023-12-01",
    },
  ];

  beforeEach(() => {
    fetch.mockClear();
    confirm.mockClear();

    // Mock comprehensive API responses
    fetch.mockImplementation((url) => {
      if (url === "/api/songs") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ songs: mockSongs }),
        });
      }

      if (url === "/api/services/upcoming") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ services: mockUpcomingServices }),
        });
      }

      if (url.includes("quick-add")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      }
    });
  });

  test("complete quick add workflow from song discovery to service addition", async () => {
    // 1. Render SongRediscoveryPanel
    await act(async () => {
      render(<SongRediscoveryPanel />);
    });

    // 2. Verify songs are displayed
    expect(
      (await screen.findAllByText("Amazing Grace")).length,
    ).toBeGreaterThan(0);

    // 3. Render QuickAddModal for selected song
    const selectedSong = mockSongs[0];

    await act(async () => {
      render(
        <QuickAddModal isOpen={true} onClose={() => {}} song={selectedSong} />,
      );
    });

    // 4. Wait for modal and services to load
    await waitFor(() => {
      expect(
        screen.getByText(`Add "${selectedSong.title}" to a Service`),
      ).toBeInTheDocument();
    });

    // 5. Select a service
    const serviceCard = screen.getByText("Sunday Worship");

    await act(async () => {
      fireEvent.click(serviceCard);
    });

    // 6. Select an empty position
    const emptyPosition = await screen.findByText("Hymn of the Day");

    await act(async () => {
      fireEvent.click(emptyPosition);
    });

    // 7. Verify success
    await waitFor(() => {
      expect(screen.getByText("Song added successfully!")).toBeInTheDocument();
    });
  });
});
```

## Performance Testing

### Algorithm Performance Testing

Testing performance characteristics under various load conditions.

#### SongSuggestionEngine Performance Test

**File**: `src/lib/SongSuggestionEngine.performance.test.js`

```javascript
describe("SongSuggestionEngine Performance", () => {
  // Store performance measurements
  const measurements = {};

  // Helper to measure execution time
  const measurePerformance = async (name, fn) => {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    const duration = end - start;

    if (!measurements[name]) {
      measurements[name] = [];
    }
    measurements[name].push(duration);

    return { result, duration };
  };

  // Test with increasing song counts
  test.each([
    [100, 0.3], // 100 songs, 30% with usage data
    [500, 0.3], // 500 songs, 30% with usage data
    [1000, 0.3], // 1000 songs, 30% with usage data
    [2000, 0.3], // 2000 songs, 30% with usage data
  ])("scales with %i songs", async (songCount, usageFrequency) => {
    // Generate test data
    const songs = generateSongs(songCount);
    const usageData = generateUsageData(songs, usageFrequency);

    // Measure performance
    const { duration } = await measurePerformance(
      `scale-${songCount}`,
      async () => {
        return await songSuggestionEngine.getSuggestions({
          allSongs: songs,
          usageData,
          currentDate: new Date().toLocaleDateString("en-US"),
          seasonId: "Ordinary",
          type: "all",
          limit: 10,
          forceRefresh: true,
        });
      },
    );

    // Performance expectations
    expect(duration).toBeLessThan(1000); // Should complete in less than 1 second
  });

  // Test caching effectiveness
  test("caching mechanism improves performance", async () => {
    const songCount = 1000;
    const songs = generateSongs(songCount);
    const usageData = generateUsageData(songs, 0.3);

    // First call - cold cache
    const { duration: coldDuration } = await measurePerformance(
      "cache-cold",
      async () => {
        return await songSuggestionEngine.getSuggestions({
          allSongs: songs,
          usageData,
          type: "all",
          limit: 10,
          forceRefresh: true,
        });
      },
    );

    // Second call - warm cache
    const { duration: cachedDuration } = await measurePerformance(
      "cache-warm",
      async () => {
        return await songSuggestionEngine.getSuggestions({
          allSongs: songs,
          usageData,
          type: "all",
          limit: 10,
          forceRefresh: false,
        });
      },
    );

    // Cache should provide performance improvement
    expect(cachedDuration).toBeLessThanOrEqual(coldDuration);
  });

  // Output performance results
  afterAll(() => {
    console.log("\n--- 🚀 SongSuggestionEngine Performance Results ---");

    Object.entries(measurements).forEach(([name, durations]) => {
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      console.log(
        `${name}: ${avg.toFixed(2)}ms (average of ${durations.length} runs)`,
      );
    });
  });
});
```

### Performance Benchmarks

- **Song Suggestions**: < 1000ms for 2000+ songs
- **Liturgical Calculations**: < 100ms for any date
- **Database Queries**: < 500ms for typical operations
- **Component Rendering**: < 200ms for complex components

## Mocking Strategies

### Asset Mocking

**File**: `__mocks__/fileMock.js`

```javascript
module.exports = "test-file-stub";
```

**File**: `__mocks__/styleMock.js`

```javascript
module.exports = {};
```

### Icon Mocking

**File**: `__mocks__/lucide-react.js`

```javascript
const mockIcon = () => "IconSVG";

export const Search = mockIcon;
export const RefreshCw = mockIcon;
export const Music = mockIcon;
export const Calendar = mockIcon;
export const PlusCircle = mockIcon;
// ... additional icons

export default mockIcon;
```

### Global Mocks

```javascript
// Fetch API mocking
global.fetch = jest.fn();

// Confirm dialog mocking
global.confirm = jest.fn(() => true);

// Console suppression for cleaner test output
jest.spyOn(console, "log").mockImplementation(() => {});
jest.spyOn(console, "error").mockImplementation(() => {});
```

### MongoDB Mocking Pattern

```javascript
jest.mock("@/lib/mongodb", () => {
  const mockDb = {
    collection: jest.fn().mockImplementation((collectionName) => {
      // Collection-specific mocking logic
      return {
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([]),
        }),
        findOne: jest.fn().mockResolvedValue(null),
        updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
        insertOne: jest.fn().mockResolvedValue({ insertedId: "new123" }),
      };
    }),
  };

  const mockClient = {
    db: jest.fn().mockReturnValue(mockDb),
  };

  return {
    __esModule: true,
    default: Promise.resolve(mockClient),
    _mockClient: mockClient,
    _mockDb: mockDb,
  };
});
```

## Test Organization

### File Naming Convention

- **Unit Tests**: `Component.test.jsx`, `function.test.js`
- **Integration Tests**: `Service.integration.test.js`
- **Performance Tests**: `Algorithm.performance.test.js`
- **E2E Tests**: `workflow.e2e.test.js`

### Directory Structure

```
src/
├── components/
│   └── ui/
│       ├── Component.jsx
│       └── Component.test.jsx
├── lib/
│   ├── Service.js
│   ├── Service.test.js
│   ├── Service.integration.test.js
│   └── Service.performance.test.js
├── tests/
│   └── quickAddWorkflow.e2e.test.js
└── __mocks__/
    ├── fileMock.js
    ├── styleMock.js
    └── lucide-react.js
```

### Test Suite Organization

```javascript
describe("ComponentName", () => {
  // Setup and mocks
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    test("renders with default props", () => {});
    test("renders with custom props", () => {});
  });

  describe("user interactions", () => {
    test("handles click events", () => {});
    test("handles form submission", () => {});
  });

  describe("edge cases", () => {
    test("handles loading state", () => {});
    test("handles error state", () => {});
  });
});
```

## Running Tests

### Test Scripts

**Package.json** scripts:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false"
  }
}
```

### Command Line Usage

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- Component.test.jsx

# Run tests matching pattern
npm test -- --testNamePattern="should render"

# Run tests for specific directory
npm test -- src/components/

# Run tests with verbose output
npm test -- --verbose
```

### Test Execution Modes

#### Development Mode

```bash
# Interactive watch mode with file watching
npm run test:watch

# Single run with coverage
npm run test:coverage
```

#### CI/CD Mode

```bash
# Non-interactive mode for continuous integration
npm run test:ci
```

### Test Filtering

```bash
# Run only unit tests
npm test -- --testPathPattern="\\.test\\.(js|jsx)$"

# Run only integration tests
npm test -- --testPathPattern="\\.integration\\.test\\.(js|jsx)$"

# Run only performance tests
npm test -- --testPathPattern="\\.performance\\.test\\.(js|jsx)$"

# Run only E2E tests
npm test -- --testPathPattern="\\.e2e\\.test\\.(js|jsx)$"
```

## Coverage & Quality Metrics

### Coverage Targets

- **Overall Coverage**: > 85%
- **Function Coverage**: > 90%
- **Branch Coverage**: > 80%
- **Line Coverage**: > 85%

### Critical Path Coverage

**Require 100% coverage for:**

- Liturgical date calculations
- Song suggestion algorithms
- Database operations
- API error handling
- Authentication flows

### Coverage Configuration

```javascript
// jest.config.js coverage settings
module.exports = {
  collectCoverageFrom: [
    "src/**/*.{js,jsx}",
    "!src/**/*.test.{js,jsx}",
    "!src/**/*.stories.{js,jsx}",
    "!src/test-*.js",
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 90,
      lines: 85,
      statements: 85,
    },
    "./src/lib/": {
      branches: 90,
      functions: 95,
      lines: 90,
      statements: 90,
    },
  },
};
```

### Quality Gates

**Automated quality checks:**

- All tests must pass
- Coverage thresholds must be met
- No console errors in test output
- Performance benchmarks must be within limits
- Linting must pass without errors

## Troubleshooting

### Common Test Issues

#### Test Timeout Issues

```javascript
// Increase timeout for slow operations
test("slow operation", async () => {
  // Test implementation
}, 10000); // 10 second timeout

// Or configure globally
jest.setTimeout(10000);
```

#### Mock Issues

```javascript
// Clear mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});

// Reset modules if needed
beforeEach(() => {
  jest.resetModules();
});
```

#### Async Testing Issues

```javascript
// Proper async/await usage
test("async operation", async () => {
  const result = await asyncFunction();
  expect(result).toBe(expected);
});

// waitFor for DOM updates
await waitFor(() => {
  expect(screen.getByText("Updated text")).toBeInTheDocument();
});

// act wrapper for state updates
await act(async () => {
  fireEvent.click(button);
});
```

#### Memory Leaks

```javascript
// Proper cleanup in tests
afterEach(() => {
  cleanup();
  jest.clearAllTimers();
});

// Use fake timers for time-based tests
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});
```

### Debugging Tests

```bash
# Debug specific test
node --inspect-brk node_modules/.bin/jest --runInBand Component.test.js

# Run with debug output
npm test -- --verbose --no-cache

# Run single test file
npm test -- --testNamePattern="specific test name"
```

### Performance Debugging

```javascript
// Add performance measurements
const start = performance.now();
// ... test code
const end = performance.now();
console.log(`Test took ${end - start} milliseconds`);

// Profile memory usage
const memUsage = process.memoryUsage();
console.log("Memory usage:", memUsage);
```

### CI/CD Integration

```yaml
# Example GitHub Actions workflow
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: "18"
      - run: npm ci
      - run: npm run test:ci
      - uses: codecov/codecov-action@v1
```

## Best Practices

### Test Writing Guidelines

1. **Descriptive Test Names**: Tests should clearly describe what they're testing
2. **Single Responsibility**: Each test should test one specific behavior
3. **AAA Pattern**: Arrange, Act, Assert
4. **Independent Tests**: Tests should not depend on other tests
5. **Realistic Data**: Use realistic test data that matches production scenarios

### Performance Testing Guidelines

1. **Baseline Measurements**: Establish performance baselines for critical paths
2. **Load Testing**: Test with realistic data volumes
3. **Regression Detection**: Monitor for performance regressions
4. **Resource Management**: Test memory usage and cleanup

### Integration Testing Guidelines

1. **Real Scenarios**: Test realistic user scenarios
2. **Error Conditions**: Test both success and failure paths
3. **Data Integrity**: Verify data consistency across operations
4. **External Dependencies**: Mock external services appropriately

### Maintenance Guidelines

1. **Regular Updates**: Keep test dependencies updated
2. **Flaky Test Management**: Address flaky tests promptly
3. **Coverage Monitoring**: Monitor coverage trends over time
4. **Performance Monitoring**: Track test execution performance

---

_This testing strategy guide provides comprehensive coverage of ZionSync's testing approach. For specific implementation details, refer to the existing test files and the broader development documentation._
