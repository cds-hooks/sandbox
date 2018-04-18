import * as types from '../actions/action-types';

const initialState = {
  tempUserJson: null,
  isCardDemoView: false,
};

const cardDemoReducers = (state = initialState, action) => {
  if (action.type) {
    switch (action.type) {
      // Set user-defined JSON for experimental card in card demo view
      case types.STORE_USER_CARD_JSON: {
        return Object.assign({}, state, { tempUserJson: action.userJson });
      }

      // Set status for card demo view or ehr view
      case types.TOGGLE_DEMO_VIEW: {
        return Object.assign({}, state, { isCardDemoView: !state.isCardDemoView });
      }

      default:
        return state;
    }
  }
  return state;
};

export default cardDemoReducers;
