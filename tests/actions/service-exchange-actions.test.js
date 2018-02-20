import * as types from '../../src/actions/action-types';
import * as actions from '../../src/actions/service-exchange-actions';

describe('Service Exchange Actions', () => {
  it('creates action to signal a successful request/response exchange for a CDS Service', () => {
    const request = 'request';
    const response = 'response';
    const url = 'http://example.com/cds-services/id-1';
    const expectedAction = {
      type: types.STORE_SERVICE_EXCHANGE,
      url,
      request,
      response
    };

    expect(actions.storeExchange(url, request, response)).toEqual(expectedAction);
  });
});
