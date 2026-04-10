jest.mock('../../src/models/Zone');
jest.mock('../../src/models/Hazard');

const Zone = require('../../src/models/Zone');
const Hazard = require('../../src/models/Hazard');
const zoneService = require('../../src/services/zoneService');

describe('zoneService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── create ───
  describe('create', () => {
    test('creates zone when hazard exists and no duplicate', async () => {
      Zone.findOne.mockResolvedValue(null);
      Hazard.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          _id: 'hazard-1',
          baseReport: { location: { coordinates: [79.8, 6.9] } },
        }),
      });
      Zone.create.mockResolvedValue({
        _id: 'zone-1',
        sourceHazard: 'hazard-1',
        zoneType: 'RESTRICTED',
        status: 'ACTIVE',
      });

      const result = await zoneService.create({
        payload: {
          sourceHazard: 'hazard-1',
          zoneType: 'RESTRICTED',
          warningMessage: 'Danger zone',
          radius: 500,
        },
        actorId: 'admin-1',
      });

      expect(result._id).toBe('zone-1');
      expect(Zone.create).toHaveBeenCalledWith(expect.objectContaining({
        sourceHazard: 'hazard-1',
        zoneType: 'RESTRICTED',
        center: { type: 'Point', coordinates: [79.8, 6.9] },
        radius: 500,
        status: 'ACTIVE',
      }));
    });

    test('throws 409 if zone already exists for the hazard', async () => {
      Zone.findOne.mockResolvedValue({ _id: 'existing' });

      await expect(
        zoneService.create({ payload: { sourceHazard: 'h-1' }, actorId: 'a' })
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    test('throws 404 if linked hazard not found', async () => {
      Zone.findOne.mockResolvedValue(null);
      Hazard.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });

      await expect(
        zoneService.create({ payload: { sourceHazard: 'bad' }, actorId: 'a' })
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    test('throws 400 if report has no valid coordinates', async () => {
      Zone.findOne.mockResolvedValue(null);
      Hazard.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          _id: 'h-1',
          baseReport: { location: { coordinates: [] } },
        }),
      });

      await expect(
        zoneService.create({ payload: { sourceHazard: 'h-1' }, actorId: 'a' })
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  // ─── list ───
  describe('list', () => {
    test('returns paginated zone list with geojson', async () => {
      const zones = [
        {
          _id: 'z-1',
          zoneType: 'RESTRICTED',
          status: 'ACTIVE',
          center: { coordinates: [79.8, 6.9] },
          radius: 500,
          warningMessage: 'Danger',
          expiresAt: null,
          createdAt: new Date(),
          sourceHazard: { caseId: 'HZ001', hazardCategory: 'WEATHER', severity: 'HIGH', handlingStatus: 'OPEN' },
        },
      ];
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(zones),
      };
      Zone.find.mockReturnValue(mockQuery);
      Zone.countDocuments.mockResolvedValue(1);

      const result = await zoneService.list({ query: { page: '1', limit: '10' } });

      expect(result.page).toBe(1);
      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.geojson.type).toBe('FeatureCollection');
      expect(result.geojson.features).toHaveLength(1);
      expect(result.geojson.features[0].geometry.coordinates).toEqual([79.8, 6.9]);
    });

    test('applies status and zoneType filters', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue([]),
      };
      Zone.find.mockReturnValue(mockQuery);
      Zone.countDocuments.mockResolvedValue(0);

      await zoneService.list({ query: { status: 'ACTIVE', zoneType: 'DANGEROUS' } });

      expect(Zone.find).toHaveBeenCalledWith(expect.objectContaining({
        status: 'ACTIVE',
        zoneType: 'DANGEROUS',
      }));
    });
  });

  // ─── getById ───
  describe('getById', () => {
    test('returns zone when found', async () => {
      Zone.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue({ _id: 'z-1', zoneType: 'RESTRICTED' }),
      });

      const result = await zoneService.getById('z-1');
      expect(result.zoneType).toBe('RESTRICTED');
    });

    test('throws 404 when not found', async () => {
      Zone.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });

      await expect(zoneService.getById('bad')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ─── update ───
  describe('update', () => {
    test('updates zone fields', async () => {
      Zone.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue({ _id: 'z-1', zoneType: 'DANGEROUS' }),
      });

      const result = await zoneService.update({
        id: 'z-1',
        payload: { zoneType: 'DANGEROUS', warningMessage: 'Updated warning' },
        actorId: 'admin-1',
      });

      expect(result.zoneType).toBe('DANGEROUS');
    });

    test('throws 404 when zone not found', async () => {
      Zone.findByIdAndUpdate.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });

      await expect(
        zoneService.update({ id: 'bad', payload: {}, actorId: 'a' })
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ─── remove ───
  describe('remove', () => {
    test('deletes zone', async () => {
      Zone.findByIdAndDelete.mockResolvedValue({ _id: 'z-1' });

      const result = await zoneService.remove({ id: 'z-1' });
      expect(result._id).toBe('z-1');
    });

    test('throws 404 when zone not found', async () => {
      Zone.findByIdAndDelete.mockResolvedValue(null);

      await expect(zoneService.remove({ id: 'bad' })).rejects.toMatchObject({ statusCode: 404 });
    });
  });
});
