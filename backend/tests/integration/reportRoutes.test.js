jest.mock('../../src/models/Report', () => {
  return jest.fn().mockImplementation(function reportFactory(data) {
    Object.assign(this, { _id: 'report-1', ...data });
    this.save = jest.fn().mockResolvedValue(this);
  });
});

jest.mock('../../src/models/User');

const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../../src/app');
const Report = require('../../src/models/Report');
const User = require('../../src/models/User');

describe('report routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  test('POST /api/reports returns validation errors for incomplete payloads', async () => {
    const token = jwt.sign({ id: 'user-3' }, process.env.JWT_SECRET);

    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: 'user-3', role: 'FISHERMAN' }),
    });

    const response = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'Missing title' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation error');
    expect(response.body.errors).toEqual(expect.arrayContaining(['title is required']));
    expect(Report).not.toHaveBeenCalled();
  });

  test('POST /api/reports creates a report for an authenticated fisherman', async () => {
    const token = jwt.sign({ id: 'user-4' }, process.env.JWT_SECRET);
    const user = { _id: 'user-4', role: 'FISHERMAN' };

    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(user),
    });

    const response = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Suspicious vessel',
        description: 'Observed at the reef edge',
        reportType: 'ILLEGAL_FISHING',
        severity: 'HIGH',
        location: { type: 'Point', coordinates: [79.8612, 6.9271] },
        isAnonymous: false,
      });

    expect(response.status).toBe(201);
    expect(Report).toHaveBeenCalledTimes(1);
    expect(response.body).toMatchObject({
      _id: 'report-1',
      title: 'Suspicious vessel',
      description: 'Observed at the reef edge',
      reportType: 'ILLEGAL_FISHING',
      severity: 'HIGH',
      reportedBy: 'user-4',
    });
  });
});
