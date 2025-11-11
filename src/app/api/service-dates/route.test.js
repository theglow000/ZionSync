/**
 * Tests for Service Dates Bridge API (Sprint 4.2)
 * Tests the endpoint that bridges serviceCalendar to components
 */

import { GET } from './route';
import { NextRequest } from 'next/server';
import clientPromise from '@/lib/mongodb';

// Mock dependencies
jest.mock('@/lib/mongodb');

describe('Service Dates Bridge API', () => {
  let mockDb;
  let mockCollection;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockCollection = {
      findOne: jest.fn(),
    };
    
    mockDb = {
      collection: jest.fn(() => mockCollection),
    };
    
    clientPromise.mockResolvedValue({
      db: jest.fn(() => mockDb),
    });
  });

  describe('GET /api/service-dates', () => {
    test('returns services for valid year', async () => {
      const mockServices = [
        {
          date: '1/5/25',
          title: 'Epiphany Sunday',
          type: 'communion',
          liturgical: {
            season: 'epiphany',
            seasonName: 'Epiphany',
            color: '#FFD700',
            isSpecialDay: false
          },
          active: true
        },
        {
          date: '1/12/25',
          title: 'Second Sunday after Epiphany',
          type: 'communion',
          liturgical: {
            season: 'epiphany',
            seasonName: 'Epiphany',
            color: '#FFD700',
            isSpecialDay: false
          },
          active: true
        }
      ];

      mockCollection.findOne.mockResolvedValue({
        year: 2025,
        services: mockServices,
        generated: new Date(),
      });

      const request = new NextRequest('http://localhost:3000/api/service-dates?year=2025');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(2);
      expect(data[0].date).toBe('1/5/25');
      expect(data[0].liturgical.season).toBe('epiphany');
    });

    test('filters for upcoming services only when upcomingOnly=true', async () => {
      const today = new Date();
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + 7);
      
      const pastDate = new Date(today);
      pastDate.setDate(today.getDate() - 7);

      const mockServices = [
        {
          date: `${pastDate.getMonth() + 1}/${pastDate.getDate()}/${pastDate.getFullYear() % 100}`,
          title: 'Past Service',
          active: true
        },
        {
          date: `${futureDate.getMonth() + 1}/${futureDate.getDate()}/${futureDate.getFullYear() % 100}`,
          title: 'Future Service',
          active: true
        }
      ];

      mockCollection.findOne.mockResolvedValue({
        year: today.getFullYear(),
        services: mockServices,
      });

      const request = new NextRequest(`http://localhost:3000/api/service-dates?year=${today.getFullYear()}&upcomingOnly=true`);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.length).toBeGreaterThan(0);
      // Should only include future service
      expect(data.every(service => service.title === 'Future Service' || service.title !== 'Past Service')).toBe(true);
    });

    test('returns 400 for missing year parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/service-dates');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid year parameter');
    });

    test('returns 400 for year out of range', async () => {
      const request = new NextRequest('http://localhost:3000/api/service-dates?year=2023');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('between 2024 and 2100');
    });

    test('returns 400 for year above maximum', async () => {
      const request = new NextRequest('http://localhost:3000/api/service-dates?year=2101');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('between 2024 and 2100');
    });

    test('returns 404 when year not generated yet', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/service-dates?year=2030');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('have not been generated yet');
      expect(data.message).toContain('Calendar Manager');
      expect(data.year).toBe(2030);
    });

    test('returns all services when upcomingOnly=false', async () => {
      const mockServices = [
        { date: '1/5/25', title: 'Service 1', active: true },
        { date: '1/12/25', title: 'Service 2', active: true },
        { date: '1/19/25', title: 'Service 3', active: true },
      ];

      mockCollection.findOne.mockResolvedValue({
        year: 2025,
        services: mockServices,
      });

      const request = new NextRequest('http://localhost:3000/api/service-dates?year=2025&upcomingOnly=false');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(3);
    });

    test('filters out inactive services by default', async () => {
      const mockServices = [
        { date: '1/5/25', title: 'Active', active: true },
        { date: '1/12/25', title: 'Inactive', active: false },
        { date: '1/19/25', title: 'Active 2', active: true },
      ];

      mockCollection.findOne.mockResolvedValue({
        year: 2025,
        services: mockServices,
      });

      const request = new NextRequest('http://localhost:3000/api/service-dates?year=2025');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(2);
      expect(data.every(s => s.active === true)).toBe(true);
    });

    test('preserves liturgical metadata', async () => {
      const mockServices = [{
        date: '4/20/25',
        title: 'Easter Sunday',
        type: 'communion',
        liturgical: {
          season: 'easter',
          seasonName: 'Easter',
          color: '#FFFFFF',
          isSpecialDay: true,
          specialDayName: 'Easter Sunday'
        },
        active: true
      }];

      mockCollection.findOne.mockResolvedValue({
        year: 2025,
        services: mockServices,
      });

      const request = new NextRequest('http://localhost:3000/api/service-dates?year=2025');
      const response = await GET(request);
      const data = await response.json();

      expect(data[0].liturgical).toBeDefined();
      expect(data[0].liturgical.season).toBe('easter');
      expect(data[0].liturgical.isSpecialDay).toBe(true);
      expect(data[0].liturgical.specialDayName).toBe('Easter Sunday');
    });

    test('handles multi-year calendars correctly', async () => {
      // Test that each year is fetched independently
      mockCollection.findOne
        .mockResolvedValueOnce({
          year: 2025,
          services: [{ date: '12/28/25', title: '2025 Service', active: true }]
        })
        .mockResolvedValueOnce({
          year: 2026,
          services: [{ date: '1/4/26', title: '2026 Service', active: true }]
        });

      const request2025 = new NextRequest('http://localhost:3000/api/service-dates?year=2025');
      const response2025 = await GET(request2025);
      const data2025 = await response2025.json();

      const request2026 = new NextRequest('http://localhost:3000/api/service-dates?year=2026');
      const response2026 = await GET(request2026);
      const data2026 = await response2026.json();

      expect(data2025[0].title).toContain('2025');
      expect(data2026[0].title).toContain('2026');
    });
  });

  describe('Critical: Does NOT modify serviceDetails', () => {
    test('only reads from serviceCalendar collection', async () => {
      mockCollection.findOne.mockResolvedValue({
        year: 2025,
        services: [{ date: '1/5/25', title: 'Test', active: true }]
      });

      const request = new NextRequest('http://localhost:3000/api/service-dates?year=2025');
      await GET(request);

      // Verify we only called serviceCalendar collection
      expect(mockDb.collection).toHaveBeenCalledWith('serviceCalendar');
      expect(mockDb.collection).not.toHaveBeenCalledWith('serviceDetails');
    });

    test('does not modify any database collections', async () => {
      mockCollection.findOne.mockResolvedValue({
        year: 2025,
        services: [{ date: '1/5/25', title: 'Test', active: true }]
      });

      const request = new NextRequest('http://localhost:3000/api/service-dates?year=2025');
      await GET(request);

      // Verify no write operations were called
      expect(mockCollection.insertOne).not.toHaveBeenCalled();
      expect(mockCollection.updateOne).not.toHaveBeenCalled();
      expect(mockCollection.deleteOne).not.toHaveBeenCalled();
      expect(mockCollection.replaceOne).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    test('handles database errors gracefully', async () => {
      clientPromise.mockRejectedValue(new Error('DB connection failed'));

      const request = new NextRequest('http://localhost:3000/api/service-dates?year=2025');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });

    test('handles malformed year parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/service-dates?year=abc');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid year');
    });
  });
});
