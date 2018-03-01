import * as types from './action-types';

export function setLoadingStatus(status) {
  return {
    type: types.SET_LOADING_STATUS,
    isLoaderOn: status,
  };
}

export function setContextVisibility() {
  return {
    type: types.SET_CONTEXT_VISIBILITY,
  };
}
