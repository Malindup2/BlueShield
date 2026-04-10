const jwt = require('jsonwebtoken');
const generateToken = require('../../src/utils/generateToken');

describe('generateToken', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  test('returns a valid JWT containing the correct id and role', () => {
    const token = generateToken('user-123', 'OFFICER');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    expect(decoded.id).toBe('user-123');
    expect(decoded.role).toBe('OFFICER');
  });

  test('token expires in 7 days', () => {
    const token = generateToken('user-1', 'FISHERMAN');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const expectedExpiry = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
    // Allow 5-second tolerance for execution time
    expect(decoded.exp).toBeGreaterThan(expectedExpiry - 5);
    expect(decoded.exp).toBeLessThanOrEqual(expectedExpiry + 5);
  });

  test('different ids produce different tokens', () => {
    const token1 = generateToken('user-1', 'FISHERMAN');
    const token2 = generateToken('user-2', 'FISHERMAN');

    expect(token1).not.toBe(token2);
  });

  test('token is a non-empty string', () => {
    const token = generateToken('id', 'SYSTEM_ADMIN');

    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });
});
