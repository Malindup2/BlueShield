jest.mock('../../src/models/User');
jest.mock('../../src/utils/generateToken');

const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');
const generateToken = require('../../src/utils/generateToken');

describe('auth routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  test('POST /api/auth/register creates a user and returns a token', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({
      id: 'user-1',
      _id: 'user-1',
      name: 'Nimal',
      email: 'nimal@example.com',
      role: 'FISHERMAN',
    });
    generateToken.mockReturnValue('token-123');

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Nimal',
        email: 'nimal@example.com',
        password: 'Password123!',
        phone: '+94771234567',
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      _id: 'user-1',
      name: 'Nimal',
      email: 'nimal@example.com',
      role: 'FISHERMAN',
      token: 'token-123',
    });
  });

  test('POST /api/auth/login returns 401 for invalid credentials', async () => {
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'missing@example.com', password: 'wrong-password' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Invalid email or password' });
  });

  test('GET /api/auth/me returns the authenticated user', async () => {
    const currentUser = { _id: 'user-2', name: 'Kamal', email: 'kamal@example.com', role: 'OFFICER' };
    const token = jwt.sign({ id: 'user-2' }, process.env.JWT_SECRET);

    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(currentUser),
    });

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(currentUser);
  });
});
