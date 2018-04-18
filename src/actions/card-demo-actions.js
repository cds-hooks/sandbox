/* eslint-disable import/prefer-default-export */

import * as types from './action-types';

/**
 * Sets the user-defined JSON in the card demo view
 * @param {*} card - JSON to store
 */
export function storeCardDemoJson(card) {
  return {
    type: types.STORE_USER_CARD_JSON,
    userJson: card,
  };
}

/**
 * Toggles the view from EHR view to demo view and back
 */
export function toggleDemoView() {
  return {
    type: types.TOGGLE_DEMO_VIEW,
  };
}
