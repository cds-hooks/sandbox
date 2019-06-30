/* eslint-disable import/prefer-default-export */

import * as types from './action-types';

/**
 * Sets the current hook for the application when a view is switched
 * @param {*} hook - Hook to switch to
 */
export function setHook(hook, screen) {
  return {
    type: types.SET_HOOK,
    hook,
    screen,
  };
}
