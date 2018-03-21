import * as types from './action-types';

export function storeExchange(url, request, response, responseStatus) {
  return {
    type: types.STORE_SERVICE_EXCHANGE,
    url,
    request,
    response,
    responseStatus,
  };
}

export function selectService(service) {
  return {
    type: types.SELECT_SERVICE_CONTEXT,
    service,
  };
}
