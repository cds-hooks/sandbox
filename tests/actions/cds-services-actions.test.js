import * as types from '../../src/actions/action-types';
import * as actions from '../../src/actions/cds-services-actions';

describe('CDS Services Actions', () => {
  it('creates action to signal the retrieval of CDS Service Discovery endpoints', () => {
    const url = 'http://example.com/cds-services';
    const expectedAction = {
      type: types.DISCOVER_CDS_SERVICES,
      testUrl: url,
    };

    expect(actions.signalRetrievingServices(url)).toEqual(expectedAction);
  });

  it('creates action to signal a successful connection to CDS Services', () => {
    const services = { hook: 'patient-view', id: 'example-service' };
    const expectedAction = {
      type: types.DISCOVER_CDS_SERVICES_SUCCESS,
      services,
    };

    expect(actions.signalSuccessServicesRetrieval(services)).toEqual(expectedAction);
  });

  it('creates action to signal a failed connection to CDS Services', () => {
    const expectedAction = {
      type: types.DISCOVER_CDS_SERVICES_FAILURE,
    };

    expect(actions.signalFailureServicesRetrieval()).toEqual(expectedAction);
  });
});
