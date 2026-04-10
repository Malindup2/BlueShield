jest.mock('axios');
jest.mock('../../src/models/IllegalCase');
jest.mock('../../src/models/Report');
jest.mock('../../src/models/User');
jest.mock('../../src/models/Enforcement');

const axios = require('axios');
const IllegalCase = require('../../src/models/IllegalCase');
const Report = require('../../src/models/Report');
const User = require('../../src/models/User');
const Enforcement = require('../../src/models/Enforcement');
const illegalCaseService = require('../../src/services/illegalCaseService');

describe('illegalCaseService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── getPendingReports ───
  describe('getPendingReports', () => {
    test('returns reports with associated cases', async () => {
      const reports = [
        { _id: 'r-1', toObject: () => ({ _id: 'r-1' }) },
        { _id: 'r-2', toObject: () => ({ _id: 'r-2' }) },
      ];
      Report.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(reports),
      });
      IllegalCase.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([
          { baseReport: { toString: () => 'r-1' }, isReviewed: false, status: 'OPEN' },
        ]),
      });

      const result = await illegalCaseService.getPendingReports();

      expect(result).toHaveLength(2);
      expect(result[0].illegalCase).not.toBeNull();
      expect(result[1].illegalCase).toBeNull();
    });
  });

  // ─── markAsReviewed ───
  describe('markAsReviewed', () => {
    test('sets report status to REJECTED', async () => {
      Report.findByIdAndUpdate.mockResolvedValue({ _id: 'r-1', status: 'REJECTED' });
      IllegalCase.findOne.mockResolvedValue(null);

      const result = await illegalCaseService.markAsReviewed({ reportId: 'r-1' });

      expect(result.report.status).toBe('REJECTED');
      expect(result.illegalCase).toBeNull();
    });

    test('marks associated illegal case as reviewed', async () => {
      Report.findByIdAndUpdate.mockResolvedValue({ _id: 'r-1', status: 'REJECTED' });
      const illegalCase = { isReviewed: false, save: jest.fn().mockResolvedValue(true) };
      IllegalCase.findOne.mockResolvedValue(illegalCase);

      const result = await illegalCaseService.markAsReviewed({ reportId: 'r-1' });

      expect(illegalCase.isReviewed).toBe(true);
      expect(illegalCase.save).toHaveBeenCalled();
      expect(result.illegalCase).toBe(illegalCase);
    });

    test('throws 404 when report not found', async () => {
      Report.findByIdAndUpdate.mockResolvedValue(null);

      await expect(
        illegalCaseService.markAsReviewed({ reportId: 'bad' })
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ─── createCase ───
  describe('createCase', () => {
    test('creates illegal case from ILLEGAL_FISHING report', async () => {
      Report.findById.mockResolvedValue({ _id: 'r-1', reportType: 'ILLEGAL_FISHING' });
      IllegalCase.findOne.mockResolvedValue(null);
      IllegalCase.create.mockResolvedValue({
        _id: 'case-1',
        title: 'Test Case',
        status: 'OPEN',
      });
      Report.findByIdAndUpdate.mockResolvedValue({});

      const result = await illegalCaseService.createCase({
        reportId: 'r-1',
        payload: {
          title: 'Test Case',
          description: 'Description',
          vesselId: 'IMO-1234567',
          vesselType: 'Trawler',
          severity: 'HIGH',
        },
        actorId: 'admin-1',
      });

      expect(result._id).toBe('case-1');
      expect(IllegalCase.create).toHaveBeenCalledWith(expect.objectContaining({
        baseReport: 'r-1',
        title: 'Test Case',
        status: 'OPEN',
        createdBy: 'admin-1',
      }));
      expect(Report.findByIdAndUpdate).toHaveBeenCalledWith(
        'r-1',
        { $set: { status: 'VERIFIED' } },
        expect.anything()
      );
    });

    test('throws 404 if report not found', async () => {
      Report.findById.mockResolvedValue(null);

      await expect(
        illegalCaseService.createCase({ reportId: 'bad', payload: {}, actorId: 'a' })
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    test('throws 400 if report is not ILLEGAL_FISHING', async () => {
      Report.findById.mockResolvedValue({ _id: 'r-1', reportType: 'HAZARD' });

      await expect(
        illegalCaseService.createCase({ reportId: 'r-1', payload: {}, actorId: 'a' })
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    test('throws 409 if case already exists for report', async () => {
      Report.findById.mockResolvedValue({ _id: 'r-1', reportType: 'ILLEGAL_FISHING' });
      IllegalCase.findOne.mockResolvedValue({ _id: 'existing' });

      await expect(
        illegalCaseService.createCase({ reportId: 'r-1', payload: {}, actorId: 'a' })
      ).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  // ─── updateCase ───
  describe('updateCase', () => {
    test('updates case when status is OPEN', async () => {
      const illegalCase = {
        _id: 'case-1',
        status: 'OPEN',
        save: jest.fn().mockResolvedValue(true),
      };
      IllegalCase.findById.mockResolvedValue(illegalCase);

      const result = await illegalCaseService.updateCase({
        caseId: 'case-1',
        payload: { title: 'Updated Title', severity: 'CRITICAL' },
      });

      expect(illegalCase.title).toBe('Updated Title');
      expect(illegalCase.severity).toBe('CRITICAL');
      expect(illegalCase.save).toHaveBeenCalled();
    });

    test('throws 404 when case not found', async () => {
      IllegalCase.findById.mockResolvedValue(null);

      await expect(
        illegalCaseService.updateCase({ caseId: 'bad', payload: {} })
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    test('throws 403 when case is not OPEN', async () => {
      IllegalCase.findById.mockResolvedValue({ _id: 'case-1', status: 'ESCALATED' });

      await expect(
        illegalCaseService.updateCase({ caseId: 'case-1', payload: {} })
      ).rejects.toMatchObject({ statusCode: 403 });
    });
  });

  // ─── deleteCase ───
  describe('deleteCase', () => {
    test('deletes case when not escalated', async () => {
      IllegalCase.findById.mockResolvedValue({ _id: 'case-1', status: 'OPEN' });
      IllegalCase.findByIdAndDelete.mockResolvedValue({});

      const result = await illegalCaseService.deleteCase({ caseId: 'case-1' });

      expect(result.id).toBe('case-1');
    });

    test('throws 403 when case is escalated', async () => {
      IllegalCase.findById.mockResolvedValue({ _id: 'case-1', status: 'ESCALATED' });

      await expect(
        illegalCaseService.deleteCase({ caseId: 'case-1' })
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    test('throws 404 when case not found', async () => {
      IllegalCase.findById.mockResolvedValue(null);

      await expect(
        illegalCaseService.deleteCase({ caseId: 'bad' })
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ─── escalateCase ───
  describe('escalateCase', () => {
    test('escalates case to officer', async () => {
      const illegalCase = {
        _id: 'case-1',
        status: 'OPEN',
        trackButtonUsed: true,
        baseReport: 'report-1',
        severity: 'HIGH',
        save: jest.fn().mockResolvedValue(true),
      };
      IllegalCase.findById.mockResolvedValueOnce(illegalCase);
      User.findById.mockResolvedValue({ _id: 'officer-1', role: 'OFFICER' });
      Report.findByIdAndUpdate.mockResolvedValue({});
      Enforcement.findOneAndUpdate.mockResolvedValue({});
      IllegalCase.findById.mockReturnValueOnce({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({ _id: 'case-1', status: 'ESCALATED' }),
      });

      const result = await illegalCaseService.escalateCase({
        caseId: 'case-1',
        officerId: 'officer-1',
        actorId: 'admin-1',
      });

      expect(illegalCase.status).toBe('ESCALATED');
      expect(illegalCase.assignedOfficer).toBe('officer-1');
      expect(illegalCase.save).toHaveBeenCalled();
    });

    test('throws 409 when case is already escalated', async () => {
      IllegalCase.findById.mockResolvedValue({ status: 'ESCALATED' });

      await expect(
        illegalCaseService.escalateCase({ caseId: 'c-1', officerId: 'o-1', actorId: 'a' })
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    test('throws 403 when case is resolved', async () => {
      IllegalCase.findById.mockResolvedValue({ status: 'RESOLVED' });

      await expect(
        illegalCaseService.escalateCase({ caseId: 'c-1', officerId: 'o-1', actorId: 'a' })
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    test('throws 400 when vessel not tracked yet', async () => {
      IllegalCase.findById.mockResolvedValue({ status: 'OPEN', trackButtonUsed: false });

      await expect(
        illegalCaseService.escalateCase({ caseId: 'c-1', officerId: 'o-1', actorId: 'a' })
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    test('throws 400 when no officerId provided', async () => {
      IllegalCase.findById.mockResolvedValue({ status: 'OPEN', trackButtonUsed: true });

      await expect(
        illegalCaseService.escalateCase({ caseId: 'c-1', officerId: null, actorId: 'a' })
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    test('throws 400 when officer user is not valid', async () => {
      IllegalCase.findById.mockResolvedValue({ status: 'OPEN', trackButtonUsed: true });
      User.findById.mockResolvedValue({ _id: 'u-1', role: 'FISHERMAN' });

      await expect(
        illegalCaseService.escalateCase({ caseId: 'c-1', officerId: 'u-1', actorId: 'a' })
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  // ─── resolveCase ───
  describe('resolveCase', () => {
    test('resolves case and updates report', async () => {
      const illegalCase = {
        _id: 'case-1',
        status: 'ESCALATED',
        baseReport: 'report-1',
        save: jest.fn().mockResolvedValue(true),
      };
      IllegalCase.findById.mockResolvedValue(illegalCase);
      Report.findByIdAndUpdate.mockResolvedValue({});

      const result = await illegalCaseService.resolveCase({ caseId: 'case-1' });

      expect(result.status).toBe('RESOLVED');
      expect(result.isReviewed).toBe(true);
      expect(Report.findByIdAndUpdate).toHaveBeenCalledWith(
        'report-1',
        { $set: { status: 'RESOLVED' } },
        expect.anything()
      );
    });

    test('throws 404 when case not found', async () => {
      IllegalCase.findById.mockResolvedValue(null);

      await expect(
        illegalCaseService.resolveCase({ caseId: 'bad' })
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ─── trackVessel ───
  describe('trackVessel', () => {
    test('tracks vessel using external API', async () => {
      IllegalCase.findById.mockResolvedValue({
        _id: 'case-1',
        severity: 'HIGH',
        trackButtonUsed: false,
      });
      axios.get.mockResolvedValue({
        data: {
          imo: 'IMO3218739',
          vesselType: 'Bottom Trawler',
          registeredOwner: 'Ocean Harvest Ltd',
          riskCategory: 'high',
        },
      });
      IllegalCase.findByIdAndUpdate.mockResolvedValue({});

      const result = await illegalCaseService.trackVessel({ caseId: 'case-1' });

      expect(result.vesselData.imo).toBe('IMO3218739');
      expect(result.dataSource).toBe('external_api');
      expect(result.severity).toBe('HIGH');
    });

    test('falls back to static data when API returns invalid response', async () => {
      IllegalCase.findById.mockResolvedValue({
        _id: 'case-1',
        severity: 'LOW',
        trackButtonUsed: false,
      });
      axios.get.mockResolvedValue({ data: 'not a vessel object' });
      IllegalCase.findByIdAndUpdate.mockResolvedValue({});

      const result = await illegalCaseService.trackVessel({ caseId: 'case-1' });

      expect(result.dataSource).toBe('fallback');
      expect(result.vesselData.imo).toBe('IMO2219835');
    });

    test('falls back when API call fails', async () => {
      IllegalCase.findById.mockResolvedValue({
        _id: 'case-1',
        severity: 'MEDIUM',
        trackButtonUsed: false,
      });
      axios.get.mockRejectedValue(new Error('Network error'));
      IllegalCase.findByIdAndUpdate.mockResolvedValue({});

      const result = await illegalCaseService.trackVessel({ caseId: 'case-1' });

      expect(result.dataSource).toBe('fallback');
    });

    test('throws 409 when vessel already tracked', async () => {
      IllegalCase.findById.mockResolvedValue({
        _id: 'case-1',
        trackButtonUsed: true,
      });

      await expect(
        illegalCaseService.trackVessel({ caseId: 'case-1' })
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    test('throws 404 when case not found', async () => {
      IllegalCase.findById.mockResolvedValue(null);

      await expect(
        illegalCaseService.trackVessel({ caseId: 'bad' })
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ─── addNote ───
  describe('addNote', () => {
    test('adds note to case', async () => {
      IllegalCase.findByIdAndUpdate.mockResolvedValue({
        _id: 'case-1',
        reviewNotes: [{ content: 'Test note' }],
      });

      const result = await illegalCaseService.addNote({ caseId: 'case-1', content: 'Test note' });

      expect(result.reviewNotes).toHaveLength(1);
      expect(IllegalCase.findByIdAndUpdate).toHaveBeenCalledWith(
        'case-1',
        { $push: { reviewNotes: expect.objectContaining({ content: 'Test note' }) } },
        expect.anything()
      );
    });

    test('throws 404 when case not found', async () => {
      IllegalCase.findByIdAndUpdate.mockResolvedValue(null);

      await expect(
        illegalCaseService.addNote({ caseId: 'bad', content: 'note' })
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ─── getOfficers ───
  describe('getOfficers', () => {
    test('returns active officers', async () => {
      User.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([{ name: 'Officer 1' }]),
      });

      const result = await illegalCaseService.getOfficers();

      expect(result).toHaveLength(1);
      expect(User.find).toHaveBeenCalledWith({ role: 'OFFICER', isActive: true });
    });
  });
});
