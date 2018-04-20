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
 * @param discoveryUrl - Discovery endpoint URL
 * @returns {{type, services: *}} - Action to dispatch
 */
export function signalSuccessServicesRetrieval(services, discoveryUrl) {
  return {
    type: types.DISCOVER_CDS_SERVICES_SUCCESS,
    services,
    discoveryUrl,
  };
}

/**
 * Signals failed retrieval of CDS Services. May be used to update state to show an error banner.
 * @returns {{type}} - Action to dispatch
 */
export function signalFailureServicesRetrieval() {
  return {
    type: types.DISCOVER_CDS_SERVICES_FAILURE,
  };
}

/**
 * Signals to reset configured services and stored request/response exchanges.
 * @returns {{type}} - Action to dispatch
 */
export function resetServices() {
  return {
    type: types.RESET_SERVICES,
  };
}

/**
 * Signals to toggle the enabled status for a specific CDS Service
 * @param service - Service to toggle enabled status for
 * @returns {{type, service: *}} - Action to dispatch
 */
export function toggleService(service) {
  return {
    type: types.TOGGLE_SERVICE,
    service,
  };
}

/**
 * Signals to remove a specific configured CDS Service
 * @param service - Service to delete
 * @returns {{type, service: *}} - Action to dispatch
 */
export function deleteService(service) {
  return {
    type: types.DELETE_SERVICE,
    service,
  };
}
