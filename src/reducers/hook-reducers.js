import * as types from '../actions/action-types';

const initialState = {
  currentHook: 'patient-view',
  isLoadingData: false,
  isContextVisible: true,
};

const hookReducers = (state = initialState, action) => {
  if (action.type) {
    switch (action.type) {
      // Set status for data loading in application
      case types.SET_LOADING_STATUS: {
        return Object.assign({}, state, { isLoadingData: action.isLoaderOn });
      }

      // Set status for slideout context view visibility
      case types.SET_CONTEXT_VISIBILITY: {
        return Object.assign({}, state, { isContextVisible: !state.isContextVisible });
      }

      // Set hook for the application
      case types.SET_HOOK: {
        return Object.assign({}, state, { currentHook: action.hook });
      }
      default:
        return state;
    }
  }
  return state;
};

export default hookReducers;
