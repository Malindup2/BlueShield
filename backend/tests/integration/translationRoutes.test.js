jest.mock('../../src/models/User');
jest.mock('axios');

const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');
const axios = require('axios');

const userToken = () => jwt.sign({ id: 'user-1' }, process.env.JWT_SECRET);

const mockAuth = () => {
  User.findById.mockReturnValue({
    select: jest.fn().mockResolvedValue({ _id: 'user-1', role: 'FISHERMAN', name: 'Test User' }),
  });
};

describe('translation routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    process.env.AZURE_TRANSLATOR_KEY = 'test-azure-key';
    process.env.AZURE_TRANSLATOR_LOCATION = 'southeastasia';
    mockAuth();
  });

  // ─── English (no API call) ───
  test('returns original texts for English target language', async () => {
    const response = await request(app)
      .post('/api/translate')
      .set('Authorization', `Bearer ${userToken()}`)
      .send({ texts: ['Hello', 'World'], targetLanguage: 'en' });

    expect(response.status).toBe(200);
    expect(response.body.translations).toEqual(['Hello', 'World']);
    expect(axios.post).not.toHaveBeenCalled();
  });

  // ─── Sinhala translation ───
  test('translates texts to Sinhala via Azure', async () => {
    axios.post.mockResolvedValue({
      data: [
        { translations: [{ text: 'ආයුබෝවන්', to: 'si' }] },
        { translations: [{ text: 'ලෝකය', to: 'si' }] },
      ],
    });

    const response = await request(app)
      .post('/api/translate')
      .set('Authorization', `Bearer ${userToken()}`)
      .send({ texts: ['Hello', 'World'], targetLanguage: 'si' });

    expect(response.status).toBe(200);
    expect(response.body.translations).toEqual(['ආයුබෝවන්', 'ලෝකය']);
    expect(axios.post).toHaveBeenCalledTimes(1);
  });

  // ─── Tamil translation ───
  test('translates texts to Tamil via Azure', async () => {
    axios.post.mockResolvedValue({
      data: [
        { translations: [{ text: 'வணக்கம்', to: 'ta' }] },
      ],
    });

    const response = await request(app)
      .post('/api/translate')
      .set('Authorization', `Bearer ${userToken()}`)
      .send({ texts: ['Hello'], targetLanguage: 'ta' });

    expect(response.status).toBe(200);
    expect(response.body.translations).toEqual(['வணக்கம்']);
  });

  // ─── Validation errors ───
  test('rejects when texts array is missing', async () => {
    const response = await request(app)
      .post('/api/translate')
      .set('Authorization', `Bearer ${userToken()}`)
      .send({ targetLanguage: 'si' });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/texts array is required/);
  });

  test('rejects when texts is not an array', async () => {
    const response = await request(app)
      .post('/api/translate')
      .set('Authorization', `Bearer ${userToken()}`)
      .send({ texts: 'not an array', targetLanguage: 'si' });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/texts array is required/);
  });

  test('rejects when targetLanguage is missing', async () => {
    const response = await request(app)
      .post('/api/translate')
      .set('Authorization', `Bearer ${userToken()}`)
      .send({ texts: ['Hello'] });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/targetLanguage is required/);
  });

  test('rejects unsupported language code', async () => {
    const response = await request(app)
      .post('/api/translate')
      .set('Authorization', `Bearer ${userToken()}`)
      .send({ texts: ['Hello'], targetLanguage: 'fr' });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/Unsupported language/);
  });

  // ─── Server config error ───
  test('returns 500 when Azure credentials are missing', async () => {
    delete process.env.AZURE_TRANSLATOR_KEY;

    const response = await request(app)
      .post('/api/translate')
      .set('Authorization', `Bearer ${userToken()}`)
      .send({ texts: ['Hello'], targetLanguage: 'si' });

    expect(response.status).toBe(500);
    expect(response.body.message).toMatch(/not configured/);
  });

  // ─── Azure API error handling ───
  test('returns 500 when Azure API fails', async () => {
    axios.post.mockRejectedValue(new Error('Azure timeout'));

    const response = await request(app)
      .post('/api/translate')
      .set('Authorization', `Bearer ${userToken()}`)
      .send({ texts: ['Hello'], targetLanguage: 'si' });

    expect(response.status).toBe(500);
    expect(response.body.message).toMatch(/Translation failed/);
  });

  test('returns 429 when Azure rate limit exceeded', async () => {
    const error = new Error('Rate limited');
    error.response = { status: 429 };
    axios.post.mockRejectedValue(error);

    const response = await request(app)
      .post('/api/translate')
      .set('Authorization', `Bearer ${userToken()}`)
      .send({ texts: ['Hello'], targetLanguage: 'si' });

    expect(response.status).toBe(429);
    expect(response.body.message).toMatch(/quota exceeded/);
  });

  // ─── Authentication ───
  test('rejects unauthenticated requests', async () => {
    const response = await request(app)
      .post('/api/translate')
      .send({ texts: ['Hello'], targetLanguage: 'si' });

    expect(response.status).toBe(401);
  });
});
