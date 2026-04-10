const validate = require('../../src/middlewares/validate');

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('validate middleware', () => {
  test('calls next when validation passes (error is null)', () => {
    const validator = jest.fn().mockReturnValue({ error: null });
    const middleware = validate(validator);
    const req = { body: { title: 'Test' } };
    const res = createRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(validator).toHaveBeenCalledWith(req);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('returns 400 with errors when validation fails', () => {
    const errors = ['title is required', 'description is required'];
    const validator = jest.fn().mockReturnValue({ error: errors });
    const middleware = validate(validator);
    const req = { body: {} };
    const res = createRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Validation error',
      errors,
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('calls next when validator returns no result', () => {
    const validator = jest.fn().mockReturnValue(undefined);
    const middleware = validate(validator);
    const req = { body: {} };
    const res = createRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  test('calls next when validator returns result without error field', () => {
    const validator = jest.fn().mockReturnValue({ value: 'ok' });
    const middleware = validate(validator);
    const req = { body: {} };
    const res = createRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  test('passes the full req object to the validator function', () => {
    const validator = jest.fn().mockReturnValue({ error: null });
    const middleware = validate(validator);
    const req = { body: { a: 1 }, params: { id: '123' }, query: { page: '1' } };
    const res = createRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(validator).toHaveBeenCalledWith(req);
  });
});
