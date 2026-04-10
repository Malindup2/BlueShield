jest.mock('axios');

const axios = require('axios');
const marineService = require('../../src/services/marineService');

describe('marineService.fetchMarineConditions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockMarineResponse = (waveHeight, windWaveHeight, seaTemp) => {
    const now = new Date().toISOString();
    axios.get.mockResolvedValue({
      data: {
        hourly: {
          time: [now],
          wave_height: [waveHeight],
          wind_wave_height: [windWaveHeight],
          sea_surface_temperature: [seaTemp],
        },
      },
    });
  };

  test('returns marine conditions with LOW risk for calm seas', async () => {
    mockMarineResponse(0.5, 0.3, 28);

    const result = await marineService.fetchMarineConditions({ lat: 6.9271, lng: 79.8612 });

    expect(result.provider).toBe('Open-Meteo Marine API');
    expect(result.waveHeight).toBe(0.5);
    expect(result.windWaveHeight).toBe(0.3);
    expect(result.seaTemperature).toBe(28);
    expect(result.riskLevel).toBe('LOW');
    expect(result.fetchedAt).toBeInstanceOf(Date);
  });

  test('returns MODERATE risk for moderate wave conditions', async () => {
    mockMarineResponse(2.5, 1.0, 26);

    const result = await marineService.fetchMarineConditions({ lat: 7.0, lng: 80.0 });

    expect(result.riskLevel).toBe('MODERATE');
  });

  test('returns HIGH risk for dangerous conditions', async () => {
    mockMarineResponse(4.0, 2.5, 24);

    const result = await marineService.fetchMarineConditions({ lat: 7.0, lng: 80.0 });

    expect(result.riskLevel).toBe('HIGH');
  });

  test('throws 400 for invalid latitude', async () => {
    await expect(
      marineService.fetchMarineConditions({ lat: 'invalid', lng: 80.0 })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  test('throws 400 for invalid longitude', async () => {
    await expect(
      marineService.fetchMarineConditions({ lat: 7.0, lng: NaN })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  test('throws 400 for Infinity coordinates', async () => {
    await expect(
      marineService.fetchMarineConditions({ lat: Infinity, lng: 80.0 })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  test('throws 502 when Open-Meteo API fails', async () => {
    axios.get.mockRejectedValue(new Error('Network error'));

    await expect(
      marineService.fetchMarineConditions({ lat: 7.0, lng: 80.0 })
    ).rejects.toMatchObject({ statusCode: 502 });
  });

  test('calls Open-Meteo with correct parameters', async () => {
    mockMarineResponse(1.0, 0.5, 27);

    await marineService.fetchMarineConditions({ lat: 6.9, lng: 79.8 });

    expect(axios.get).toHaveBeenCalledWith(
      'https://marine-api.open-meteo.com/v1/marine',
      expect.objectContaining({
        params: {
          latitude: 6.9,
          longitude: 79.8,
          hourly: 'wave_height,wind_wave_height,sea_surface_temperature',
          timezone: 'UTC',
        },
        timeout: 10000,
      })
    );
  });

  test('handles empty hourly data gracefully', async () => {
    axios.get.mockResolvedValue({ data: { hourly: {} } });

    const result = await marineService.fetchMarineConditions({ lat: 7.0, lng: 80.0 });

    expect(result.waveHeight).toBeNull();
    expect(result.windWaveHeight).toBeNull();
    expect(result.riskLevel).toBe('LOW');
  });
});
