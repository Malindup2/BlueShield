jest.mock('../../src/models/Hazard');
jest.mock('../../src/models/Report');
jest.mock('../../src/models/Zone');
jest.mock('../../src/services/marineService');

const Hazard = require('../../src/models/Hazard');
const Report = require('../../src/models/Report');
const Zone = require('../../src/models/Zone');
const marineService = require('../../src/services/marineService');
const hazardService = require('../../src/services/hazardService');

describe('hazardService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── createFromReport ───
  describe('createFromReport', () => {
    test('creates hazard from a valid VERIFIED HAZARD report', async () => {
      Hazard.findOne.mockResolvedValueOnce(null); // no existing hazard
      Report.findById.mockResolvedValue({
        _id: 'report-1',
        reportType: 'HAZARD',
        status: 'VERIFIED',
        severity: 'HIGH',
      });
      // nextCaseId mock
      Hazard.findOne.mockReturnValueOnce({
        sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ caseId: 'HZ005' }) }),
      });
      Hazard.create.mockResolvedValue({ _id: 'hazard-1', caseId: 'HZ006', baseReport: 'report-1' });

      const result = await hazardService.createFromReport({
        reportId: 'report-1',
        payload: { hazardCategory: 'POLLUTION', severity: 'HIGH' },
        actorId: 'admin-1',
      });

      expect(result._id).toBe('hazard-1');
      expect(Hazard.create).toHaveBeenCalledWith(expect.objectContaining({
        baseReport: 'report-1',
        hazardCategory: 'POLLUTION',
        severity: 'HIGH',
        handlingStatus: 'OPEN',
        createdBy: 'admin-1',
      }));
    });

    test('throws 409 if hazard already exists for the report', async () => {
      Hazard.findOne.mockResolvedValue({ _id: 'existing' });

      await expect(
        hazardService.createFromReport({ reportId: 'report-1', payload: {}, actorId: 'a' })
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    test('throws 404 if report not found', async () => {
      Hazard.findOne.mockResolvedValue(null);
      Report.findById.mockResolvedValue(null);

      await expect(
        hazardService.createFromReport({ reportId: 'bad', payload: {}, actorId: 'a' })
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    test('throws 400 if report type is not HAZARD or ENVIRONMENTAL', async () => {
      Hazard.findOne.mockResolvedValue(null);
      Report.findById.mockResolvedValue({ reportType: 'ILLEGAL_FISHING', status: 'VERIFIED' });

      await expect(
        hazardService.createFromReport({ reportId: 'r-1', payload: {}, actorId: 'a' })
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    test('throws 409 if report is not VERIFIED', async () => {
      Hazard.findOne.mockResolvedValue(null);
      Report.findById.mockResolvedValue({ reportType: 'HAZARD', status: 'PENDING' });

      await expect(
        hazardService.createFromReport({ reportId: 'r-1', payload: {}, actorId: 'a' })
      ).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  // ─── list ───
  describe('list', () => {
    test('returns paginated hazard list', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue([{ _id: 'h-1' }]),
      };
      Hazard.find.mockReturnValue(mockQuery);
      Hazard.countDocuments.mockResolvedValue(1);

      const result = await hazardService.list({ query: { page: '1', limit: '10' } });

      expect(result.page).toBe(1);
      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
    });

    test('applies filters from query', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue([]),
      };
      Hazard.find.mockReturnValue(mockQuery);
      Hazard.countDocuments.mockResolvedValue(0);

      await hazardService.list({
        query: { handlingStatus: 'OPEN', hazardCategory: 'POLLUTION', severity: 'HIGH' },
      });

      expect(Hazard.find).toHaveBeenCalledWith(expect.objectContaining({
        handlingStatus: 'OPEN',
        hazardCategory: 'POLLUTION',
        severity: 'HIGH',
      }));
    });
  });

  // ─── getById ───
  describe('getById', () => {
    test('returns hazard when found', async () => {
      Hazard.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue({ _id: 'h-1', caseId: 'HZ001' }),
      });

      const result = await hazardService.getById('h-1');
      expect(result.caseId).toBe('HZ001');
    });

    test('throws 404 when not found', async () => {
      Hazard.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });

      await expect(hazardService.getById('bad')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ─── update ───
  describe('update', () => {
    test('updates hazard fields', async () => {
      Hazard.findById.mockResolvedValue({ _id: 'h-1' });
      Hazard.findByIdAndUpdate.mockResolvedValue({ _id: 'h-1', severity: 'CRITICAL' });

      const result = await hazardService.update({
        id: 'h-1',
        payload: { severity: 'CRITICAL' },
        actorId: 'admin-1',
      });

      expect(result.severity).toBe('CRITICAL');
    });

    test('throws 409 when trying to set status to RESOLVED directly', async () => {
      Hazard.findById.mockResolvedValue({ _id: 'h-1' });

      await expect(
        hazardService.update({ id: 'h-1', payload: { handlingStatus: 'RESOLVED' }, actorId: 'a' })
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    test('throws 404 when hazard not found', async () => {
      Hazard.findById.mockResolvedValue(null);

      await expect(
        hazardService.update({ id: 'bad', payload: {}, actorId: 'a' })
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ─── fetchWeatherAndSave ───
  describe('fetchWeatherAndSave', () => {
    test('fetches weather and updates hazard', async () => {
      Hazard.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          _id: 'h-1',
          baseReport: { location: { coordinates: [79.8, 6.9] } },
        }),
      });
      marineService.fetchMarineConditions.mockResolvedValue({
        riskLevel: 'LOW',
        advisory: 'Normal conditions',
      });
      Hazard.findByIdAndUpdate.mockResolvedValue({
        lastWeatherCheck: { riskLevel: 'LOW', advisory: 'Normal conditions' },
      });

      const result = await hazardService.fetchWeatherAndSave({ id: 'h-1', actorId: 'admin-1' });

      expect(result.riskLevel).toBe('LOW');
      expect(marineService.fetchMarineConditions).toHaveBeenCalledWith({ lat: 6.9, lng: 79.8 });
    });

    test('throws 404 when hazard not found', async () => {
      Hazard.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });

      await expect(
        hazardService.fetchWeatherAndSave({ id: 'bad', actorId: 'a' })
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    test('throws 400 when hazard has no valid coordinates', async () => {
      Hazard.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          _id: 'h-1',
          baseReport: { location: { coordinates: [] } },
        }),
      });

      await expect(
        hazardService.fetchWeatherAndSave({ id: 'h-1', actorId: 'a' })
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  // ─── resolve ───
  describe('resolve', () => {
    test('resolves hazard and disables active zone', async () => {
      Hazard.findById.mockResolvedValue({ _id: 'h-1', baseReport: 'report-1' });
      Hazard.findByIdAndUpdate.mockResolvedValue({ _id: 'h-1', handlingStatus: 'RESOLVED' });
      Zone.updateOne.mockResolvedValue({});
      Report.findByIdAndUpdate.mockResolvedValue({});

      const result = await hazardService.resolve({
        id: 'h-1',
        resolutionNote: 'Hazard cleared',
        actorId: 'admin-1',
      });

      expect(result.handlingStatus).toBe('RESOLVED');
      expect(Zone.updateOne).toHaveBeenCalledWith(
        { sourceHazard: 'h-1', status: 'ACTIVE' },
        { $set: { status: 'DISABLED', updatedBy: 'admin-1' } }
      );
      expect(Report.findByIdAndUpdate).toHaveBeenCalledWith(
        'report-1',
        { $set: { status: 'RESOLVED' } }
      );
    });

    test('throws 404 when hazard not found', async () => {
      Hazard.findById.mockResolvedValue(null);

      await expect(
        hazardService.resolve({ id: 'bad', actorId: 'a' })
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ─── deleteIfAllowed ───
  describe('deleteIfAllowed', () => {
    test('deletes resolved hazard with no active zones', async () => {
      Hazard.findById.mockResolvedValue({ _id: 'h-1', handlingStatus: 'RESOLVED' });
      Zone.countDocuments.mockResolvedValue(0);
      Hazard.deleteOne.mockResolvedValue({});

      const result = await hazardService.deleteIfAllowed({ id: 'h-1' });

      expect(result.deletedId).toBe('h-1');
    });

    test('throws 409 when hazard is not RESOLVED', async () => {
      Hazard.findById.mockResolvedValue({ _id: 'h-1', handlingStatus: 'OPEN' });

      await expect(
        hazardService.deleteIfAllowed({ id: 'h-1' })
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    test('throws 409 when active zones exist', async () => {
      Hazard.findById.mockResolvedValue({ _id: 'h-1', handlingStatus: 'RESOLVED' });
      Zone.countDocuments.mockResolvedValue(1);

      await expect(
        hazardService.deleteIfAllowed({ id: 'h-1' })
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    test('throws 404 when hazard not found', async () => {
      Hazard.findById.mockResolvedValue(null);

      await expect(
        hazardService.deleteIfAllowed({ id: 'bad' })
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ─── getDashboardSummary ───
  describe('getDashboardSummary', () => {
    test('returns dashboard stats', async () => {
      Report.countDocuments.mockResolvedValue(5);
      Zone.countDocuments.mockResolvedValueOnce(3).mockResolvedValueOnce(1);
      Hazard.countDocuments.mockResolvedValue(4);

      const mockReportQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      };
      Report.find.mockReturnValue(mockReportQuery);

      Hazard.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
          { hazardCategory: 'WEATHER' },
          { hazardCategory: 'POLLUTION' },
          { hazardCategory: 'WEATHER' },
        ]),
      });

      Zone.find.mockReturnValue({
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      const result = await hazardService.getDashboardSummary();

      expect(result.stats.pendingReports).toBe(5);
      expect(result.stats.activeZones).toBe(3);
      expect(result.stats.disabledZones).toBe(1);
      expect(result.stats.verifiedHazardCases).toBe(4);
      expect(result.monthlyCategoryChart).toBeInstanceOf(Array);
    });
  });
});
