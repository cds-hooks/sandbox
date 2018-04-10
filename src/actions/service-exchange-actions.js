import * as types from './action-types';

export function storeExchange(url, request, response) {
  return {
    type: types.STORE_SERVICE_EXCHANGE,
    url,
    request,
    response,
  };
}

export function selectService(service) {
  return {
    type: types.SELECT_SERVICE_CONTEXT,
    service,
  };
}
