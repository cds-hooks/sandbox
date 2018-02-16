import * as types from './action-types';

/**
 * Signals retrieval of CDS Services. May be used for updating state to show a loading spinner while app retrieves
 * CDS Services from a test URL.
 *
 * @param testUrl - Discovery endpoint of CDS Services app will try to grab
 * @returns {{type, testUrl: *}} - Action to dispatch
 */
export function signalRetrievingServices(testUrl) {
  return {
    type: types.DISCOVER_CDS_SERVICES,
    testUrl,
  };
}

/**
 * Signals successful retrieval of CDS Services. Used to update state with CDS Services found (definitions).
 * @param services - CDS Services found at discovery endpoint
 * @returns {{type, services: *}} - Action to dispatch
 */
export function signalSuccessServicesRetrieval(services) {
  return {
    type: types.DISCOVER_CDS_SERVICES_SUCCESS,
    services,
  };
}

/**
 * Signals failed retrieval of CDS Services. May be used to update state to show an error banner.
 * @returns {{type, services: *}} - Action to dispatch
 */
export function signalFailureServicesRetrieval() {
  return {
    type: types.DISCOVER_CDS_SERVICES_FAILURE,
  };
}
