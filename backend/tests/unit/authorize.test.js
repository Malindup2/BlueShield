const authorize = require('../../src/middlewares/authorize');

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('authorize middleware', () => {
  test('calls next when user role is in allowed roles', () => {
    const middleware = authorize('OFFICER', 'SYSTEM_ADMIN');
    const req = { user: { role: 'OFFICER' } };
    const res = createRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('returns 403 when user role is not in allowed roles', () => {
    const middleware = authorize('OFFICER', 'SYSTEM_ADMIN');
    const req = { user: { role: 'FISHERMAN' } };
    const res = createRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden: insufficient role' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when req.user is missing', () => {
    const middleware = authorize('OFFICER');
    const req = {};
    const res = createRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when req.user is null', () => {
    const middleware = authorize('OFFICER');
    const req = { user: null };
    const res = createRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('works with a single allowed role', () => {
    const middleware = authorize('SYSTEM_ADMIN');
    const req = { user: { role: 'SYSTEM_ADMIN' } };
    const res = createRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  test('works with multiple allowed roles', () => {
    const middleware = authorize('FISHERMAN', 'OFFICER', 'HAZARD_ADMIN', 'SYSTEM_ADMIN');
    const req = { user: { role: 'HAZARD_ADMIN' } };
    const res = createRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
