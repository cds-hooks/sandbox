import * as types from './action-types';

/**
 * Stores the entire CDS service exchange between Sandbox and the service endpoint from the request to response in the Redux store
 *
 * @param {*} url - String CDS service endpoint
 * @param {*} request - Object representing the request sent to the CDS service endpoint
 * @param {*} response - Object (if any) representing the response sent to the Sandbox from the CDS service
 * @param {*} responseStatus - Number representing the response status
 */
export function storeExchange(url, request, response, responseStatus) {
  return {
    type: types.STORE_SERVICE_EXCHANGE,
    url,
    request,
    response,
    responseStatus,
  };
}

/**
 * Stores the selected service to display a CDS service exchange for (the dropdown on the CDS Developer Panel)
 *
 * @param {*} service - String CDS service endpoint to display the request/response for
 */
export function selectService(service) {
  return {
    type: types.SELECT_SERVICE_CONTEXT,
    service,
  };
}
