const { computeRiskAndAdvisory } = require('../../src/utils/marineAdvisory');

describe('computeRiskAndAdvisory', () => {
  test('returns HIGH when waveHeight >= 3', () => {
    const result = computeRiskAndAdvisory({ waveHeight: 3, windWaveHeight: 0 });

    expect(result.riskLevel).toBe('HIGH');
    expect(result.advisory).toMatch(/Avoid sea travel/);
  });

  test('returns HIGH when windWaveHeight >= 2', () => {
    const result = computeRiskAndAdvisory({ waveHeight: 0, windWaveHeight: 2 });

    expect(result.riskLevel).toBe('HIGH');
    expect(result.advisory).toMatch(/Avoid sea travel/);
  });

  test('returns HIGH when both thresholds are exceeded', () => {
    const result = computeRiskAndAdvisory({ waveHeight: 4, windWaveHeight: 3 });

    expect(result.riskLevel).toBe('HIGH');
  });

  test('returns MODERATE when waveHeight >= 2 but < 3', () => {
    const result = computeRiskAndAdvisory({ waveHeight: 2, windWaveHeight: 0 });

    expect(result.riskLevel).toBe('MODERATE');
    expect(result.advisory).toMatch(/Caution for small fishing boats/);
  });

  test('returns MODERATE when windWaveHeight >= 1.2 but < 2', () => {
    const result = computeRiskAndAdvisory({ waveHeight: 0, windWaveHeight: 1.2 });

    expect(result.riskLevel).toBe('MODERATE');
  });

  test('returns LOW for calm conditions', () => {
    const result = computeRiskAndAdvisory({ waveHeight: 1, windWaveHeight: 0.5 });

    expect(result.riskLevel).toBe('LOW');
    expect(result.advisory).toMatch(/Sea conditions appear normal/);
  });

  test('returns LOW when both values are zero', () => {
    const result = computeRiskAndAdvisory({ waveHeight: 0, windWaveHeight: 0 });

    expect(result.riskLevel).toBe('LOW');
  });

  test('treats non-numeric waveHeight as 0', () => {
    const result = computeRiskAndAdvisory({ waveHeight: null, windWaveHeight: 0 });

    expect(result.riskLevel).toBe('LOW');
  });

  test('treats non-numeric windWaveHeight as 0', () => {
    const result = computeRiskAndAdvisory({ waveHeight: 0, windWaveHeight: undefined });

    expect(result.riskLevel).toBe('LOW');
  });

  test('treats missing fields as 0', () => {
    const result = computeRiskAndAdvisory({});

    expect(result.riskLevel).toBe('LOW');
  });

  test('advisory always contains validity note', () => {
    const low = computeRiskAndAdvisory({ waveHeight: 0, windWaveHeight: 0 });
    const moderate = computeRiskAndAdvisory({ waveHeight: 2, windWaveHeight: 0 });
    const high = computeRiskAndAdvisory({ waveHeight: 3, windWaveHeight: 0 });

    expect(low.advisory).toMatch(/Advice valid for next few hours/);
    expect(moderate.advisory).toMatch(/Advice valid for next few hours/);
    expect(high.advisory).toMatch(/Advice valid for next few hours/);
  });
});
