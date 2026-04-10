jest.mock('../../src/services/vesselTrackerService');

const request = require('supertest');
const app = require('../../src/app');
const vesselTrackerService = require('../../src/services/vesselTrackerService');

describe('vessel routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── POST /api/vessels (placeholder) ───
  test('POST /api/vessels returns not yet implemented', async () => {
    const response = await request(app)
      .post('/api/vessels')
      .send({});

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Vessel creation not yet implemented');
  });

  // ─── GET /api/vessels (placeholder) ───
  test('GET /api/vessels returns empty array', async () => {
    const response = await request(app).get('/api/vessels');

    expect(response.status).toBe(200);
    expect(response.body.vessels).toEqual([]);
  });

  // ─── GET /api/vessels/zone ───
  test('returns vessels in a geographic zone', async () => {
    vesselTrackerService.getVesselsInZone.mockResolvedValue([
      { MMSI: '123456789', NAME: 'Test Vessel', LAT: 6.5, LON: 79.5, TYPE: 'Fishing', SPEED: 8 },
    ]);

    const response = await request(app)
      .get('/api/vessels/zone')
      .query({ minlat: '6.0', maxlat: '7.0', minlon: '79.0', maxlon: '80.0' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.count).toBe(1);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].NAME).toBe('Test Vessel');
  });

  test('returns 400 when bounding box coordinates are missing', async () => {
    const response = await request(app)
      .get('/api/vessels/zone')
      .query({ minlat: '6.0' }); // missing maxlat, minlon, maxlon

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/bounding box/);
  });

  test('returns 400 when coordinates are not numbers', async () => {
    const response = await request(app)
      .get('/api/vessels/zone')
      .query({ minlat: 'abc', maxlat: '7.0', minlon: '79.0', maxlon: '80.0' });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/valid numbers/);
  });

  test('returns 400 when latitude range is invalid', async () => {
    const response = await request(app)
      .get('/api/vessels/zone')
      .query({ minlat: '8.0', maxlat: '7.0', minlon: '79.0', maxlon: '80.0' }); // minlat > maxlat

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/latitude range/i);
  });

  test('returns 400 when longitude range is invalid', async () => {
    const response = await request(app)
      .get('/api/vessels/zone')
      .query({ minlat: '6.0', maxlat: '7.0', minlon: '80.0', maxlon: '79.0' }); // minlon > maxlon

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/longitude range/i);
  });

  test('returns 400 when minutesBack is out of range', async () => {
    const response = await request(app)
      .get('/api/vessels/zone')
      .query({ minlat: '6.0', maxlat: '7.0', minlon: '79.0', maxlon: '80.0', minutesBack: '0' });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/minutesBack/);
  });

  test('accepts optional minutesBack parameter', async () => {
    vesselTrackerService.getVesselsInZone.mockResolvedValue([]);

    const response = await request(app)
      .get('/api/vessels/zone')
      .query({ minlat: '6.0', maxlat: '7.0', minlon: '79.0', maxlon: '80.0', minutesBack: '30' });

    expect(response.status).toBe(200);
    expect(vesselTrackerService.getVesselsInZone).toHaveBeenCalledWith(6.0, 7.0, 79.0, 80.0, 30);
  });
});
