/* eslint import/prefer-default-export: 0 */

import * as types from './action-types';

export function storeExchange(url, request, response) {
  return {
    type: types.STORE_SERVICE_EXCHANGE,
    url,
    request,
    response,
  };
}
