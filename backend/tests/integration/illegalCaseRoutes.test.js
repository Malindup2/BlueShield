jest.mock('../../src/models/User');
jest.mock('../../src/services/illegalCaseService');

const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');
const illegalCaseService = require('../../src/services/illegalCaseService');

const adminToken = () => jwt.sign({ id: 'admin-1' }, process.env.JWT_SECRET);
const officerToken = () => jwt.sign({ id: 'officer-1' }, process.env.JWT_SECRET);

const mockAuth = (role, id) => {
  User.findById.mockReturnValue({
    select: jest.fn().mockResolvedValue({ _id: id || 'admin-1', role, name: 'Test User' }),
  });
};

describe('illegal case routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    mockAuth('ILLEGAL_ADMIN');
  });

  // ─── GET /api/illegal-cases/reports/pending ───
  test('lists pending illegal fishing reports', async () => {
    illegalCaseService.getPendingReports.mockResolvedValue([
      { _id: 'r-1', reportType: 'ILLEGAL_FISHING', illegalCase: null },
    ]);

    const response = await request(app)
      .get('/api/illegal-cases/reports/pending')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
  });

  // ─── PATCH /api/illegal-cases/reports/:reportId/mark-reviewed ───
  test('marks a report as reviewed', async () => {
    illegalCaseService.markAsReviewed.mockResolvedValue({
      report: { _id: 'r-1', status: 'REJECTED' },
      illegalCase: null,
    });

    const response = await request(app)
      .patch('/api/illegal-cases/reports/507f1f77bcf86cd799439011/mark-reviewed')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.report.status).toBe('REJECTED');
  });

  // ─── DELETE /api/illegal-cases/reports/:reportId ───
  test('deletes a reviewed case from dashboard', async () => {
    illegalCaseService.deleteReviewedCase.mockResolvedValue({
      reportId: '507f1f77bcf86cd799439011',
      illegalCaseId: 'case-1',
    });

    const response = await request(app)
      .delete('/api/illegal-cases/reports/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Case removed from dashboard');
  });

  // ─── POST /api/illegal-cases/reports/:reportId/review ───
  test('creates an illegal case from a report', async () => {
    illegalCaseService.createCase.mockResolvedValue({
      _id: 'case-1',
      title: 'Illegal trawling',
      status: 'OPEN',
      vesselId: 'IMO-1234567',
    });

    const response = await request(app)
      .post('/api/illegal-cases/reports/507f1f77bcf86cd799439011/review')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({
        title: 'Illegal trawling',
        description: 'Observed near reef zone',
        vesselId: 'IMO-1234567',
        vesselType: 'Bottom Trawler',
        severity: 'HIGH',
      });

    expect(response.status).toBe(201);
    expect(response.body.title).toBe('Illegal trawling');
    expect(illegalCaseService.createCase).toHaveBeenCalledWith(expect.objectContaining({
      reportId: '507f1f77bcf86cd799439011',
      actorId: 'admin-1',
    }));
  });

  test('rejects case creation with invalid vessel ID format', async () => {
    const response = await request(app)
      .post('/api/illegal-cases/reports/507f1f77bcf86cd799439011/review')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({
        title: 'Test',
        description: 'Test',
        vesselId: 'INVALID',
        vesselType: 'Boat',
        severity: 'HIGH',
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation error');
  });

  // ─── GET /api/illegal-cases ───
  test('lists cases for admin', async () => {
    illegalCaseService.listCases.mockResolvedValue({
      page: 1, limit: 50, total: 2,
      items: [{ _id: 'case-1' }, { _id: 'case-2' }],
    });

    const response = await request(app)
      .get('/api/illegal-cases')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(2);
  });

  test('allows officer to list cases', async () => {
    mockAuth('OFFICER', 'officer-1');
    illegalCaseService.listCases.mockResolvedValue({
      page: 1, limit: 50, total: 1, items: [{ _id: 'case-1' }],
    });

    const response = await request(app)
      .get('/api/illegal-cases')
      .set('Authorization', `Bearer ${officerToken()}`);

    expect(response.status).toBe(200);
  });

  // ─── GET /api/illegal-cases/:caseId ───
  test('gets case by id', async () => {
    illegalCaseService.getCaseById.mockResolvedValue({
      _id: 'case-1', title: 'Illegal trawling', status: 'OPEN',
    });

    const response = await request(app)
      .get('/api/illegal-cases/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.title).toBe('Illegal trawling');
  });

  // ─── PATCH /api/illegal-cases/:caseId ───
  test('updates case fields', async () => {
    illegalCaseService.updateCase.mockResolvedValue({ _id: 'case-1', severity: 'CRITICAL' });

    const response = await request(app)
      .patch('/api/illegal-cases/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ severity: 'CRITICAL' });

    expect(response.status).toBe(200);
    expect(response.body.severity).toBe('CRITICAL');
  });

  // ─── DELETE /api/illegal-cases/:caseId ───
  test('deletes a case', async () => {
    illegalCaseService.deleteCase.mockResolvedValue({ id: '507f1f77bcf86cd799439011' });

    const response = await request(app)
      .delete('/api/illegal-cases/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Record deleted');
  });

  // ─── GET /api/illegal-cases/officers ───
  test('lists available officers', async () => {
    illegalCaseService.getOfficers.mockResolvedValue([
      { _id: 'o-1', name: 'Officer One', email: 'officer@test.com' },
    ]);

    const response = await request(app)
      .get('/api/illegal-cases/officers')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
  });

  // ─── POST /api/illegal-cases/:caseId/escalate ───
  test('escalates case to an officer', async () => {
    illegalCaseService.escalateCase.mockResolvedValue({
      _id: 'case-1',
      status: 'ESCALATED',
      assignedOfficer: { _id: 'officer-1', name: 'Officer One' },
    });

    const response = await request(app)
      .post('/api/illegal-cases/507f1f77bcf86cd799439011/escalate')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ officerId: '507f1f77bcf86cd799439012' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ESCALATED');
  });

  test('rejects escalation without officerId', async () => {
    const response = await request(app)
      .post('/api/illegal-cases/507f1f77bcf86cd799439011/escalate')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation error');
  });

  // ─── POST /api/illegal-cases/:caseId/resolve ───
  test('resolves a case', async () => {
    illegalCaseService.resolveCase.mockResolvedValue({ _id: 'case-1', status: 'RESOLVED' });

    const response = await request(app)
      .post('/api/illegal-cases/507f1f77bcf86cd799439011/resolve')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('RESOLVED');
  });

  // ─── POST /api/illegal-cases/:caseId/track ───
  test('tracks vessel for a case', async () => {
    illegalCaseService.trackVessel.mockResolvedValue({
      vesselData: { imo: 'IMO3218739', vesselType: 'Bottom Trawler' },
      severity: 'HIGH',
      dataSource: 'external_api',
    });

    const response = await request(app)
      .post('/api/illegal-cases/507f1f77bcf86cd799439011/track')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.vesselData.imo).toBe('IMO3218739');
  });

  // ─── POST /api/illegal-cases/:caseId/notes ───
  test('adds a note to a case', async () => {
    illegalCaseService.addNote.mockResolvedValue({
      _id: 'case-1',
      reviewNotes: [{ content: 'Investigation update', addedAt: new Date() }],
    });

    const response = await request(app)
      .post('/api/illegal-cases/507f1f77bcf86cd799439011/notes')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ content: 'Investigation update' });

    expect(response.status).toBe(200);
    expect(response.body.reviewNotes).toHaveLength(1);
  });

  test('rejects note without content', async () => {
    const response = await request(app)
      .post('/api/illegal-cases/507f1f77bcf86cd799439011/notes')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation error');
  });

  // ─── Role-based access ───
  test('blocks fisherman from illegal case admin routes', async () => {
    mockAuth('FISHERMAN', 'fisher-1');

    const response = await request(app)
      .get('/api/illegal-cases/reports/pending')
      .set('Authorization', `Bearer ${jwt.sign({ id: 'fisher-1' }, process.env.JWT_SECRET)}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/Forbidden/);
  });

  test('blocks officer from creating cases', async () => {
    mockAuth('OFFICER', 'officer-1');

    const response = await request(app)
      .post('/api/illegal-cases/reports/507f1f77bcf86cd799439011/review')
      .set('Authorization', `Bearer ${officerToken()}`)
      .send({
        title: 'Test',
        description: 'Test',
        vesselId: 'IMO-1234567',
        vesselType: 'Trawler',
        severity: 'HIGH',
      });

    expect(response.status).toBe(403);
  });
});
