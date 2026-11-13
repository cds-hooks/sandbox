import formatPatientName from '../../src/utils/patient-name';

describe('formatPatientName', () => {
  it('joins given and family names', () => {
    expect(formatPatientName([{ given: ['Casimira', 'Ann'], family: 'Nicolas' }])).toEqual('Casimira Ann Nicolas');
  });

  it('handles DSTU2 family name arrays', () => {
    expect(formatPatientName([{ given: ['Daniel'], family: ['X', 'Adams'] }])).toEqual('Daniel X Adams');
  });

  it('handles a name with only a family part', () => {
    expect(formatPatientName([{ family: 'Nicolas' }])).toEqual('Nicolas');
  });

  it('falls back to the text of the name', () => {
    expect(formatPatientName([{ text: 'Casimira Nicolas' }])).toEqual('Casimira Nicolas');
  });

  it('returns Unknown for names with no parts', () => {
    expect(formatPatientName([{ use: 'official' }])).toEqual('Unknown');
    expect(formatPatientName([])).toEqual('Unknown');
    expect(formatPatientName(undefined)).toEqual('Unknown');
  });
});
