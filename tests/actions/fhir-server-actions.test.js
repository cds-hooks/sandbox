import * as types from '../../src/actions/action-types';
import * as actions from '../../src/actions/fhir-server-actions';

describe('FHIR Server Actions', () => {
  it('creates action to signal successful connection to FHIR server', () => {
    const baseUrl = 'http://example.com/open';
    const metadata = { fhirVersion: '1.0.2' };
    const expectedAction = {
      type: types.GET_FHIR_SERVER_SUCCESS,
      baseUrl,
      metadata,
    };

    expect(actions.signalSuccessFhirServerRetrieval(baseUrl, metadata))
      .toEqual(expectedAction);
  });

  it('creates action to signal failed connection to FHIR server', () => {
    const expectedAction = {
      type: types.GET_FHIR_SERVER_FAILURE,
    };

    expect(actions.signalFailureFhirServerRetrieval())
      .toEqual(expectedAction);
  });
});
