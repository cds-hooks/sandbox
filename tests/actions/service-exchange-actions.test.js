import * as types from '../../src/actions/action-types';
import * as actions from '../../src/actions/service-exchange-actions';

describe('Service Exchange Actions', () => {
  it('creates action to signal a successful request/response exchange for a CDS Service', () => {
    const request = 'request';
    const response = 'response';
    const responseStatus = 200;
    const url = 'http://example.com/cds-services/id-1';
    const expectedAction = {
      type: types.STORE_SERVICE_EXCHANGE,
      url,
      request,
      response,
      responseStatus,
    };

    expect(actions.storeExchange(url, request, response, responseStatus)).toMatchObject(expectedAction);
  });

  it('creates action to set the CDS Service to display a request and response for', () => {
    const service = 'foo-service.com/cds-services/foo';
    const expectedAction = {
      type: types.SELECT_SERVICE_CONTEXT,
      service,
    };

    expect(actions.selectService(service)).toMatchObject(expectedAction);
  });
});
