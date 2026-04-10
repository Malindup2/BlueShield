jest.mock('../../src/models/User');
jest.mock('../../src/models/IllegalCase');
jest.mock('../../src/models/Report');
jest.mock('../../src/services/enforcementService');
jest.mock('../../src/services/geminiService', () => ({
  analyseEnforcementRisk: jest.fn(),
}));
jest.mock('../../src/middlewares/upload', () => ({
  uploadEvidence: (req, res, next) => next(),
}));

const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');
const IllegalCase = require('../../src/models/IllegalCase');
const Report = require('../../src/models/Report');
const enforcementService = require('../../src/services/enforcementService');
const geminiService = require('../../src/services/geminiService');

const officerToken = () => jwt.sign({ id: 'officer-1' }, process.env.JWT_SECRET);

const mockOfficerAuth = () => {
  User.findById.mockReturnValue({
    select: jest.fn().mockResolvedValue({ _id: 'officer-1', role: 'OFFICER', name: 'Officer One' }),
  });
};

describe('officer enforcement workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    mockOfficerAuth();
  });

  test('creates an enforcement from a reviewed case', async () => {
    enforcementService.createFromCase.mockResolvedValue({ _id: 'enf-1', relatedCase: 'case-1' });

    const response = await request(app)
      .post('/api/enforcements/from-case/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${officerToken()}`)
      .send();

    expect(response.status).toBe(201);
    expect(enforcementService.createFromCase).toHaveBeenCalledWith({
      caseId: '507f1f77bcf86cd799439011',
      officerId: 'officer-1',
    });
    expect(response.body).toEqual({ _id: 'enf-1', relatedCase: 'case-1' });
  });

  test('lists officer enforcements', async () => {
    enforcementService.list.mockResolvedValue({ page: 1, limit: 10, total: 1, items: [{ _id: 'enf-1' }] });

    const response = await request(app)
      .get('/api/enforcements?page=1&limit=10')
      .set('Authorization', `Bearer ${officerToken()}`);

    expect(response.status).toBe(200);
    expect(enforcementService.list).toHaveBeenCalledWith({ 
      query: { page: '1', limit: '10' },
      user: { _id: 'officer-1', role: 'OFFICER', name: 'Officer One' }
    });
    expect(response.body.total).toBe(1);
  });

  test('creates an enforcement with the officer as lead officer', async () => {
    enforcementService.create.mockResolvedValue({ _id: 'enf-2', relatedCase: 'case-2', leadOfficer: 'officer-1' });

    const response = await request(app)
      .post('/api/enforcements')
      .set('Authorization', `Bearer ${officerToken()}`)
      .send({
        relatedCase: '507f1f77bcf86cd799439011',
        priority: 'HIGH',
        notes: 'Officer workflow test',
      });

    expect(response.status).toBe(201);
    expect(enforcementService.create).toHaveBeenCalledWith(expect.objectContaining({
      relatedCase: '507f1f77bcf86cd799439011',
      priority: 'HIGH',
      notes: 'Officer workflow test',
      leadOfficer: 'officer-1',
      actorId: 'officer-1',
    }));
  });

  test('adds an enforcement action and closes the case', async () => {
    enforcementService.addAction.mockResolvedValue({ _id: 'enf-3', actions: [{ actionType: 'FINE_ISSUED' }] });
    enforcementService.closeEnforcement.mockResolvedValue({ _id: 'enf-3', status: 'CLOSED_RESOLVED' });

    const addActionResponse = await request(app)
      .post('/api/enforcements/507f1f77bcf86cd799439011/actions')
      .set('Authorization', `Bearer ${officerToken()}`)
      .send({ actionType: 'FINE_ISSUED', description: 'Issued a fine', amount: 2500 });

    expect(addActionResponse.status).toBe(200);
    expect(enforcementService.addAction).toHaveBeenCalledWith(expect.objectContaining({
      enforcementId: '507f1f77bcf86cd799439011',
      actorId: 'officer-1',
    }));

    const closeResponse = await request(app)
      .patch('/api/enforcements/507f1f77bcf86cd799439011/close')
      .set('Authorization', `Bearer ${officerToken()}`)
      .send({ outcome: 'FINE_COLLECTED', penaltyAmount: 2500, notes: 'Closed by officer workflow test' });

    expect(closeResponse.status).toBe(200);
    expect(enforcementService.closeEnforcement).toHaveBeenCalledWith(expect.objectContaining({
      enforcementId: '507f1f77bcf86cd799439011',
      outcome: 'FINE_COLLECTED',
      penaltyAmount: 2500,
      notes: 'Closed by officer workflow test',
      actorId: 'officer-1',
    }));
  });

  test('handles evidence and team workflow endpoints', async () => {
    enforcementService.addEvidence.mockResolvedValue({ _id: 'evid-1', description: 'Photo evidence' });
    enforcementService.getEvidenceByEnforcement.mockResolvedValue([{ _id: 'evid-1' }]);
    enforcementService.addTeamMember.mockResolvedValue({ _id: 'member-1', role: 'INVESTIGATOR' });
    enforcementService.getTeamByEnforcement.mockResolvedValue([{ _id: 'member-1' }]);

    const evidenceCreateResponse = await request(app)
      .post('/api/enforcements/507f1f77bcf86cd799439011/evidence')
      .set('Authorization', `Bearer ${officerToken()}`)
      .send({
        evidenceType: 'PHOTOGRAPH',
        description: 'Boarding photo',
        isSealed: 'true',
      });

    expect(evidenceCreateResponse.status).toBe(201);
    expect(enforcementService.addEvidence).toHaveBeenCalledWith(expect.objectContaining({
      enforcementId: '507f1f77bcf86cd799439011',
      actorId: 'officer-1',
      evidenceData: expect.objectContaining({ isSealed: true }),
    }));

    const evidenceListResponse = await request(app)
      .get('/api/enforcements/507f1f77bcf86cd799439011/evidence')
      .set('Authorization', `Bearer ${officerToken()}`);

    expect(evidenceListResponse.status).toBe(200);
    expect(enforcementService.getEvidenceByEnforcement).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      { _id: 'officer-1', role: 'OFFICER', name: 'Officer One' }
    );

    const teamCreateResponse = await request(app)
      .post('/api/enforcements/507f1f77bcf86cd799439011/team')
      .set('Authorization', `Bearer ${officerToken()}`)
      .send({
        officerId: '507f1f77bcf86cd799439012',
        role: 'INVESTIGATOR',
        department: 'Marine Patrol',
      });

    expect(teamCreateResponse.status).toBe(201);
    expect(enforcementService.addTeamMember).toHaveBeenCalledWith(expect.objectContaining({
      enforcementId: '507f1f77bcf86cd799439011',
      actorId: 'officer-1',
    }));

    const teamListResponse = await request(app)
      .get('/api/enforcements/507f1f77bcf86cd799439011/team')
      .set('Authorization', `Bearer ${officerToken()}`);

    expect(teamListResponse.status).toBe(200);
    expect(enforcementService.getTeamByEnforcement).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      { _id: 'officer-1', role: 'OFFICER', name: 'Officer One' }
    );
  });

  test('generates a risk score for the officer workflow', async () => {
    enforcementService.getById.mockResolvedValue({ _id: 'enf-4', relatedCase: { _id: 'case-4' } });
    IllegalCase.findById.mockResolvedValue({
      baseReport: 'report-4',
      vesselId: 'IMO-1234567',
      severity: 'HIGH',
      description: 'Illegal fishing case',
      trackedVesselData: { flag: 'LK' },
    });
    Report.findById.mockResolvedValue({
      description: 'Suspicious vessel near the reef',
      location: { address: 'Southern coast' },
    });
    geminiService.analyseEnforcementRisk.mockResolvedValue({
      riskScore: 87,
      riskLevel: 'HIGH',
      justification: 'Pattern matches previous incidents',
      recommendedActions: ['Monitor', 'Escalate'],
    });
    enforcementService.pushRiskAssessment.mockResolvedValue({ _id: 'enf-4', aiRiskScore: 87 });

    const response = await request(app)
      .post('/api/enforcements/507f1f77bcf86cd799439011/risk-score')
      .set('Authorization', `Bearer ${officerToken()}`)
      .send();

    expect(response.status).toBe(200);
    expect(geminiService.analyseEnforcementRisk).toHaveBeenCalledWith(expect.objectContaining({
      vesselName: 'IMO-1234567',
      flagState: 'LK',
      severity: 'HIGH',
      description: 'Suspicious vessel near the reef',
      locationName: 'Southern coast',
    }));
    expect(enforcementService.pushRiskAssessment).toHaveBeenCalledWith(expect.objectContaining({
      enforcementId: 'enf-4',
      actorId: 'officer-1',
    }));
  });

  test('blocks fisherman users from officer enforcement routes', async () => {
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: 'fisher-1', role: 'FISHERMAN', name: 'Fisher One' }),
    });

    const response = await request(app)
      .get('/api/enforcements')
      .set('Authorization', `Bearer ${jwt.sign({ id: 'fisher-1' }, process.env.JWT_SECRET)}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/Forbidden/);
  });
});
