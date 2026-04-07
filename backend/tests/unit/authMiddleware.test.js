jest.mock('../../src/models/User');

const jwt = require('jsonwebtoken');
const User = require('../../src/models/User');
const { protect, adminOnly } = require('../../src/middlewares/authMiddleware');

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('authMiddleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  test('protect attaches the authenticated user and calls next', async () => {
    const token = jwt.sign({ id: 'user-id' }, process.env.JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = createRes();
    const next = jest.fn();
    const user = { _id: 'user-id', role: 'FISHERMAN', select: undefined };

    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });

    await protect(req, res, next);

    expect(User.findById).toHaveBeenCalledWith('user-id');
    expect(req.user).toEqual(user);
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('protect rejects missing token', async () => {
    const req = { headers: {} };
    const res = createRes();
    const next = jest.fn();

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized, no token' });
    expect(next).not.toHaveBeenCalled();
  });

  test('adminOnly rejects non-admin users', () => {
    const req = { user: { role: 'FISHERMAN' } };
    const res = createRes();
    const next = jest.fn();

    adminOnly(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized as an admin' });
    expect(next).not.toHaveBeenCalled();
  });

  test('adminOnly allows system admins', () => {
    const req = { user: { role: 'SYSTEM_ADMIN' } };
    const res = createRes();
    const next = jest.fn();

    adminOnly(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
