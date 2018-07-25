import * as types from './action-types';

/**
 * Sets the loading status of the application on start-up
 * @param {*} status - Boolean indicating whether or not the loader should be displayed
 */
export function setLoadingStatus(status) {
  return {
    type: types.SET_LOADING_STATUS,
    isLoaderOn: status,
  };
}

/**
 * Toggle action to display/hide the CDS Developer Panel
 */
export function setContextVisibility() {
  return {
    type: types.SET_CONTEXT_VISIBILITY,
  };
}
