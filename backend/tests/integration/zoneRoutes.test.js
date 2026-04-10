jest.mock('../../src/models/User');
jest.mock('../../src/services/zoneService');

const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');
const zoneService = require('../../src/services/zoneService');

const adminToken = () => jwt.sign({ id: 'admin-1' }, process.env.JWT_SECRET);
const fisherToken = () => jwt.sign({ id: 'fisher-1' }, process.env.JWT_SECRET);

const mockAuth = (role) => {
  User.findById.mockReturnValue({
    select: jest.fn().mockResolvedValue({ _id: role === 'FISHERMAN' ? 'fisher-1' : 'admin-1', role, name: 'Test User' }),
  });
};

describe('zone routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    mockAuth('HAZARD_ADMIN');
  });

  // ─── POST /api/zones ───
  test('creates a zone for a hazard', async () => {
    zoneService.create.mockResolvedValue({
      _id: 'zone-1',
      sourceHazard: '507f1f77bcf86cd799439011',
      zoneType: 'RESTRICTED',
      status: 'ACTIVE',
      radius: 500,
    });

    const response = await request(app)
      .post('/api/zones')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({
        sourceHazard: '507f1f77bcf86cd799439011',
        zoneType: 'RESTRICTED',
        warningMessage: 'Danger area - keep away',
        radius: 500,
      });

    expect(response.status).toBe(201);
    expect(response.body.zoneType).toBe('RESTRICTED');
    expect(zoneService.create).toHaveBeenCalledWith(expect.objectContaining({
      actorId: 'admin-1',
    }));
  });

  test('rejects zone creation with invalid payload', async () => {
    const response = await request(app)
      .post('/api/zones')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ sourceHazard: 'bad-id', zoneType: 'SAFE', radius: 5 });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation error');
  });

  // ─── GET /api/zones ───
  test('lists zones with GeoJSON for map', async () => {
    zoneService.list.mockResolvedValue({
      page: 1, limit: 10, total: 1,
      items: [{ _id: 'zone-1' }],
      geojson: { type: 'FeatureCollection', features: [] },
    });

    const response = await request(app)
      .get('/api/zones?page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.geojson.type).toBe('FeatureCollection');
  });

  test('allows fisherman to list zones', async () => {
    mockAuth('FISHERMAN');
    zoneService.list.mockResolvedValue({
      page: 1, limit: 10, total: 0, items: [],
      geojson: { type: 'FeatureCollection', features: [] },
    });

    const response = await request(app)
      .get('/api/zones')
      .set('Authorization', `Bearer ${fisherToken()}`);

    expect(response.status).toBe(200);
  });

  // ─── GET /api/zones/:id ───
  test('gets a single zone by id', async () => {
    zoneService.getById.mockResolvedValue({ _id: 'zone-1', zoneType: 'DANGEROUS', radius: 1000 });

    const response = await request(app)
      .get('/api/zones/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.zoneType).toBe('DANGEROUS');
  });

  test('returns 404 when zone not found', async () => {
    const err = new Error('Zone not found');
    err.statusCode = 404;
    zoneService.getById.mockRejectedValue(err);

    const response = await request(app)
      .get('/api/zones/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(response.status).toBe(404);
  });

  // ─── PATCH /api/zones/:id ───
  test('updates zone fields', async () => {
    zoneService.update.mockResolvedValue({ _id: 'zone-1', zoneType: 'DANGEROUS', status: 'DISABLED' });

    const response = await request(app)
      .patch('/api/zones/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ zoneType: 'DANGEROUS', status: 'DISABLED' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('DISABLED');
  });

  // ─── DELETE /api/zones/:id ───
  test('deletes a zone', async () => {
    zoneService.remove.mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });

    const response = await request(app)
      .delete('/api/zones/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Deleted');
  });

  // ─── Role-based access ───
  test('blocks fisherman from creating zones', async () => {
    mockAuth('FISHERMAN');

    const response = await request(app)
      .post('/api/zones')
      .set('Authorization', `Bearer ${fisherToken()}`)
      .send({
        sourceHazard: '507f1f77bcf86cd799439011',
        zoneType: 'RESTRICTED',
        warningMessage: 'Test',
        radius: 500,
      });

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/Forbidden/);
  });

  test('blocks fisherman from deleting zones', async () => {
    mockAuth('FISHERMAN');

    const response = await request(app)
      .delete('/api/zones/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${fisherToken()}`);

    expect(response.status).toBe(403);
  });
});
