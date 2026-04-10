jest.mock('../../src/models/User');
jest.mock('../../src/services/hazardService');
jest.mock('../../src/services/marineService');

const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');
const hazardService = require('../../src/services/hazardService');
const marineService = require('../../src/services/marineService');

const adminToken = () => jwt.sign({ id: 'admin-1' }, process.env.JWT_SECRET);

const mockAdminAuth = () => {
  User.findById.mockReturnValue({
    select: jest.fn().mockResolvedValue({ _id: 'admin-1', role: 'HAZARD_ADMIN', name: 'Hazard Admin' }),
  });
};

describe('hazard routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    mockAdminAuth();
  });

  // ─── POST /api/hazards/from-report/:reportId ───
  test('creates a hazard from a verified report', async () => {
    hazardService.createFromReport.mockResolvedValue({
      _id: 'hazard-1',
      caseId: 'HZ001',
      baseReport: '507f1f77bcf86cd799439011',
      hazardCategory: 'POLLUTION',
      severity: 'HIGH',
      handlingStatus: 'OPEN',
    });

    const response = await request(app)
      .post('/api/hazards/from-report/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ hazardCategory: 'POLLUTION', severity: 'HIGH' });

    expect(response.status).toBe(201);
    expect(response.body.caseId).toBe('HZ001');
    expect(hazardService.createFromReport).toHaveBeenCalledWith(expect.objectContaining({
      reportId: '507f1f77bcf86cd799439011',
      actorId: 'admin-1',
    }));
  });

  // ─── GET /api/hazards ───
  test('lists hazards with pagination', async () => {
    hazardService.list.mockResolvedValue({
      page: 1, limit: 10, total: 2,
      items: [{ _id: 'h-1' }, { _id: 'h-2' }],
    });

    const response = await request(app)
      .get('/api/hazards?page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(2);
    expect(response.body.items).toHaveLength(2);
  });

  // ─── GET /api/hazards/:id ───
  test('gets a single hazard by id', async () => {
    hazardService.getById.mockResolvedValue({ _id: 'h-1', caseId: 'HZ001' });

    const response = await request(app)
      .get('/api/hazards/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.caseId).toBe('HZ001');
  });

  // ─── PATCH /api/hazards/:id ───
  test('updates hazard fields', async () => {
    hazardService.update.mockResolvedValue({ _id: 'h-1', severity: 'CRITICAL' });

    const response = await request(app)
      .patch('/api/hazards/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ severity: 'CRITICAL' });

    expect(response.status).toBe(200);
    expect(response.body.severity).toBe('CRITICAL');
  });

  // ─── GET /api/hazards/:id/weather ───
  test('fetches weather for a hazard', async () => {
    hazardService.fetchWeatherAndSave.mockResolvedValue({
      riskLevel: 'MODERATE',
      advisory: 'Caution for small fishing boats',
    });

    const response = await request(app)
      .get('/api/hazards/507f1f77bcf86cd799439011/weather')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.riskLevel).toBe('MODERATE');
  });

  // ─── PATCH /api/hazards/:id/resolve ───
  test('resolves a hazard', async () => {
    hazardService.resolve.mockResolvedValue({ _id: 'h-1', handlingStatus: 'RESOLVED' });

    const response = await request(app)
      .patch('/api/hazards/507f1f77bcf86cd799439011/resolve')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ resolutionNote: 'Hazard cleared successfully' });

    expect(response.status).toBe(200);
    expect(response.body.handlingStatus).toBe('RESOLVED');
  });

  // ─── DELETE /api/hazards/:id ───
  test('deletes a resolved hazard', async () => {
    hazardService.deleteIfAllowed.mockResolvedValue({ deletedId: '507f1f77bcf86cd799439011' });

    const response = await request(app)
      .delete('/api/hazards/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Deleted');
  });

  // ─── GET /api/hazards/review-reports ───
  test('lists review reports for hazard admin', async () => {
    hazardService.listReviewReports.mockResolvedValue({
      page: 1, limit: 10, total: 1,
      items: [{ _id: 'r-1', reportType: 'HAZARD' }],
    });

    const response = await request(app)
      .get('/api/hazards/review-reports')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
  });

  // ─── PATCH /api/hazards/review-reports/:reportId/status ───
  test('updates review report status', async () => {
    hazardService.updateReviewReportStatus.mockResolvedValue({ _id: 'r-1', status: 'VERIFIED' });

    const response = await request(app)
      .patch('/api/hazards/review-reports/507f1f77bcf86cd799439011/status')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ status: 'VERIFIED' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('VERIFIED');
  });

  // ─── POST /api/hazards/weather-check ───
  test('fetches weather by coordinates', async () => {
    marineService.fetchMarineConditions.mockResolvedValue({
      riskLevel: 'LOW',
      advisory: 'Sea conditions appear normal',
      waveHeight: 0.5,
    });

    const response = await request(app)
      .post('/api/hazards/weather-check')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ lat: 6.9271, lng: 79.8612 });

    expect(response.status).toBe(200);
    expect(response.body.riskLevel).toBe('LOW');
  });

  test('weather-check rejects invalid lat', async () => {
    const response = await request(app)
      .post('/api/hazards/weather-check')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ lat: 'bad', lng: 79.8612 });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/lat/);
  });

  test('weather-check rejects out-of-range coordinates', async () => {
    const response = await request(app)
      .post('/api/hazards/weather-check')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ lat: 100, lng: 79.8612 });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/lat must be between/);
  });

  // ─── GET /api/hazards/dashboard-summary ───
  test('returns dashboard summary', async () => {
    hazardService.getDashboardSummary.mockResolvedValue({
      stats: { pendingReports: 3, activeZones: 2, disabledZones: 1, verifiedHazardCases: 4 },
      monthlyCategoryChart: [],
      recentPendingReports: [],
      activeZonesMap: [],
    });

    const response = await request(app)
      .get('/api/hazards/dashboard-summary')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.stats.pendingReports).toBe(3);
  });

  // ─── Role-based access ───
  test('blocks fisherman from hazard admin routes', async () => {
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: 'fisher-1', role: 'FISHERMAN', name: 'Fisher' }),
    });

    const response = await request(app)
      .get('/api/hazards')
      .set('Authorization', `Bearer ${jwt.sign({ id: 'fisher-1' }, process.env.JWT_SECRET)}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/Forbidden/);
  });
});
