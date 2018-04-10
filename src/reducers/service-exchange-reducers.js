import * as types from '../actions/action-types';

const initialState = {
  selectedService: '',
  exchanges: {},
};

const serviceExchangeReducers = (state = initialState, action) => {
  if (action.type) {
    switch (action.type) {
      // Successful call to CDS Service, store the data request and response in-app
      case types.STORE_SERVICE_EXCHANGE: {
        if (action.url && action.request && action.response) {
          const service = {};
          service.request = action.request;
          service.response = action.response;
          const exchanges = Object.assign({}, state.exchanges);
          exchanges[action.url] = service;
          if (state.selectedService) {
            return Object.assign({}, state, { exchanges });
          }
          return Object.assign({}, state, { selectedService: action.url, exchanges });
        }
        break;
      }

      // Select a CDS Service to display exchange context for
      case types.SELECT_SERVICE_CONTEXT: {
        if (action.service && state.selectedService !== action.service) {
          return Object.assign({}, state, { selectedService: action.service });
        }
        break;
      }
      default: {
        return state;
      }
    }
  }
  return state;
};

export default serviceExchangeReducers;
