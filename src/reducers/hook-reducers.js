import * as types from '../actions/action-types';

const initialState = {
  currentHook: 'patient-view',
  isLoadingData: false,
};

const hookReducers = (state = initialState, action) => {
  if (action.type) {
    switch (action.type) {
      // Set status for data loading in application
      case types.SET_LOADING_STATUS: {
        return Object.assign({}, state, { isLoadingData: action.isLoaderOn });
      }
      default:
        return state;
    }
  }
  return state;
};

export default hookReducers;
