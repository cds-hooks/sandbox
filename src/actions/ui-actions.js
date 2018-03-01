/* eslint import/prefer-default-export: 0 */
import * as types from './action-types';

export function setLoadingStatus(status) {
  return {
    type: types.SET_LOADING_STATUS,
    isLoaderOn: status,
  };
}
