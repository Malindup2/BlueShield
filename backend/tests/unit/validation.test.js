const reportValidation = require('../../src/validations/report.validation');
const enforcementValidation = require('../../src/validations/enforcement.validation');
const illegalCaseValidation = require('../../src/validations/illegalCase.validation');
const hazardValidation = require('../../src/validations/hazard.validation');
const zoneValidation = require('../../src/validations/zone.validation');

describe('request validation modules', () => {
  test('report validation rejects missing core fields', () => {
    const result = reportValidation.create({ body: {} });

    expect(result.error).toEqual(expect.arrayContaining(['title is required', 'description is required']));
  });

  test('report validation accepts a valid create payload', () => {
    const result = reportValidation.create({
      body: {
        title: 'Illegal fishing sighting',
        description: 'Suspicious activity near the reef',
        reportType: 'ILLEGAL_FISHING',
        severity: 'HIGH',
        location: { type: 'Point', coordinates: [79.8612, 6.9271] },
        isAnonymous: false,
      },
    });

    expect(result.error).toBeNull();
  });

  test('report validation rejects invalid paging and filters', () => {
    const result = reportValidation.list({ query: { page: '0', limit: '100', status: 'BROKEN' } });

    expect(result.error).toEqual(expect.arrayContaining(['page must be >= 1', 'limit must be 1..50', 'Invalid status']));
  });

  test('enforcement validation accepts boolean-like evidence flags', () => {
    const result = enforcementValidation.addEvidence({
      params: { enforcementId: '507f1f77bcf86cd799439011' },
      body: {
        evidenceType: 'PHOTOGRAPH',
        description: 'Boarding photo',
        isSealed: 'true',
      },
    });

    expect(result.error).toBeNull();
  });

  test('enforcement validation rejects bad action payloads', () => {
    const result = enforcementValidation.addAction({
      params: { enforcementId: 'bad-id' },
      body: { actionType: 'INVALID', amount: -1 },
    });

    expect(result.error).toEqual(expect.arrayContaining(['enforcementId must be a valid ObjectId', 'Invalid actionType', 'amount must be a number >= 0']));
  });

  test('illegal case validation requires vessel data on create', () => {
    const result = illegalCaseValidation.createCase({
      params: { reportId: '507f1f77bcf86cd799439011' },
      body: {
        title: 'Case review',
        description: 'Reviewing the report',
        vesselId: 'IMO-123',
        vesselType: 'Fishing-Boat',
        severity: 'EXTREME',
      },
    });

    expect(result.error).toEqual(expect.arrayContaining([
      'vesselId must be in the format IMO- followed by exactly 7 digits (e.g. IMO-1234567)',
      'vesselType is required and must contain letters only (spaces between words are allowed)',
      'severity is required and must be one of: LOW, MEDIUM, HIGH, CRITICAL',
    ]));
  });

  test('hazard validation rejects resolve via invalid id and payload type', () => {
    const result = hazardValidation.resolve({
      params: { id: 'bad-id' },
      body: { resolutionNote: 123 },
    });

    expect(result.error).toEqual(expect.arrayContaining(['id must be a valid ObjectId', 'resolutionNote must be string']));
  });

  test('zone validation rejects invalid zone creation payload', () => {
    const result = zoneValidation.create({
      body: {
        sourceHazard: 'bad-id',
        zoneType: 'SAFE',
        warningMessage: ' ',
        radius: 5,
      },
    });

    expect(result.error).toEqual(expect.arrayContaining([
      'sourceHazard is required (ObjectId)',
      'zoneType must be RESTRICTED or DANGEROUS',
      'warningMessage is required (string)',
      'radius must be a number between 10 and 50000 meters',
    ]));
  });
});
