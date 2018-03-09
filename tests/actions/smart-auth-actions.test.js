import * as types from '../../src/actions/action-types';
import * as actions from '../../src/actions/smart-auth-actions';

describe('Smart Auth Actions', () => {
  it('creates action to signal a successful SMART authorization with a secured FHIR server', () => {
    const authResponse = { foo: 'foo' };
    const metadata = { biz: 'biz' };
    const expectedAction = {
      type: types.SMART_AUTH_SUCCESS,
      authResponse,
      metadata
    };

    expect(actions.signalSuccessSmartAuth(authResponse, metadata)).toEqual(expectedAction);
  });

  it('creates action to signal a failed SMART authorization', () => {
    const expectedAction = {
      type: types.SMART_AUTH_FAILURE,
    };

    expect(actions.signalFailureSmartAuth()).toEqual(expectedAction);
  });
});
