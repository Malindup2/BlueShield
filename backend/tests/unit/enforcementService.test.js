jest.mock('../../src/models/Enforcement');
jest.mock('../../src/models/IllegalCase');
jest.mock('../../src/models/Report');
jest.mock('../../src/models/Evidence');
jest.mock('../../src/models/TeamMember');
jest.mock('../../src/models/User');
jest.mock('../../src/config/cloudinary', () => ({
  uploader: { destroy: jest.fn().mockResolvedValue({ result: 'ok' }) },
}));

const Enforcement = require('../../src/models/Enforcement');
const IllegalCase = require('../../src/models/IllegalCase');
const Report = require('../../src/models/Report');
const Evidence = require('../../src/models/Evidence');
const TeamMember = require('../../src/models/TeamMember');
const User = require('../../src/models/User');
const enforcementService = require('../../src/services/enforcementService');

describe('enforcementService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── create ───
  describe('create', () => {
    test('creates enforcement when case exists and no duplicate', async () => {
      Enforcement.findOne.mockResolvedValue(null);
      IllegalCase.findById.mockResolvedValue({ _id: 'case-1' });
      Enforcement.create.mockResolvedValue({ _id: 'enf-1', relatedCase: 'case-1', leadOfficer: 'officer-1' });

      const result = await enforcementService.create({
        relatedCase: 'case-1',
        leadOfficer: 'officer-1',
        priority: 'HIGH',
        notes: 'Test',
        actorId: 'officer-1',
      });

      expect(Enforcement.create).toHaveBeenCalledWith(expect.objectContaining({
        relatedCase: 'case-1',
        leadOfficer: 'officer-1',
        priority: 'HIGH',
        notes: 'Test',
        updatedBy: 'officer-1',
      }));
      expect(result._id).toBe('enf-1');
    });

    test('throws 409 if enforcement already exists for the case', async () => {
      Enforcement.findOne.mockResolvedValue({ _id: 'existing' });

      await expect(
        enforcementService.create({ relatedCase: 'case-1', leadOfficer: 'officer-1', actorId: 'officer-1' })
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    test('throws 404 if case not found', async () => {
      Enforcement.findOne.mockResolvedValue(null);
      IllegalCase.findById.mockResolvedValue(null);

      await expect(
        enforcementService.create({ relatedCase: 'bad-id', leadOfficer: 'officer-1', actorId: 'officer-1' })
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ─── createFromCase ───
  describe('createFromCase', () => {
    test('delegates to create with correct params', async () => {
      Enforcement.findOne.mockResolvedValue(null);
      IllegalCase.findById.mockResolvedValue({ _id: 'case-1' });
      Enforcement.create.mockResolvedValue({ _id: 'enf-1' });

      await enforcementService.createFromCase({ caseId: 'case-1', officerId: 'officer-1' });

      expect(Enforcement.create).toHaveBeenCalledWith(expect.objectContaining({
        relatedCase: 'case-1',
        leadOfficer: 'officer-1',
      }));
    });
  });

  // ─── list ───
  describe('list', () => {
    test('returns paginated results', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ _id: 'enf-1' }]),
      };
      Enforcement.find.mockReturnValue(mockQuery);
      Enforcement.countDocuments.mockResolvedValue(1);

      const result = await enforcementService.list({ query: { page: '1', limit: '10' } });

      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
    });

    test('filters by leadOfficer for OFFICER role', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };
      Enforcement.find.mockReturnValue(mockQuery);
      Enforcement.countDocuments.mockResolvedValue(0);

      await enforcementService.list({
        query: { page: '1', limit: '10' },
        user: { _id: 'officer-1', role: 'OFFICER' },
      });

      expect(Enforcement.find).toHaveBeenCalledWith(expect.objectContaining({
        leadOfficer: 'officer-1',
      }));
    });

    test('clamps page to minimum 1', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };
      Enforcement.find.mockReturnValue(mockQuery);
      Enforcement.countDocuments.mockResolvedValue(0);

      const result = await enforcementService.list({ query: { page: '0', limit: '10' } });

      expect(result.page).toBe(1);
    });

    test('clamps limit to max 50', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };
      Enforcement.find.mockReturnValue(mockQuery);
      Enforcement.countDocuments.mockResolvedValue(0);

      const result = await enforcementService.list({ query: { page: '1', limit: '100' } });

      expect(result.limit).toBe(50);
    });
  });

  // ─── getById ───
  describe('getById', () => {
    test('returns enforcement when found', async () => {
      const doc = {
        _id: 'enf-1',
        leadOfficer: { _id: { toString: () => 'officer-1' } },
      };
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
      };
      mockQuery.populate.mockReturnValueOnce(mockQuery).mockResolvedValueOnce(doc);
      Enforcement.findById.mockReturnValue(mockQuery);

      const result = await enforcementService.getById('enf-1');

      expect(result._id).toBe('enf-1');
    });

    test('throws 404 when not found', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
      };
      mockQuery.populate.mockReturnValueOnce(mockQuery).mockResolvedValueOnce(null);
      Enforcement.findById.mockReturnValue(mockQuery);

      await expect(enforcementService.getById('bad-id')).rejects.toMatchObject({ statusCode: 404 });
    });

    test('throws 403 for officer accessing another officers case', async () => {
      const doc = {
        _id: 'enf-1',
        leadOfficer: { _id: { toString: () => 'officer-2' } },
      };
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
      };
      mockQuery.populate.mockReturnValueOnce(mockQuery).mockResolvedValueOnce(doc);
      Enforcement.findById.mockReturnValue(mockQuery);

      await expect(
        enforcementService.getById('enf-1', { _id: { toString: () => 'officer-1' }, role: 'OFFICER' })
      ).rejects.toMatchObject({ statusCode: 403 });
    });
  });

  // ─── update ───
  describe('update', () => {
    test('updates enforcement fields', async () => {
      Enforcement.findById.mockResolvedValue({ _id: 'enf-1', leadOfficer: { toString: () => 'officer-1' } });
      Enforcement.findByIdAndUpdate.mockResolvedValue({ _id: 'enf-1', priority: 'CRITICAL' });

      const result = await enforcementService.update({
        enforcementId: 'enf-1',
        payload: { priority: 'CRITICAL' },
        actor: { role: 'OFFICER' },
        actorId: 'officer-1',
      });

      expect(result.priority).toBe('CRITICAL');
    });

    test('throws 404 when enforcement not found', async () => {
      Enforcement.findById.mockResolvedValue(null);

      await expect(
        enforcementService.update({ enforcementId: 'bad', payload: {}, actorId: 'a' })
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    test('throws 403 when officer tries to update another officers case', async () => {
      Enforcement.findById.mockResolvedValue({ _id: 'enf-1', leadOfficer: { toString: () => 'officer-2' } });

      await expect(
        enforcementService.update({
          enforcementId: 'enf-1',
          payload: {},
          actor: { role: 'OFFICER' },
          actorId: 'officer-1',
        })
      ).rejects.toMatchObject({ statusCode: 403 });
    });
  });

  // ─── delete ───
  describe('delete', () => {
    test('deletes enforcement', async () => {
      Enforcement.findById.mockResolvedValue({ _id: 'enf-1', leadOfficer: { toString: () => 'officer-1' } });
      Enforcement.findByIdAndDelete.mockResolvedValue({ _id: 'enf-1' });

      const result = await enforcementService.delete({
        enforcementId: 'enf-1',
        actor: { role: 'SYSTEM_ADMIN' },
        actorId: 'admin-1',
      });

      expect(result._id).toBe('enf-1');
    });

    test('throws 404 when enforcement not found', async () => {
      Enforcement.findById.mockResolvedValue(null);

      await expect(
        enforcementService.delete({ enforcementId: 'bad', actor: {}, actorId: 'a' })
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ─── addAction ───
  describe('addAction', () => {
    test('pushes action to enforcement', async () => {
      const enforcement = {
        _id: 'enf-1',
        leadOfficer: { toString: () => 'officer-1' },
        actions: { push: jest.fn() },
        save: jest.fn().mockResolvedValue(true),
      };
      Enforcement.findById.mockResolvedValue(enforcement);

      await enforcementService.addAction({
        enforcementId: 'enf-1',
        action: { actionType: 'FINE_ISSUED', amount: 5000 },
        actor: { role: 'OFFICER' },
        actorId: 'officer-1',
      });

      expect(enforcement.actions.push).toHaveBeenCalledWith({ actionType: 'FINE_ISSUED', amount: 5000 });
      expect(enforcement.save).toHaveBeenCalled();
    });

    test('throws 404 when enforcement not found', async () => {
      Enforcement.findById.mockResolvedValue(null);

      await expect(
        enforcementService.addAction({ enforcementId: 'bad', action: {}, actorId: 'a' })
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ─── closeEnforcement ───
  describe('closeEnforcement', () => {
    test('closes enforcement and syncs related case and report', async () => {
      Enforcement.findById.mockResolvedValue({
        _id: 'enf-1',
        status: 'OPEN',
        relatedCase: 'case-1',
        leadOfficer: { toString: () => 'officer-1' },
      });
      Enforcement.findByIdAndUpdate.mockResolvedValue({ _id: 'enf-1', status: 'CLOSED_RESOLVED' });
      IllegalCase.findByIdAndUpdate.mockResolvedValue({ _id: 'case-1', baseReport: 'report-1' });
      Report.findByIdAndUpdate.mockResolvedValue({});

      const result = await enforcementService.closeEnforcement({
        enforcementId: 'enf-1',
        outcome: 'FINE_COLLECTED',
        penaltyAmount: 5000,
        notes: 'Closed',
        actor: { role: 'OFFICER' },
        actorId: 'officer-1',
      });

      expect(result.status).toBe('CLOSED_RESOLVED');
      expect(IllegalCase.findByIdAndUpdate).toHaveBeenCalledWith(
        'case-1',
        { $set: { status: 'RESOLVED', isReviewed: true } },
        expect.anything()
      );
      expect(Report.findByIdAndUpdate).toHaveBeenCalledWith(
        'report-1',
        { $set: { status: 'RESOLVED' } },
        expect.anything()
      );
    });

    test('throws 409 when enforcement is already closed', async () => {
      Enforcement.findById.mockResolvedValue({
        _id: 'enf-1',
        status: 'CLOSED_RESOLVED',
        leadOfficer: { toString: () => 'officer-1' },
      });

      await expect(
        enforcementService.closeEnforcement({
          enforcementId: 'enf-1',
          outcome: 'FINE_COLLECTED',
          actor: { role: 'OFFICER' },
          actorId: 'officer-1',
        })
      ).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  // ─── pushRiskAssessment ───
  describe('pushRiskAssessment', () => {
    test('saves risk assessment to enforcement', async () => {
      Enforcement.findByIdAndUpdate.mockResolvedValue({ _id: 'enf-1', aiRiskScore: 80 });

      const result = await enforcementService.pushRiskAssessment({
        enforcementId: 'enf-1',
        assessment: { riskScore: 80, justification: 'High risk', provider: 'Gemini' },
        actorId: 'officer-1',
      });

      expect(result.aiRiskScore).toBe(80);
      expect(Enforcement.findByIdAndUpdate).toHaveBeenCalledWith(
        'enf-1',
        expect.objectContaining({
          $set: expect.objectContaining({ aiRiskScore: 80 }),
          $push: expect.anything(),
        }),
        expect.anything()
      );
    });

    test('throws 404 when enforcement not found', async () => {
      Enforcement.findByIdAndUpdate.mockResolvedValue(null);

      await expect(
        enforcementService.pushRiskAssessment({
          enforcementId: 'bad',
          assessment: { riskScore: 50 },
          actorId: 'a',
        })
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ─── addEvidence ───
  describe('addEvidence', () => {
    test('creates evidence for enforcement', async () => {
      Enforcement.findById.mockResolvedValue({
        _id: 'enf-1',
        leadOfficer: { toString: () => 'officer-1' },
      });
      Evidence.create.mockResolvedValue({ _id: 'evid-1', description: 'Photo' });
      Enforcement.findByIdAndUpdate.mockResolvedValue({});

      const result = await enforcementService.addEvidence({
        enforcementId: 'enf-1',
        evidenceData: { evidenceType: 'PHOTOGRAPH', description: 'Photo' },
        attachments: [],
        actor: { role: 'OFFICER' },
        actorId: 'officer-1',
      });

      expect(result._id).toBe('evid-1');
      expect(Evidence.create).toHaveBeenCalledWith(expect.objectContaining({
        enforcement: 'enf-1',
        evidenceType: 'PHOTOGRAPH',
        collectedBy: 'officer-1',
      }));
    });
  });

  // ─── addTeamMember ───
  describe('addTeamMember', () => {
    test('creates team member when officer is valid', async () => {
      Enforcement.findById.mockResolvedValue({
        _id: 'enf-1',
        leadOfficer: { toString: () => 'lead-1' },
      });

      const mockSelectQuery = { select: jest.fn().mockResolvedValue({ _id: 'officer-2', name: 'John', email: 'john@test.com', role: 'OFFICER' }) };
      User.findOne.mockReturnValue(mockSelectQuery);

      const mockPopulate = {
        populate: jest.fn().mockReturnThis(),
      };
      TeamMember.find.mockReturnValue(mockPopulate);
      mockPopulate.populate.mockResolvedValue([]);

      TeamMember.findOne.mockResolvedValue(null);
      TeamMember.create.mockResolvedValue({ _id: 'member-1', role: 'INVESTIGATOR' });
      Enforcement.findByIdAndUpdate.mockResolvedValue({});

      const result = await enforcementService.addTeamMember({
        enforcementId: 'enf-1',
        teamData: { officerId: 'officer-2', role: 'INVESTIGATOR', department: 'Marine Patrol' },
        actor: { role: 'SYSTEM_ADMIN' },
        actorId: 'lead-1',
      });

      expect(result._id).toBe('member-1');
    });

    test('throws 404 when enforcement not found', async () => {
      Enforcement.findById.mockResolvedValue(null);

      await expect(
        enforcementService.addTeamMember({
          enforcementId: 'bad',
          teamData: { officerId: 'o-1', role: 'INVESTIGATOR' },
          actorId: 'a',
        })
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ─── getBasicStatistics ───
  describe('getBasicStatistics', () => {
    test('returns formatted statistics', async () => {
      Enforcement.aggregate
        .mockResolvedValueOnce([{ _id: 'OPEN', count: 3 }, { _id: 'CLOSED_RESOLVED', count: 2 }])
        .mockResolvedValueOnce([{ _id: 'HIGH', count: 2 }, { _id: 'LOW', count: 3 }])
        .mockResolvedValueOnce([{ _id: 'PENDING', count: 4 }]);
      Enforcement.countDocuments.mockResolvedValue(5);

      const result = await enforcementService.getBasicStatistics();

      expect(result.total).toBe(5);
      expect(result.byStatus.OPEN).toBe(3);
      expect(result.byStatus.CLOSED_RESOLVED).toBe(2);
      expect(result.byPriority.HIGH).toBe(2);
      expect(result.byOutcome.PENDING).toBe(4);
    });
  });

  // ─── getAssignableOfficers ───
  describe('getAssignableOfficers', () => {
    test('returns active officers sorted by name', async () => {
      const mockQuery = { sort: jest.fn().mockResolvedValue([{ name: 'Alice' }, { name: 'Bob' }]) };
      User.find.mockReturnValue({ select: jest.fn().mockReturnValue(mockQuery) });

      const result = await enforcementService.getAssignableOfficers();

      expect(result).toHaveLength(2);
      expect(User.find).toHaveBeenCalledWith({ role: 'OFFICER', isActive: true });
    });
  });
});
