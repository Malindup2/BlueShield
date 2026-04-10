jest.mock('@google/generative-ai', () => {
  const generateContent = jest.fn();
  const getGenerativeModel = jest.fn().mockReturnValue({ generateContent });
  const GoogleGenerativeAI = jest.fn().mockImplementation(() => ({ getGenerativeModel }));
  return { GoogleGenerativeAI, __mocks: { generateContent, getGenerativeModel } };
});

const { __mocks } = require('@google/generative-ai');
const geminiService = require('../../src/services/geminiService');

describe('geminiService.analyseEnforcementRisk', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-key';
  });

  const validInput = {
    vesselName: 'IMO-1234567',
    flagState: 'LK',
    severity: 'HIGH',
    description: 'Illegal trawling near reef',
    locationName: 'Southern coast',
  };

  const mockGeminiResponse = (json) => {
    __mocks.generateContent.mockResolvedValue({
      response: { text: () => JSON.stringify(json) },
    });
  };

  test('returns parsed risk assessment from Gemini response', async () => {
    mockGeminiResponse({
      riskScore: 75,
      riskLevel: 'HIGH',
      justification: 'Repeated offender in protected zone',
      recommendedActions: ['Seize equipment', 'Issue fine'],
    });

    const result = await geminiService.analyseEnforcementRisk(validInput);

    expect(result.riskScore).toBe(75);
    expect(result.riskLevel).toBe('HIGH');
    expect(result.justification).toBe('Repeated offender in protected zone');
    expect(result.recommendedActions).toEqual(['Seize equipment', 'Issue fine']);
  });

  test('clamps riskScore to 0-100 range', async () => {
    mockGeminiResponse({
      riskScore: 150,
      riskLevel: 'CRITICAL',
      justification: 'Extreme case',
      recommendedActions: [],
    });

    const result = await geminiService.analyseEnforcementRisk(validInput);
    expect(result.riskScore).toBe(100);
  });

  test('clamps negative riskScore to 0', async () => {
    mockGeminiResponse({
      riskScore: -10,
      riskLevel: 'LOW',
      justification: 'Minor',
      recommendedActions: [],
    });

    const result = await geminiService.analyseEnforcementRisk(validInput);
    expect(result.riskScore).toBe(0);
  });

  test('derives riskLevel when Gemini returns an invalid level', async () => {
    mockGeminiResponse({
      riskScore: 80,
      riskLevel: 'INVALID_LEVEL',
      justification: 'Test',
      recommendedActions: [],
    });

    const result = await geminiService.analyseEnforcementRisk(validInput);
    expect(result.riskLevel).toBe('CRITICAL'); // 80 >= 76
  });

  test('derives LOW for score < 26', async () => {
    mockGeminiResponse({
      riskScore: 10,
      riskLevel: 'WRONG',
      justification: 'Test',
      recommendedActions: [],
    });

    const result = await geminiService.analyseEnforcementRisk(validInput);
    expect(result.riskLevel).toBe('LOW');
  });

  test('derives MODERATE for score 26-50', async () => {
    mockGeminiResponse({
      riskScore: 40,
      riskLevel: 'WRONG',
      justification: 'Test',
      recommendedActions: [],
    });

    const result = await geminiService.analyseEnforcementRisk(validInput);
    expect(result.riskLevel).toBe('MODERATE');
  });

  test('derives HIGH for score 51-75', async () => {
    mockGeminiResponse({
      riskScore: 60,
      riskLevel: 'WRONG',
      justification: 'Test',
      recommendedActions: [],
    });

    const result = await geminiService.analyseEnforcementRisk(validInput);
    expect(result.riskLevel).toBe('HIGH');
  });

  test('handles missing recommendedActions gracefully', async () => {
    mockGeminiResponse({
      riskScore: 50,
      riskLevel: 'MODERATE',
      justification: 'Some justification',
    });

    const result = await geminiService.analyseEnforcementRisk(validInput);
    expect(result.recommendedActions).toEqual([]);
  });

  test('handles missing justification gracefully', async () => {
    mockGeminiResponse({
      riskScore: 50,
      riskLevel: 'MODERATE',
      recommendedActions: ['Action 1'],
    });

    const result = await geminiService.analyseEnforcementRisk(validInput);
    expect(result.justification).toBe('');
  });

  test('throws 502 error when Gemini API fails', async () => {
    __mocks.generateContent.mockRejectedValue(new Error('API timeout'));

    await expect(geminiService.analyseEnforcementRisk(validInput))
      .rejects
      .toThrow('Gemini enforcement analysis failed: API timeout');
  });

  test('thrown error has statusCode 502', async () => {
    __mocks.generateContent.mockRejectedValue(new Error('Network error'));

    try {
      await geminiService.analyseEnforcementRisk(validInput);
    } catch (err) {
      expect(err.statusCode).toBe(502);
    }
  });

  test('throws when Gemini returns invalid JSON', async () => {
    __mocks.generateContent.mockResolvedValue({
      response: { text: () => 'not valid json' },
    });

    await expect(geminiService.analyseEnforcementRisk(validInput)).rejects.toThrow();
  });
});
