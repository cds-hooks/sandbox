import * as types from './action-types';

/**
 * Signals successful SMART launch authorization flow
 * @param authResponse - data returned from SMART flow, including the accessToken
 * @returns {{type, authResponse: *}} - Action to dispatch
 */
export function signalSuccessSmartAuth(authResponse, metadata) {
  return {
    type: types.SMART_AUTH_SUCCESS,
    authResponse,
    metadata,
  };
}

/**
 * Signals failed SMART launch authorization flow
 * @returns {{type}} - Action to dispatch
 */
export function signalFailureSmartAuth() {
  return {
    type: types.SMART_AUTH_FAILURE,
  };
}
